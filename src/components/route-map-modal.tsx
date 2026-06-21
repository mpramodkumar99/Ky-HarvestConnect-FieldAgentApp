import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import type { Order } from '@/services/order-api';

interface Props {
  visible:  boolean;
  order:    Order | null;
  agentLat: number;
  agentLng: number;
  onClose:  () => void;
}

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';

function openMapsRoute(fromLat: number, fromLng: number, toLat: number, toLng: number, label: string) {
  const url = Platform.OS === 'ios'
    ? `maps://?saddr=${fromLat},${fromLng}&daddr=${toLat},${toLng}`
    : `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(`https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`)
  );
}

function openAddressInMaps(address: string) {
  const encoded = encodeURIComponent(address);
  Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
}

import { Platform } from 'react-native';

export function RouteMapModal({ visible, order, agentLat, agentLng, onClose }: Props) {
  const c = useAppColors();
  const s = makeStyles(c);

  if (!order) return null;

  const addr  = order.deliveryAddress;
  const buyer = `${addr.line1}, ${addr.city}, ${addr.state} ${addr.pincode}`;

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.container}>
        <Pressable style={[StyleSheet.absoluteFill, s.backdrop]} onPress={onClose} />
        <View style={s.sheet}>
          <View style={s.bar} />

          <Text style={s.title}>🗺️ Delivery Route</Text>
          <Text style={s.orderRef}>Order #{order.id.slice(-8).toUpperCase()}</Text>

          {/* Route visualization */}
          <View style={s.routeCard}>

            <View style={s.routeStop}>
              <View style={[s.stopDot, { backgroundColor: '#006D77' }]} />
              <View style={s.stopInfo}>
                <Text style={s.stopRole}>Your Location</Text>
                <Text style={s.stopAddr}>GPS: {agentLat.toFixed(4)}, {agentLng.toFixed(4)}</Text>
              </View>
            </View>

            <View style={s.connector}>
              <View style={s.connLine} />
              <Text style={s.connLabel}>Pick up</Text>
            </View>

            <View style={s.routeStop}>
              <View style={[s.stopDot, { backgroundColor: ACCENT }]} />
              <View style={s.stopInfo}>
                <Text style={s.stopRole}>🏪 Seller Store</Text>
                <Text style={s.stopAddr}>{order.sellerName}</Text>
                <Text style={s.stopSub}>{order.sellerLocation}</Text>
              </View>
            </View>

            <View style={s.connector}>
              <View style={s.connLine} />
              <Text style={s.connLabel}>Deliver</Text>
            </View>

            <View style={s.routeStop}>
              <View style={[s.stopDot, { backgroundColor: PRIMARY }]} />
              <View style={s.stopInfo}>
                <Text style={s.stopRole}>🏠 Buyer</Text>
                <Text style={s.stopAddr}>{addr.name} · {addr.phone}</Text>
                <Text style={s.stopSub}>{buyer}</Text>
              </View>
            </View>

          </View>

          {/* Action buttons */}
          <View style={s.actions}>
            <Pressable
              style={[s.navBtn, { backgroundColor: ACCENT }]}
              onPress={() => openAddressInMaps(`${order.sellerName} ${order.sellerLocation}`)}>
              <Text style={s.navBtnTxt}>📍 Navigate to Store</Text>
            </Pressable>
            <Pressable
              style={[s.navBtn, { backgroundColor: PRIMARY }]}
              onPress={() => openAddressInMaps(buyer)}>
              <Text style={s.navBtnTxt}>🏠 Navigate to Buyer</Text>
            </Pressable>
          </View>

          {/* Order summary */}
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Items</Text>
              <Text style={s.summaryVal}>{order.items.length} items</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Order Value</Text>
              <Text style={s.summaryVal}>₹{(order.totalAmount / 100).toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Payment</Text>
              <Text style={[s.summaryVal, order.paymentMethod === 'cod' && { color: ACCENT }]}>
                {order.paymentMethod === 'cod' ? '💵 Collect Cash' : '✅ Pre-paid'}
              </Text>
            </View>
          </View>

          <Pressable style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeTxt}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: 'flex-end' },
    backdrop:  { backgroundColor: 'rgba(0,0,0,0.55)' },
    sheet: {
      backgroundColor: c.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, maxHeight: '92%',
    },
    bar: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: c.borderMid, marginBottom: 18 },
    title:    { fontSize: 18, fontWeight: '800', color: c.text, marginBottom: 2 },
    orderRef: { fontSize: 12, fontWeight: '600', color: c.textMuted, marginBottom: 16 },

    routeCard: {
      backgroundColor: c.bgScreen, borderRadius: 16, padding: 16,
      borderWidth: 1, borderColor: c.border, marginBottom: 16,
    },
    routeStop: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    stopDot:   { width: 12, height: 12, borderRadius: 6, marginTop: 4, flexShrink: 0 },
    stopInfo:  { flex: 1 },
    stopRole:  { fontSize: 13, fontWeight: '700', color: c.text },
    stopAddr:  { fontSize: 12, color: c.textSub, marginTop: 2 },
    stopSub:   { fontSize: 11, color: c.textMuted, marginTop: 1 },
    connector: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6, marginLeft: 4 },
    connLine:  { width: 4, height: 28, backgroundColor: c.borderMid, borderRadius: 2, marginLeft: 4 },
    connLabel: { fontSize: 10, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

    actions: { gap: 10, marginBottom: 16 },
    navBtn:  { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    navBtnTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },

    summary:    { backgroundColor: c.bgSubtle, borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    summaryLabel: { fontSize: 13, color: c.textMuted },
    summaryVal:   { fontSize: 13, fontWeight: '700', color: c.text },

    closeBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center', borderWidth: 1.5, borderColor: c.borderMid },
    closeTxt: { fontSize: 15, fontWeight: '600', color: c.textSub },
  });
}
