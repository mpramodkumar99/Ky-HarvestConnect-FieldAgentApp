import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useDelivery } from '@/context/delivery-context';
import { useLanguage } from '@/context/language-context';
import { RouteMapModal } from '@/components/route-map-modal';
import type { Order } from '@/services/order-api';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';

type Tab = 'pending' | 'active' | 'completed';

function DeliveryCard({
  order, tab, onAccept, onPickup, onDeliver, onRoute,
}: {
  order: Order; tab: Tab;
  onAccept: (id: string) => void;
  onPickup: (id: string) => void;
  onDeliver: (id: string) => void;
  onRoute: (order: Order) => void;
}) {
  const c = useAppColors();
  const s = cardStyles(c);
  const addr = order.deliveryAddress;

  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.ref}>Order #{order.id.slice(-8).toUpperCase()}</Text>
        <View style={[
          s.statusBadge,
          tab === 'pending'   && { backgroundColor: ACCENT + '22' },
          tab === 'active'    && { backgroundColor: PRIMARY + '22' },
          tab === 'completed' && { backgroundColor: '#dcfce7' },
        ]}>
          <Text style={[
            s.statusTxt,
            tab === 'pending'   && { color: EARTH },
            tab === 'active'    && { color: PRIMARY },
            tab === 'completed' && { color: '#166534' },
          ]}>
            {tab === 'pending' ? 'READY TO PICK' : tab === 'active' ? 'IN TRANSIT' : 'DELIVERED'}
          </Text>
        </View>
      </View>

      <View style={s.routeRow}>
        <View style={s.routeBlock}>
          <View style={[s.dot, { backgroundColor: ACCENT }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.routeRole}>📦 Pick Up</Text>
            <Text style={s.routeName}>{order.sellerName}</Text>
            <Text style={s.routeSub}>{order.sellerLocation}</Text>
          </View>
        </View>
        <View style={s.arrow}><Text style={{ color: c.textFaint }}>→</Text></View>
        <View style={s.routeBlock}>
          <View style={[s.dot, { backgroundColor: PRIMARY }]} />
          <View style={{ flex: 1 }}>
            <Text style={s.routeRole}>🏠 Deliver</Text>
            <Text style={s.routeName}>{addr.name}</Text>
            <Text style={s.routeSub}>{addr.city}, {addr.pincode}</Text>
          </View>
        </View>
      </View>

      <View style={s.meta}>
        <Text style={s.metaItem}>{order.items.length} items</Text>
        <Text style={s.metaDot}>·</Text>
        <Text style={s.metaItem}>₹{(order.totalAmount / 100).toFixed(0)}</Text>
        <Text style={s.metaDot}>·</Text>
        <Text style={[s.metaItem, order.paymentMethod === 'cod' && { color: EARTH, fontWeight: '700' }]}>
          {order.paymentMethod === 'cod' ? '💵 COD' : '✅ Paid'}
        </Text>
      </View>

      <View style={s.actions}>
        {tab === 'pending' && (
          <>
            <Pressable style={s.routeBtn} onPress={() => onRoute(order)}>
              <Text style={s.routeBtnTxt}>🗺️ Route</Text>
            </Pressable>
            <Pressable style={s.primaryBtn} onPress={() => onAccept(order.id)}>
              <Text style={s.primaryBtnTxt}>Accept Delivery</Text>
            </Pressable>
          </>
        )}
        {tab === 'active' && (
          <>
            <Pressable style={s.routeBtn} onPress={() => onRoute(order)}>
              <Text style={s.routeBtnTxt}>🗺️ Route</Text>
            </Pressable>
            <Pressable style={s.primaryBtn} onPress={() => onDeliver(order.id)}>
              <Text style={s.primaryBtnTxt}>✓ Mark Delivered</Text>
            </Pressable>
          </>
        )}
        {tab === 'completed' && (
          <View style={s.completedNote}>
            <Text style={s.completedNoteTxt}>✅ Delivered · {new Date(order.updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function cardStyles(c: AppColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    ref:  { fontSize: 12, fontWeight: '700', color: c.textMuted },
    statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    statusTxt:   { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    routeRow:    { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 4 },
    routeBlock:  { flex: 1, flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
    dot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
    routeRole:   { fontSize: 10, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase' },
    routeName:   { fontSize: 12, fontWeight: '700', color: c.text },
    routeSub:    { fontSize: 11, color: c.textMuted },
    arrow:       { paddingHorizontal: 4, paddingTop: 8 },
    meta:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.borderLight, marginBottom: 10 },
    metaItem:    { fontSize: 12, color: c.textMuted },
    metaDot:     { fontSize: 10, color: c.textFaint },
    actions:     { flexDirection: 'row', gap: 8 },
    routeBtn:    { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: c.borderMid, alignItems: 'center' },
    routeBtnTxt: { fontSize: 12, fontWeight: '700', color: c.textSub },
    primaryBtn:  { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: PRIMARY, alignItems: 'center' },
    primaryBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },
    completedNote:    { flex: 1, paddingVertical: 8, backgroundColor: '#f0fdf4', borderRadius: 10, alignItems: 'center' },
    completedNoteTxt: { fontSize: 13, fontWeight: '600', color: '#166534' },
  });
}

export default function DeliveriesScreen() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { t } = useLanguage();
  const { pendingOrders, activeDelivery, completedToday, loading, refresh, acceptDelivery, markDelivered } = useDelivery();

  const [tab,       setTab]       = useState<Tab>('pending');
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeOrder, setRouteOrder] = useState<Order | null>(null);
  const [agentLat,  setAgentLat]  = useState(0);
  const [agentLng,  setAgentLng]  = useState(0);

  async function openRoute(order: Order) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setAgentLat(loc.coords.latitude);
        setAgentLng(loc.coords.longitude);
      }
    } catch {}
    setRouteOrder(order);
    setRouteOpen(true);
  }

  const orders = tab === 'pending' ? pendingOrders : tab === 'active' ? (activeDelivery ? [activeDelivery] : []) : completedToday;

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: 'pending',   label: t('del_pending'),   count: pendingOrders.length },
    { key: 'active',    label: t('del_active'),    count: activeDelivery ? 1 : 0 },
    { key: 'completed', label: t('del_completed'), count: completedToday.length },
  ];

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{t('del_title')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
          {TABS.map(tb => (
            <Pressable key={tb.key} style={[s.tab, tab === tb.key && s.tabActive]} onPress={() => setTab(tb.key)}>
              <Text style={[s.tabTxt, tab === tb.key && s.tabTxtActive]}>{tb.label}</Text>
              {tb.count > 0 && (
                <View style={[s.tabBadge, tab === tb.key && s.tabBadgeActive]}>
                  <Text style={[s.tabBadgeTxt, tab === tb.key && s.tabBadgeTxtActive]}>{tb.count}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={PRIMARY} />}>

        {loading && orders.length === 0 && (
          <View style={s.loadingWrap}><ActivityIndicator size="large" color={PRIMARY} /></View>
        )}

        {!loading && orders.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>{tab === 'completed' ? '✅' : '🛵'}</Text>
            <Text style={s.emptyTxt}>{t('del_empty')}</Text>
          </View>
        )}

        {orders.map(order => (
          <DeliveryCard
            key={order.id}
            order={order}
            tab={tab}
            onAccept={acceptDelivery}
            onPickup={() => {}}
            onDeliver={markDelivered}
            onRoute={openRoute}
          />
        ))}
      </ScrollView>

      <RouteMapModal
        visible={routeOpen}
        order={routeOrder}
        agentLat={agentLat}
        agentLng={agentLng}
        onClose={() => setRouteOpen(false)}
      />
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgScreen },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    tabBar:        { backgroundColor: PRIMARY },
    tabBarContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
    tab:         { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)' },
    tabActive:   { backgroundColor: '#fff' },
    tabTxt:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    tabTxtActive: { color: PRIMARY },
    tabBadge:    { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    tabBadgeActive: { backgroundColor: PRIMARY },
    tabBadgeTxt: { fontSize: 10, fontWeight: '800', color: '#fff' },
    tabBadgeTxtActive: { color: '#fff' },
    body:        { padding: 14, paddingBottom: 24 },
    loadingWrap: { paddingTop: 60, alignItems: 'center' },
    empty:       { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyIcon:   { fontSize: 48 },
    emptyTxt:    { fontSize: 15, fontWeight: '600', color: c.textMuted },
  });
}
