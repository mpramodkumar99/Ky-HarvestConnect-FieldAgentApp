import { useState } from 'react';
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppColors, type AppColors } from '@/hooks/use-app-colors';
import { useDelivery } from '@/context/delivery-context';
import { useLanguage } from '@/context/language-context';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';
const EARTH   = '#7B4B2A';
const PEACOCK = '#006D77';

type Period = 'week' | 'month';

// Simulated daily data — in production this comes from a reports API
const DAILY_MOCK = [
  { day: 'Mon', count: 4, earnings: 24000 },
  { day: 'Tue', count: 6, earnings: 38000 },
  { day: 'Wed', count: 3, earnings: 19500 },
  { day: 'Thu', count: 7, earnings: 45000 },
  { day: 'Fri', count: 5, earnings: 32000 },
  { day: 'Sat', count: 8, earnings: 56000 },
  { day: 'Sun', count: 2, earnings: 13000 },
];

function BarChart({ data }: { data: typeof DAILY_MOCK }) {
  const c   = useAppColors();
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 80 }}>
      {data.map(d => (
        <View key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
          <View style={{ flex: 1, justifyContent: 'flex-end' }}>
            <View style={{
              width: '100%', minHeight: 4,
              height: `${Math.max((d.count / max) * 100, 5)}%` as any,
              backgroundColor: PRIMARY, borderRadius: 4,
            }} />
          </View>
          <Text style={{ fontSize: 10, color: c.textMuted, fontWeight: '600' }}>{d.day}</Text>
          <Text style={{ fontSize: 10, color: PRIMARY, fontWeight: '700' }}>{d.count}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ReportsScreen() {
  const c = useAppColors();
  const s = makeStyles(c);
  const { t } = useLanguage();
  const { completedToday } = useDelivery();
  const [period, setPeriod] = useState<Period>('week');

  const weekTotal    = DAILY_MOCK.reduce((sum, d) => sum + d.count, 0);
  const weekEarnings = DAILY_MOCK.reduce((sum, d) => sum + d.earnings, 0);
  const weekAvgTime  = '28 min';
  const weekRating   = '4.8';

  return (
    <View style={s.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: PRIMARY }}>
        <View style={s.header}>
          <Text style={s.headerTitle}>{t('rep_title')}</Text>
        </View>
        <View style={s.periodRow}>
          {(['week', 'month'] as Period[]).map(p => (
            <Pressable key={p} style={[s.periodBtn, period === p && s.periodBtnActive]} onPress={() => setPeriod(p)}>
              <Text style={[s.periodTxt, period === p && s.periodTxtActive]}>
                {p === 'week' ? t('rep_this_week') : t('rep_this_month')}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.body}>

        {/* KPI Cards */}
        <View style={s.kpiGrid}>
          <View style={[s.kpiCard, { borderColor: PRIMARY + '55' }]}>
            <Text style={s.kpiIcon}>🛵</Text>
            <Text style={[s.kpiNum, { color: PRIMARY }]}>{weekTotal}</Text>
            <Text style={s.kpiLabel}>{t('rep_deliveries')}</Text>
          </View>
          <View style={[s.kpiCard, { borderColor: ACCENT + '55' }]}>
            <Text style={s.kpiIcon}>✅</Text>
            <Text style={[s.kpiNum, { color: EARTH }]}>{weekTotal}</Text>
            <Text style={s.kpiLabel}>{t('rep_completed')}</Text>
          </View>
          <View style={[s.kpiCard, { borderColor: PEACOCK + '55' }]}>
            <Text style={s.kpiIcon}>💰</Text>
            <Text style={[s.kpiNum, { color: PEACOCK }]}>₹{(weekEarnings / 100).toFixed(0)}</Text>
            <Text style={s.kpiLabel}>{t('rep_earnings')}</Text>
          </View>
          <View style={[s.kpiCard, { borderColor: '#7c3aed55' }]}>
            <Text style={s.kpiIcon}>⏱️</Text>
            <Text style={[s.kpiNum, { color: '#7c3aed' }]}>{weekAvgTime}</Text>
            <Text style={s.kpiLabel}>{t('rep_avg_time')}</Text>
          </View>
        </View>

        {/* Performance Score */}
        <View style={s.perfCard}>
          <View style={s.perfHead}>
            <Text style={s.perfTitle}>{t('rep_performance')}</Text>
            <View style={s.ratingBadge}>
              <Text style={s.ratingTxt}>⭐ {weekRating}</Text>
            </View>
          </View>

          <View style={s.perfMetrics}>
            <View style={s.perfRow}>
              <Text style={s.perfLabel}>Delivery Success Rate</Text>
              <View style={s.perfBarWrap}>
                <View style={[s.perfBar, { width: '95%', backgroundColor: PRIMARY }]} />
              </View>
              <Text style={s.perfPct}>95%</Text>
            </View>
            <View style={s.perfRow}>
              <Text style={s.perfLabel}>On-time Delivery</Text>
              <View style={s.perfBarWrap}>
                <View style={[s.perfBar, { width: '88%', backgroundColor: ACCENT }]} />
              </View>
              <Text style={s.perfPct}>88%</Text>
            </View>
            <View style={s.perfRow}>
              <Text style={s.perfLabel}>Customer Rating</Text>
              <View style={s.perfBarWrap}>
                <View style={[s.perfBar, { width: '96%', backgroundColor: PEACOCK }]} />
              </View>
              <Text style={s.perfPct}>4.8/5</Text>
            </View>
          </View>
        </View>

        {/* Daily Chart */}
        <View style={s.chartCard}>
          <Text style={s.chartTitle}>{t('rep_daily')}</Text>
          <BarChart data={DAILY_MOCK} />
        </View>

        {/* Daily Breakdown Table */}
        <View style={s.tableCard}>
          <Text style={s.tableTitle}>Delivery Breakdown</Text>
          <View style={s.tableHead}>
            <Text style={[s.tableHdr, { flex: 1 }]}>Day</Text>
            <Text style={[s.tableHdr, { width: 60, textAlign: 'center' }]}>Count</Text>
            <Text style={[s.tableHdr, { width: 80, textAlign: 'right' }]}>Earnings</Text>
          </View>
          {DAILY_MOCK.map((d, i) => (
            <View key={d.day} style={[s.tableRow, i % 2 === 0 && { backgroundColor: c.bgSubtle }]}>
              <Text style={[s.tableCell, { flex: 1, fontWeight: '600' }]}>{d.day}</Text>
              <View style={[s.countBadge, { width: 60, alignItems: 'center' }]}>
                <Text style={s.countBadgeTxt}>{d.count}</Text>
              </View>
              <Text style={[s.tableCell, { width: 80, textAlign: 'right', color: PRIMARY, fontWeight: '700' }]}>
                ₹{(d.earnings / 100).toFixed(0)}
              </Text>
            </View>
          ))}
          <View style={s.tableTotal}>
            <Text style={[s.tableTotalTxt, { flex: 1 }]}>Total</Text>
            <Text style={[s.tableTotalTxt, { width: 60, textAlign: 'center' }]}>{weekTotal}</Text>
            <Text style={[s.tableTotalTxt, { width: 80, textAlign: 'right', color: PRIMARY }]}>
              ₹{(weekEarnings / 100).toFixed(0)}
            </Text>
          </View>
        </View>

        {/* Brand Footer */}
        <View style={s.footer}>
          <Text style={s.footerTxt}>🦊 FoxTail Agent · From Local Roots to Every Home</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.bgScreen },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    periodRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 },
    periodBtn:       { flex: 1, paddingVertical: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
    periodBtnActive: { backgroundColor: '#fff' },
    periodTxt:       { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
    periodTxtActive: { color: PRIMARY },
    body: { padding: 14, gap: 14, paddingBottom: 32 },
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    kpiCard: { width: '47%', backgroundColor: c.bg, borderRadius: 18, borderWidth: 1.5, padding: 16, alignItems: 'center', gap: 4 },
    kpiIcon: { fontSize: 24 },
    kpiNum:  { fontSize: 22, fontWeight: '800' },
    kpiLabel: { fontSize: 11, fontWeight: '600', color: c.textMuted, textAlign: 'center' },
    perfCard: { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
    perfHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    perfTitle: { fontSize: 14, fontWeight: '700', color: c.text },
    ratingBadge: { backgroundColor: ACCENT + '22', borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
    ratingTxt:   { fontSize: 13, fontWeight: '700', color: EARTH },
    perfMetrics: { gap: 10 },
    perfRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
    perfLabel:   { fontSize: 12, color: c.textMuted, width: 120 },
    perfBarWrap: { flex: 1, height: 6, backgroundColor: c.bgSubtle, borderRadius: 3, overflow: 'hidden' },
    perfBar:     { height: '100%', borderRadius: 3 },
    perfPct:     { fontSize: 11, fontWeight: '700', color: c.textSub, width: 36, textAlign: 'right' },
    chartCard:  { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 16 },
    chartTitle: { fontSize: 14, fontWeight: '700', color: c.text, marginBottom: 14 },
    tableCard:  { backgroundColor: c.bg, borderRadius: 18, borderWidth: 1, borderColor: c.border, overflow: 'hidden' },
    tableTitle: { fontSize: 14, fontWeight: '700', color: c.text, padding: 14, paddingBottom: 10 },
    tableHead:  { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: c.bgSubtle, borderTopWidth: 1, borderTopColor: c.borderLight },
    tableHdr:   { fontSize: 11, fontWeight: '700', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
    tableRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
    tableCell:  { fontSize: 13, color: c.text },
    countBadge: { backgroundColor: PRIMARY + '22', borderRadius: 8, paddingVertical: 2 },
    countBadgeTxt: { fontSize: 12, fontWeight: '700', color: PRIMARY },
    tableTotal: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bgSubtle },
    tableTotalTxt: { fontSize: 13, fontWeight: '800', color: c.text },
    footer:    { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: c.borderLight },
    footerTxt: { fontSize: 11, color: c.textFaint },
  });
}
