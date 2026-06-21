import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { listOrders, updateOrderStatus, verifyDeliveryOtp, type Order } from '@/services/order-api';
import { useAuth } from '@/context/auth-context';
import { fireLocalNotification } from '@/utils/notifications';

interface DeliveryContextValue {
  pendingOrders:    Order[];
  activeDelivery:   Order | null;
  completedToday:   Order[];
  newAlertOrder:    Order | null;
  loading:          boolean;
  refresh:          () => Promise<void>;
  acceptDelivery:   (orderId: string) => Promise<void>;
  markPickedUp:     (orderId: string) => Promise<void>;
  markDelivered:    (orderId: string) => Promise<void>;
  confirmDelivery:  (orderId: string, otp: string) => Promise<void>;
  dismissAlert:     () => void;
}

const DeliveryContext = createContext<DeliveryContextValue | null>(null);

const POLL_INTERVAL = 30_000;

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [pendingOrders,  setPendingOrders]  = useState<Order[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<Order | null>(null);
  const [completedToday, setCompletedToday] = useState<Order[]>([]);
  const [newAlertOrder,  setNewAlertOrder]  = useState<Order | null>(null);
  const [loading,        setLoading]        = useState(false);
  const prevPendingIds  = useRef<Set<string>>(new Set());
  const hasInitialized  = useRef(false);
  const pollTimer       = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [accepted, dispatched, delivered] = await Promise.all([
        listOrders({ status: 'accepted' }),
        listOrders({ status: 'dispatched', agentId: session.userId }),
        listOrders({ status: 'delivered',  agentId: session.userId }),
      ]);

      const incomingNew = accepted.filter(o => !prevPendingIds.current.has(o.id));
      if (incomingNew.length > 0) {
        setNewAlertOrder(incomingNew[0]);
        if (hasInitialized.current) {
          fireLocalNotification(
            '🛵 New delivery ready!',
            `${incomingNew.length} pickup${incomingNew.length > 1 ? 's' : ''} waiting — tap to view`,
            { screen: 'deliveries' },
          );
        }
      }

      hasInitialized.current = true;
      prevPendingIds.current = new Set(accepted.map(o => o.id));
      setPendingOrders(accepted);
      setActiveDelivery(dispatched[0] ?? null);

      const today = new Date().toDateString();
      setCompletedToday(delivered.filter(o => new Date(o.updatedAt).toDateString() === today));
    } catch {
      // Silent — keep stale data on network error
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    refresh();
    pollTimer.current = setInterval(refresh, POLL_INTERVAL);

    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        if (!pollTimer.current) pollTimer.current = setInterval(refresh, POLL_INTERVAL);
      } else {
        if (pollTimer.current) { clearInterval(pollTimer.current); pollTimer.current = null; }
      }
    });

    return () => {
      sub.remove();
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [session, refresh]);

  const acceptDelivery = useCallback(async (orderId: string) => {
    if (!session) return;
    await updateOrderStatus(orderId, 'dispatched', session.userId);
    await refresh();
  }, [session, refresh]);

  const markPickedUp = useCallback(async (orderId: string) => {
    await updateOrderStatus(orderId, 'dispatched');
    await refresh();
  }, [refresh]);

  const markDelivered = useCallback(async (orderId: string) => {
    if (!session) return;
    await updateOrderStatus(orderId, 'delivered', session.userId);
    await refresh();
  }, [session, refresh]);

  const confirmDelivery = useCallback(async (orderId: string, otp: string) => {
    await verifyDeliveryOtp(orderId, otp);
    await refresh();
  }, [refresh]);

  const dismissAlert = useCallback(() => setNewAlertOrder(null), []);

  return (
    <DeliveryContext.Provider value={{
      pendingOrders, activeDelivery, completedToday,
      newAlertOrder, loading,
      refresh, acceptDelivery, markPickedUp, markDelivered, confirmDelivery, dismissAlert,
    }}>
      {children}
    </DeliveryContext.Provider>
  );
}

export function useDelivery() {
  const ctx = useContext(DeliveryContext);
  if (!ctx) throw new Error('useDelivery must be used inside DeliveryProvider');
  return ctx;
}
