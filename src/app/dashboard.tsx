import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useDelivery } from '@/context/delivery-context';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { RouteMapModal } from '@/components/route-map-modal';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';

function greetingText(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function DashboardScreen() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { session } = useAuth();
  const { t }       = useLanguage();
  const { pendingOrders, activeDelivery, completedToday, loading, refresh, markDelivered } = useDelivery();

  const [routeOpen,  setRouteOpen]  = useState(false);
  const [agentLat,   setAgentLat]   = useState(0);
  const [agentLng,   setAgentLng]   = useState(0);
  const [locLoading, setLocLoading] = useState(false);

  async function openRoute() {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setAgentLat(loc.coords.latitude);
        setAgentLng(loc.coords.longitude);
      }
    } catch {}
    setLocLoading(false);
    setRouteOpen(true);
  }

  const todayEarnings = completedToday.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{greetingText()}, Agent 🦊</Text>
            <Text style={s.agentId}>ID: {session?.userId?.slice(-8).toUpperCase() ?? '—'}</Text>
          </View>
          <View style={s.statusDot}>
            <View style={s.dotGreen} />
            <Text style={s.statusTxt}>Available</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={PRIMARY} />}>

        {/* Stats Row */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { borderColor: ACCENT + '55', backgroundColor: ACCENT + '11' }]}>
            <Text style={s.statNum}>{pendingOrders.length}</Text>
            <Text style={s.statLabel}>{t('dash_pending_pickups')}</Text>
          </View>
          <View style={[s.statCard, { borderColor: PRIMARY + '55', backgroundColor: PRIMARY + '11' }]}>
            <Text style={[s.statNum, { color: PRIMARY }]}>{completedToday.length}</Text>
            <Text style={s.statLabel}>{t('dash_completed_today')}</Text>
          </View>
          <View style={[s.statCard, { borderColor: EARTH + '55', backgroundColor: EARTH + '11' }]}>
            <Text style={[s.statNum, { color: EARTH }]}>{formatRupees(todayEarnings)}</Text>
            <Text style={s.statLabel}>{t('dash_earnings_today')}</Text>
          </View>
        </View>

        {/* Active Delivery Card */}
        <View style={s.sectionHead}>
          <Text style={s.sectionTitle}>{t('dash_active_delivery')}</Text>
        </View>

        {activeDelivery ? (
          <View style={[s.activeCard, { borderColor: PRIMARY }]}>
            <View style={s.activeCardHead}>
              <View style={s.activeBadge}>
                <Text style={s.activeBadgeTxt}>🛵 IN TRANSIT</Text>
              </View>
              <Text style={s.activeOrderRef}>#{activeDelivery.id.slice(-8).toUpperCase()}</Text>
            </View>

            <View style={s.activeRoute}>
              <View style={s.routeStop}>
                <View style={[s.routeDot, { backgroundColor: ACCENT }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.routeLabel}>From</Text>
                  <Text style={s.routeVal}>{activeDelivery.sellerName}</Text>
                  <Text style={s.routeSub}>{activeDelivery.sellerLocation}</Text>
                </View>
              </View>
              <View style={s.routeConnector} />
              <View style={s.routeStop}>
                <View style={[s.routeDot, { backgroundColor: PRIMARY }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.routeLabel}>To</Text>
                  <Text style={s.routeVal}>{activeDelivery.deliveryAddress.name}</Text>
                  <Text style={s.routeSub}>{activeDelivery.deliveryAddress.city}, {activeDelivery.deliveryAddress.pincode}</Text>
                </View>
              </View>
            </View>

            <View style={s.activeActions}>
              <Pressable style={s.navBtn} onPress={openRoute} disabled={locLoading}>
                {locLoading
                  ? <ActivityIndicator size="small" color={PRIMARY} />
                  : <Text style={s.navBtnTxt}>🗺️ {t('dash_navigate')}</Text>}
              </Pressable>
              <Pressable
                style={s.deliveredBtn}
                onPress={() => markDelivered(activeDelivery.id)}>
                <Text style={s.deliveredBtnTxt}>✓ {t('dash_mark_delivered')}</Text>
              </Pressable>
            </View>

            {activeDelivery.paymentMethod === 'cod' && (
              <View style={s.codAlert}>
                <Text style={s.codAlertTxt}>💵 Collect cash: {formatRupees(activeDelivery.totalAmount)}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={s.emptyActive}>
            <Text style={s.emptyActiveIcon}>🛵</Text>
            <Text style={s.emptyActiveTxt}>{t('dash_no_active')}</Text>
            {pendingOrders.length > 0 && (
              <Text style={s.emptyActiveSub}>{pendingOrders.length} pickups waiting in Deliveries tab</Text>
            )}
          </View>
        )}

        {/* Recent Completions */}
        {completedToday.length > 0 && (
          <>
            <View style={s.sectionHead}>
              <Text style={s.sectionTitle}>Completed Today</Text>
              <Text style={s.sectionCount}>{completedToday.length}</Text>
            </View>
            {completedToday.slice(0, 3).map(order => (
              <View key={order.id} style={s.completedRow}>
                <View style={s.completedIcon}><Text style={{ fontSize: 18 }}>✅</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.completedName}>{order.deliveryAddress.name}</Text>
                  <Text style={s.completedSub}>{order.sellerName} → {order.deliveryAddress.city}</Text>
                </View>
                <Text style={s.completedAmt}>{formatRupees(order.totalAmount)}</Text>
              </View>
            ))}
          </>
        )}

        {/* FoxTail brand footer */}
        <View style={s.brandFooter}>
          <Text style={s.brandFooterTxt}>🦊 FoxTail · From Local Roots to Every Home</Text>
        </View>
      </ScrollView>

      <RouteMapModal
        visible={routeOpen}
        order={activeDelivery}
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
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16,
    },
    greeting:  { fontSize: 18, fontWeight: '800', color: '#fff' },
    agentId:   { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    statusDot: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
    dotGreen:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#86efac' },
    statusTxt: { fontSize: 12, fontWeight: '600', color: '#fff' },

    body: { padding: 16, gap: 0, paddingBottom: 32 },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
    statCard: { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4 },
    statNum:  { fontSize: 20, fontWeight: '800', color: ACCENT },
    statLabel: { fontSize: 10, fontWeight: '600', color: c.textMuted, textAlign: 'center' },

    sectionHead:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    sectionCount: { fontSize: 12, fontWeight: '700', color: c.textMuted },

    activeCard: {
      backgroundColor: c.bg, borderRadius: 20, borderWidth: 2,
      padding: 16, marginBottom: 20,
    },
    activeCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    activeBadge:   { backgroundColor: PRIMARY + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    activeBadgeTxt: { fontSize: 11, fontWeight: '800', color: PRIMARY, letterSpacing: 0.5 },
    activeOrderRef: { fontSize: 12, fontWeight: '600', color: c.textMuted },

    activeRoute: { gap: 4, marginBottom: 14 },
    routeStop:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    routeDot:    { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
    routeLabel:  { fontSize: 10, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase' },
    routeVal:    { fontSize: 13, fontWeight: '700', color: c.text },
    routeSub:    { fontSize: 11, color: c.textMuted },
    routeConnector: { width: 2, height: 20, backgroundColor: c.borderMid, marginLeft: 4, marginVertical: 2 },

    activeActions: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    navBtn:       { flex: 1, borderRadius: 12, paddingVertical: 12, borderWidth: 1.5, borderColor: PRIMARY, alignItems: 'center' },
    navBtnTxt:    { fontSize: 13, fontWeight: '700', color: PRIMARY },
    deliveredBtn: { flex: 2, borderRadius: 12, paddingVertical: 12, backgroundColor: PRIMARY, alignItems: 'center' },
    deliveredBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

    codAlert:    { backgroundColor: ACCENT + '22', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: ACCENT + '55' },
    codAlertTxt: { fontSize: 13, fontWeight: '700', color: EARTH, textAlign: 'center' },

    emptyActive:    { backgroundColor: c.bg, borderRadius: 20, padding: 32, alignItems: 'center', gap: 8, marginBottom: 20, borderWidth: 1, borderColor: c.border, borderStyle: 'dashed' },
    emptyActiveIcon: { fontSize: 40 },
    emptyActiveTxt:  { fontSize: 15, fontWeight: '700', color: c.textMuted },
    emptyActiveSub:  { fontSize: 12, color: c.textFaint, textAlign: 'center' },

    completedRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderLight },
    completedIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
    completedName: { fontSize: 13, fontWeight: '700', color: c.text },
    completedSub:  { fontSize: 11, color: c.textMuted },
    completedAmt:  { fontSize: 13, fontWeight: '700', color: PRIMARY },

    brandFooter:    { alignItems: 'center', marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.borderLight },
    brandFooterTxt: { fontSize: 11, color: c.textFaint, fontWeight: '500' },
  });
}
