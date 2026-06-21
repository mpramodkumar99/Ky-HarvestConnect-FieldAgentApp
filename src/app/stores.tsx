import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/context/auth-context';
import { useLanguage } from '@/context/language-context';
import { listOnboardingRequests, type StoreOnboardingRequest } from '@/services/agent-api';
import { StoreReviewModal } from '@/components/store-review-modal';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';

type FilterTab = 'pending' | 'approved' | 'rejected';

const STORE_ICONS: Record<string, string> = {
  farmer: '🌾', dairy: '🥛', homefood: '🍱', artisan: '🪡', trades: '🔧', kirana: '🛒',
};

function statusColor(status: string) {
  if (status === 'approved') return { bg: '#dcfce7', text: '#166534', border: '#86efac' };
  if (status === 'rejected') return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
  return { bg: ACCENT + '22', text: '#7a4f00', border: ACCENT + '55' };
}

export default function StoresScreen() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { session } = useAuth();
  const { t }       = useLanguage();

  const [requests, setRequests] = useState<StoreOnboardingRequest[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [filter,   setFilter]   = useState<FilterTab>('pending');
  const [selected, setSelected] = useState<StoreOnboardingRequest | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await listOnboardingRequests(session.token);
      setRequests(data);
    } catch {
      // Use mock data when agent service isn't running yet
      setRequests(MOCK_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { load(); }, [load]);

  const filtered = requests.filter(r => r.status === filter);
  const counts   = {
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'pending',  label: t('stores_pending') },
    { key: 'approved', label: t('stores_approved') },
    { key: 'rejected', label: t('stores_rejected') },
  ];

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{t('stores_title')}</Text>
          <Text style={s.headerSub}>{t('stores_onboarding')}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabBar} contentContainerStyle={s.tabBarContent}>
          {TABS.map(tb => (
            <Pressable key={tb.key} style={[s.tab, filter === tb.key && s.tabActive]} onPress={() => setFilter(tb.key)}>
              <Text style={[s.tabTxt, filter === tb.key && s.tabTxtActive]}>{tb.label}</Text>
              {counts[tb.key] > 0 && (
                <View style={[s.tabBadge, filter === tb.key && s.tabBadgeActive]}>
                  <Text style={s.tabBadgeTxt}>{counts[tb.key]}</Text>
                </View>
              )}
            </Pressable>
          ))}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={PRIMARY} />}>

        {loading && filtered.length === 0 && (
          <View style={s.loadingWrap}><ActivityIndicator size="large" color={PRIMARY} /></View>
        )}

        {!loading && filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🏪</Text>
            <Text style={s.emptyTxt}>{t('stores_empty')}</Text>
          </View>
        )}

        {filtered.map(req => {
          const sc   = statusColor(req.status);
          const icon = STORE_ICONS[req.storeType] ?? '🏪';
          return (
            <Pressable key={req.id} style={s.card} onPress={() => setSelected(req)}>
              <View style={s.cardHead}>
                <View style={s.storeIconWrap}><Text style={{ fontSize: 24 }}>{icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.storeName}>{req.storeName}</Text>
                  <Text style={s.storeOwner}>{req.ownerName} · {req.phone}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                  <Text style={[s.statusTxt, { color: sc.text }]}>{req.status.toUpperCase()}</Text>
                </View>
              </View>
              <View style={s.cardMeta}>
                <Text style={s.metaItem}>📍 {req.location}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaItem}>📌 {req.pincode}</Text>
                <Text style={s.metaDot}>·</Text>
                <Text style={s.metaItem}>{new Date(req.submittedAt).toLocaleDateString('en-IN')}</Text>
              </View>
              {req.kycDocUrl && <Text style={s.kycTag}>📎 KYC document attached</Text>}
              {filter === 'pending' && (
                <View style={s.reviewCta}>
                  <Text style={s.reviewCtaTxt}>Tap to review →</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <StoreReviewModal
        visible={!!selected}
        store={selected}
        onClose={() => setSelected(null)}
        onUpdated={load}
      />
    </View>
  );
}

// Mock data for when agent API is not running
const MOCK_REQUESTS: StoreOnboardingRequest[] = [
  { id: 'req-1', storeName: 'Ravi Farm Fresh', ownerName: 'Ravi Kumar', phone: '9876543210', location: 'Armoor, Nizamabad', pincode: '503224', storeType: 'farmer', kycDocUrl: 'https://example.com/kyc.pdf', status: 'pending', submittedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 'req-2', storeName: 'Lakshmi Dairy', ownerName: 'Lakshmi Devi', phone: '9876541234', location: 'Navipet, Nizamabad', pincode: '503245', storeType: 'dairy', status: 'pending', submittedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'req-3', storeName: 'Amma Home Foods', ownerName: 'Sunita Reddy', phone: '9876545678', location: 'Nizamabad', pincode: '503001', storeType: 'homefood', kycDocUrl: 'https://example.com/kyc2.pdf', status: 'approved', submittedAt: new Date(Date.now() - 7 * 86400000).toISOString(), notes: 'Verified on-site. Kitchen hygiene good.' },
];

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgScreen },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
    tabBar:        { backgroundColor: PRIMARY },
    tabBarContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, flexDirection: 'row' },
    tab:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 7, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)' },
    tabActive:    { backgroundColor: '#fff' },
    tabTxt:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    tabTxtActive: { color: PRIMARY },
    tabBadge:      { backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
    tabBadgeActive: { backgroundColor: PRIMARY },
    tabBadgeTxt:  { fontSize: 10, fontWeight: '800', color: '#fff' },
    body:         { padding: 14, paddingBottom: 24 },
    loadingWrap:  { paddingTop: 60, alignItems: 'center' },
    empty:        { alignItems: 'center', paddingTop: 80, gap: 12 },
    emptyIcon:    { fontSize: 48 },
    emptyTxt:     { fontSize: 15, fontWeight: '600', color: c.textMuted },
    card:         { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16, marginBottom: 12 },
    cardHead:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
    storeIconWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: c.bgSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border },
    storeName:    { fontSize: 15, fontWeight: '800', color: c.text },
    storeOwner:   { fontSize: 12, color: c.textMuted, marginTop: 2 },
    statusBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1 },
    statusTxt:    { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
    cardMeta:     { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 },
    metaItem:     { fontSize: 12, color: c.textMuted },
    metaDot:      { color: c.textFaint },
    kycTag:       { fontSize: 11, fontWeight: '600', color: '#006D77', marginTop: 4 },
    reviewCta:    { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.borderLight, alignItems: 'flex-end' },
    reviewCtaTxt: { fontSize: 12, fontWeight: '700', color: PRIMARY },
  });
}
