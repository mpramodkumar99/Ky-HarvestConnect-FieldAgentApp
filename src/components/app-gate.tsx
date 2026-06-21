import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AuthFlow } from '@/components/auth-flow';
import { AgentOnboarding } from '@/components/agent-onboarding';
import AppTabs from '@/components/app-tabs';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { DeliveryAlertModal } from '@/components/delivery-alert-modal';
import { useAuth } from '@/context/auth-context';
import { useDelivery } from '@/context/delivery-context';

const PRIMARY = '#2E7D32';

export default function AppGate() {
  const { initializing, isAuthenticated, needsOnboarding } = useAuth();
  const { newAlertOrder, acceptDelivery, dismissAlert }    = useDelivery();

  if (initializing) {
    return (
      <View style={s.loading}>
        <Text style={s.loadingIcon}>🦊</Text>
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 8 }} />
        <Text style={s.loadingTxt}>FoxTail Agent</Text>
      </View>
    );
  }

  if (!isAuthenticated) return <AuthFlow />;
  if (needsOnboarding)   return <AgentOnboarding />;

  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
      <DeliveryAlertModal
        order={newAlertOrder}
        onAccept={async (id) => { await acceptDelivery(id); dismissAlert(); }}
        onDecline={dismissAlert}
      />
    </>
  );
}

const s = StyleSheet.create({
  loading:     { flex: 1, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingIcon: { fontSize: 52 },
  loadingTxt:  { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 4 },
});
