import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import type { Order } from '@/services/order-api';

interface Props {
  order:    Order | null;
  onAccept: (orderId: string) => void;
  onDecline: () => void;
}

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';

export function DeliveryAlertModal({ order, onAccept, onDecline }: Props) {
  const c       = useAppColors();
  const s       = makeStyles(c);
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (order) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, bounciness: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [order]);

  if (!order) return null;

  const addr  = order.deliveryAddress;
  const total = (order.totalAmount / 100).toFixed(2);

  return (
    <Modal visible={!!order} transparent animationType="none" statusBarTranslucent onRequestClose={onDecline}>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>

          <View style={s.alertBadge}>
            <Text style={s.alertIcon}>🦊</Text>
            <Text style={s.alertText}>New Delivery Request!</Text>
          </View>

          <Text style={s.orderRef}>Order #{order.id.slice(-8).toUpperCase()}</Text>

          <View style={s.infoGrid}>
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>📦 Pick Up From</Text>
              <Text style={s.infoVal}>{order.sellerName}</Text>
              <Text style={s.infoSub}>{order.sellerLocation}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.infoBlock}>
              <Text style={s.infoLabel}>🏠 Deliver To</Text>
              <Text style={s.infoVal}>{addr.name}</Text>
              <Text style={s.infoSub}>{addr.city}, {addr.pincode}</Text>
            </View>
          </View>

          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Items</Text>
              <Text style={s.metaVal}>{order.items.length}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Value</Text>
              <Text style={s.metaVal}>₹{total}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Payment</Text>
              <Text style={[s.metaVal, { color: order.paymentMethod === 'cod' ? ACCENT : PRIMARY }]}>
                {order.paymentMethod === 'cod' ? 'COD' : 'Pre-paid'}
              </Text>
            </View>
          </View>

          <View style={s.actions}>
            <Pressable style={s.declineBtn} onPress={onDecline}>
              <Text style={s.declineTxt}>✕  Skip</Text>
            </Pressable>
            <Pressable style={s.acceptBtn} onPress={() => onAccept(order.id)}>
              <Text style={s.acceptTxt}>✓  Accept</Text>
            </Pressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: {
      backgroundColor: c.bg, borderRadius: 24, padding: 20, width: '100%',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25, shadowRadius: 20, elevation: 16,
    },
    alertBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: ACCENT + '22', borderRadius: 12,
      paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14,
      borderWidth: 1, borderColor: ACCENT + '44', alignSelf: 'flex-start',
    },
    alertIcon: { fontSize: 20 },
    alertText: { fontSize: 14, fontWeight: '700', color: ACCENT },
    orderRef:  { fontSize: 12, fontWeight: '600', color: c.textMuted, marginBottom: 14 },

    infoGrid:  { flexDirection: 'row', gap: 0, marginBottom: 14 },
    infoBlock: { flex: 1, paddingHorizontal: 4 },
    divider:   { width: 1, backgroundColor: c.border, marginVertical: 4 },
    infoLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, marginBottom: 4 },
    infoVal:   { fontSize: 13, fontWeight: '700', color: c.text },
    infoSub:   { fontSize: 11, color: c.textMuted, marginTop: 2 },

    metaRow:  { flexDirection: 'row', backgroundColor: c.bgScreen, borderRadius: 12, padding: 12, marginBottom: 16 },
    metaItem: { flex: 1, alignItems: 'center' },
    metaLabel: { fontSize: 10, color: c.textFaint, fontWeight: '600', textTransform: 'uppercase' },
    metaVal:   { fontSize: 15, fontWeight: '800', color: c.text, marginTop: 4 },

    actions:    { flexDirection: 'row', gap: 10 },
    declineBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: c.borderMid, alignItems: 'center' },
    declineTxt: { fontSize: 15, fontWeight: '700', color: c.textMuted },
    acceptBtn:  { flex: 2, paddingVertical: 14, borderRadius: 12, backgroundColor: PRIMARY, alignItems: 'center' },
    acceptTxt:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  });
}
