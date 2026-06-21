import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useAuth } from '@/context/auth-context';
import { useAgentProfile } from '@/context/agent-profile-context';
import { useLanguage } from '@/context/language-context';
import { useThemePreference } from '@/context/theme-context';
import { useToast } from '@/components/toast-provider';
import { useDelivery } from '@/context/delivery-context';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';
const PEACOCK = '#006D77';

export default function ProfileScreen() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { session, logout }             = useAuth();
  const { agentId, agentName: ctxName, zone, rating, status, statusLoading, toggleStatus } = useAgentProfile();
  const { t, language, setLanguage }    = useLanguage();
  const { preference, setPreference }   = useThemePreference();
  const { showConfirm }                 = useToast();
  const { completedToday, pendingOrders } = useDelivery();

  function handleLogout() {
    showConfirm({
      title:        'Sign Out?',
      message:      'You will need to log in again to access the app.',
      confirmLabel: t('prof_logout'),
      destructive:  true,
      onConfirm:    logout,
    });
  }

  const agentName = ctxName || `Agent ${session?.userId?.slice(-5).toUpperCase() ?? '—'}`;

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
        {/* Profile Header */}
        <View style={s.profileHeader}>
          <View style={s.avatarRing}>
            <Text style={s.avatarIcon}>🦊</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.agentName}>{agentName}</Text>
            <Text style={s.agentId}>ID: {agentId !== '—' ? agentId : (session?.userId ?? '—')}</Text>
          </View>
          <Pressable
            style={s.statusPill}
            onPress={toggleStatus}
            disabled={statusLoading || status === 'on_delivery'}>
            {statusLoading
              ? <ActivityIndicator size="small" color="#fff" style={{ width: 7 }} />
              : <View style={status === 'available' ? s.statusGreen : status === 'offline' ? s.statusGray : s.statusAmber} />}
            <Text style={s.statusTxt}>
              {status === 'available' ? t('prof_available') : status === 'offline' ? 'Offline' : 'Delivering'}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        {/* Quick Stats */}
        <View style={s.statsRow}>
          <View style={[s.stat, { backgroundColor: PRIMARY + '15', borderColor: PRIMARY + '40' }]}>
            <Text style={[s.statNum, { color: PRIMARY }]}>{completedToday.length}</Text>
            <Text style={s.statLbl}>Today</Text>
          </View>
          <View style={[s.stat, { backgroundColor: ACCENT + '15', borderColor: ACCENT + '40' }]}>
            <Text style={[s.statNum, { color: EARTH }]}>{pendingOrders.length}</Text>
            <Text style={s.statLbl}>Pending</Text>
          </View>
          <View style={[s.stat, { backgroundColor: PEACOCK + '15', borderColor: PEACOCK + '40' }]}>
            <Text style={[s.statNum, { color: PEACOCK }]}>{rating.toFixed(1)} ⭐</Text>
            <Text style={s.statLbl}>{t('prof_rating')}</Text>
          </View>
        </View>

        {/* Zone Info */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Text style={s.cardIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardLabel}>{t('prof_zone')}</Text>
              <Text style={s.cardVal}>{zone || 'Not set'}</Text>
            </View>
          </View>
          <View style={[s.cardRow, { borderTopWidth: 1, borderTopColor: c.borderLight, marginTop: 8, paddingTop: 8 }]}>
            <Text style={s.cardIcon}>🚀</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardLabel}>{t('prof_total_del')}</Text>
              <Text style={s.cardVal}>142 deliveries</Text>
            </View>
          </View>
        </View>

        {/* Language Setting */}
        <View style={s.settingsCard}>
          <Text style={s.settingsTitle}>{t('prof_settings')}</Text>

          <View style={s.settingRow}>
            <Text style={s.settingLabel}>🌐 {t('prof_language')}</Text>
            <View style={s.pillGroup}>
              {(['en', 'te', 'hi'] as const).map(lang => (
                <Pressable
                  key={lang}
                  style={[s.pill, language === lang && s.pillActive]}
                  onPress={() => setLanguage(lang)}>
                  <Text style={[s.pillTxt, language === lang && s.pillTxtActive]}>
                    {lang === 'en' ? 'EN' : lang === 'te' ? 'తె' : 'हि'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[s.settingRow, { borderTopWidth: 1, borderTopColor: c.borderLight, paddingTop: 14 }]}>
            <Text style={s.settingLabel}>🌙 {t('prof_theme')}</Text>
            <View style={s.pillGroup}>
              {(['light', 'system', 'dark'] as const).map(p => (
                <Pressable
                  key={p}
                  style={[s.pill, preference === p && s.pillActive]}
                  onPress={() => setPreference(p)}>
                  <Text style={[s.pillTxt, preference === p && s.pillTxtActive]}>
                    {p === 'light' ? '☀️' : p === 'dark' ? '🌙' : '⚙️'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Brand Card */}
        <View style={s.brandCard}>
          <Text style={s.brandLogo}>🦊</Text>
          <Text style={s.brandName}>FoxTail Field Agent</Text>
          <Text style={s.brandTagline}>From Local Roots to Every Home</Text>
          <View style={s.dotRow}>
            {Array.from({ length: 7 }).map((_, i) => (
              <View key={i} style={[s.dot, { backgroundColor: i % 3 === 0 ? ACCENT : i % 3 === 1 ? PRIMARY : EARTH }]} />
            ))}
          </View>
          <Text style={s.brandVersion}>Version 1.0.0 · Agent App</Text>
        </View>

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutTxt}>{t('prof_logout')}</Text>
        </Pressable>

      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgScreen },

    profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 },
    avatarRing: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 3, borderColor: ACCENT,
      alignItems: 'center', justifyContent: 'center',
    },
    avatarIcon: { fontSize: 34 },
    agentName:  { fontSize: 18, fontWeight: '800', color: '#fff' },
    agentId:    { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
    statusPill:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    statusGreen: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#86efac' },
    statusGray:  { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9ca3af' },
    statusAmber: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fbbf24' },
    statusTxt:   { fontSize: 11, fontWeight: '600', color: '#fff' },

    body: { padding: 16, gap: 14, paddingBottom: 40 },

    statsRow: { flexDirection: 'row', gap: 10 },
    stat:     { flex: 1, borderRadius: 16, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4 },
    statNum:  { fontSize: 18, fontWeight: '800' },
    statLbl:  { fontSize: 10, fontWeight: '600', color: c.textMuted },

    card:     { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
    cardRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    cardIcon: { fontSize: 22, width: 32 },
    cardLabel: { fontSize: 11, color: c.textMuted, fontWeight: '600' },
    cardVal:   { fontSize: 14, fontWeight: '700', color: c.text, marginTop: 2 },

    settingsCard:  { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
    settingsTitle: { fontSize: 12, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
    settingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    settingLabel:  { fontSize: 14, fontWeight: '600', color: c.text },
    pillGroup:     { flexDirection: 'row', gap: 6 },
    pill:          { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1.5, borderColor: c.borderMid, backgroundColor: c.bgScreen },
    pillActive:    { borderColor: PRIMARY, backgroundColor: PRIMARY },
    pillTxt:       { fontSize: 12, fontWeight: '700', color: c.textSub },
    pillTxtActive: { color: '#fff' },

    brandCard:    { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: ACCENT + '55', padding: 24, alignItems: 'center', gap: 6 },
    brandLogo:    { fontSize: 40 },
    brandName:    { fontSize: 16, fontWeight: '800', color: PRIMARY },
    brandTagline: { fontSize: 12, color: EARTH, fontStyle: 'italic' },
    dotRow:       { flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 4 },
    dot:          { width: 6, height: 6, borderRadius: 3 },
    brandVersion: { fontSize: 11, color: c.textFaint },

    logoutBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#dc262660', backgroundColor: '#fff5f5' },
    logoutTxt: { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  });
}
