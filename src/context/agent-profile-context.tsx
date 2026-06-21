import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { getAgentProfile, updateAgentStatus, type AgentStatus } from '@/services/agent-api';
import { registerForPushNotificationsAsync } from '@/utils/notifications';

interface AgentProfileValue {
  agentId:       string;
  agentName:     string;
  zone:          string;
  rating:        number;
  status:        AgentStatus;
  statusLoading: boolean;
  toggleStatus:  () => Promise<void>;
}

const AgentProfileContext = createContext<AgentProfileValue | null>(null);

export function AgentProfileProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();

  const [agentId,       setAgentId]       = useState('—');
  const [agentName,     setAgentName]     = useState('');
  const [zone,          setZone]          = useState('');
  const [rating,        setRating]        = useState(5.0);
  const [status,        setStatus]        = useState<AgentStatus>('available');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (!session) {
      setAgentId('—'); setAgentName(''); setZone(''); setStatus('available');
      return;
    }
    getAgentProfile(session.userId, session.token)
      .then(p => {
        setAgentId(p.id);
        setAgentName(p.name || '');
        setZone(p.zone || '');
        setRating(p.rating);
        setStatus(p.status);
      })
      .catch(() => {});
    registerForPushNotificationsAsync().catch(() => {});
  }, [session]);

  const toggleStatus = useCallback(async () => {
    if (!session || statusLoading || status === 'on_delivery') return;
    const next: AgentStatus = status === 'available' ? 'offline' : 'available';
    setStatusLoading(true);
    try {
      const updated = await updateAgentStatus(session.userId, next, session.token);
      setStatus(updated.status);
    } catch {
      // keep current on error
    } finally {
      setStatusLoading(false);
    }
  }, [session, status, statusLoading]);

  return (
    <AgentProfileContext.Provider value={{ agentId, agentName, zone, rating, status, statusLoading, toggleStatus }}>
      {children}
    </AgentProfileContext.Provider>
  );
}

export function useAgentProfile() {
  const ctx = useContext(AgentProfileContext);
  if (!ctx) throw new Error('useAgentProfile must be used inside AgentProfileProvider');
  return ctx;
}
