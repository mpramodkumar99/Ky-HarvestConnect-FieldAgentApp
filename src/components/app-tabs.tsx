import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppColors } from '@/hooks/use-app-colors';
import { useDelivery } from '@/context/delivery-context';
import { useLanguage } from '@/context/language-context';
import { useTabNav, type TabId } from '@/context/tab-context';
import { addNotificationTapListener } from '@/utils/notifications';
import DashboardScreen   from '@/app/dashboard';
import DeliveriesScreen  from '@/app/deliveries';
import StoresScreen      from '@/app/stores';
import ReportsScreen     from '@/app/reports';
import ProfileScreen     from '@/app/profile';

const PRIMARY = '#2E7D32';

const SCREENS: Record<TabId, React.ComponentType> = {
  dashboard:  DashboardScreen,
  deliveries: DeliveriesScreen,
  stores:     StoresScreen,
  reports:    ReportsScreen,
  profile:    ProfileScreen,
};

export default function AppTabs() {
  const c      = useAppColors();
  const insets = useSafeAreaInsets();
  const { pendingOrders } = useDelivery();
  const { t }  = useLanguage();
  const { activeTab: active, setActiveTab: setActive } = useTabNav();

  // Navigate to deliveries when a notification is tapped
  useEffect(() => {
    return addNotificationTapListener(data => {
      if (data?.screen === 'deliveries') setActive('deliveries');
    });
  }, [setActive]);

  const Screen = SCREENS[active];

  const TABS: { id: TabId; icon: string; label: () => string; badge?: number }[] = [
    { id: 'dashboard',  icon: '📊', label: () => t('tab_dashboard') },
    { id: 'deliveries', icon: '🛵', label: () => t('tab_deliveries'), badge: pendingOrders.length },
    { id: 'stores',     icon: '🏪', label: () => t('tab_stores') },
    { id: 'reports',    icon: '📈', label: () => t('tab_reports') },
    { id: 'profile',    icon: '🦊', label: () => t('tab_profile') },
  ];

  return (
    <View style={s.root}>
      <View style={s.content}>
        <Screen />
      </View>

      <View style={[
        s.bar,
        { borderTopColor: c.border, backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 8) },
      ]}>
        {TABS.map(tab => {
          const focused = active === tab.id;
          return (
            <Pressable key={tab.id} style={[s.btn, focused && s.btnActive]} onPress={() => setActive(tab.id)}>
              <View style={s.iconWrap}>
                <Text style={s.icon}>{tab.icon}</Text>
                {!!tab.badge && tab.badge > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeTxt}>{tab.badge > 9 ? '9+' : tab.badge}</Text>
                  </View>
                )}
                {focused && <View style={s.indicator} />}
              </View>
              <Text style={[s.label, { color: focused ? PRIMARY : c.textFaint }]}>{tab.label()}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  content: { flex: 1 },
  bar:     { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6 },
  btn:     { flex: 1, alignItems: 'center', paddingTop: 4, paddingBottom: 2, borderRadius: 10, marginHorizontal: 2 },
  btnActive: { backgroundColor: PRIMARY + '12' },
  iconWrap:  { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 },
  icon:      { fontSize: 20 },
  indicator: { position: 'absolute', bottom: -4, width: 28, height: 3, borderRadius: 2, backgroundColor: PRIMARY },
  label:     { fontSize: 10, fontWeight: '500', marginTop: 3 },
  badge: {
    position: 'absolute', top: -4, right: -6,
    minWidth: 16, height: 16, borderRadius: 8,
    backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: { fontSize: 9, fontWeight: '800', color: '#fff' },
});
