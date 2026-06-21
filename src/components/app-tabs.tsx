import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { useDelivery } from '@/context/delivery-context';
import { useLanguage } from '@/context/language-context';

const PRIMARY = '#2E7D32';
const ACCENT  = '#F4A300';

interface TabButtonProps {
  children: React.ReactNode;
  icon:     string;
  badge?:   number;
  isFocused?: boolean;
}

function TabButton({ children, icon, badge, isFocused = false, ...rest }: TabButtonProps & Record<string, unknown>) {
  const c = useAppColors();
  return (
    <Pressable
      {...rest}
      style={[
        tabS.btn,
        isFocused && { backgroundColor: PRIMARY + '12' },
      ]}>
      <View style={tabS.iconWrap}>
        <Text style={[tabS.icon, isFocused && tabS.iconActive]}>{icon}</Text>
        {!!badge && badge > 0 && (
          <View style={tabS.badge}>
            <Text style={tabS.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
        {isFocused && <View style={[tabS.indicator, { backgroundColor: PRIMARY }]} />}
      </View>
      <Text style={[tabS.label, { color: isFocused ? PRIMARY : c.textFaint }]}>{children}</Text>
    </Pressable>
  );
}

export default function AppTabs() {
  const c       = useAppColors();
  const insets  = useSafeAreaInsets();
  const { pendingOrders } = useDelivery();
  const { t }  = useLanguage();

  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={[tabS.bar, { borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 8), backgroundColor: c.bg }]}>
          <TabTrigger name="dashboard" href="/" asChild>
            <TabButton icon="📊">{t('tab_dashboard')}</TabButton>
          </TabTrigger>
          <TabTrigger name="deliveries" href="/deliveries" asChild>
            <TabButton icon="🛵" badge={pendingOrders.length}>{t('tab_deliveries')}</TabButton>
          </TabTrigger>
          <TabTrigger name="stores" href="/stores" asChild>
            <TabButton icon="🏪">{t('tab_stores')}</TabButton>
          </TabTrigger>
          <TabTrigger name="reports" href="/reports" asChild>
            <TabButton icon="📈">{t('tab_reports')}</TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="🦊">{t('tab_profile')}</TabButton>
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

const tabS = StyleSheet.create({
  bar:      { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  btn:      { flex: 1, alignItems: 'center', paddingTop: 4, paddingBottom: 2, borderRadius: 10, marginHorizontal: 2 },
  iconWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  icon:     { fontSize: 20 },
  iconActive: {},
  indicator: { position: 'absolute', bottom: -4, width: 28, height: 3, borderRadius: 2 },
  label:    { fontSize: 10, fontWeight: '500', marginTop: 3 },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
