import AppGate from '@/components/app-gate';
import { AuthProvider } from '@/context/auth-context';
import { AgentProfileProvider } from '@/context/agent-profile-context';
import { DeliveryProvider } from '@/context/delivery-context';
import { LanguageProvider } from '@/context/language-context';
import { ThemePreferenceProvider } from '@/context/theme-context';
import { TabProvider } from '@/context/tab-context';
import { ToastProvider } from '@/components/toast-provider';

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <LanguageProvider>
        <AuthProvider>
          <AgentProfileProvider>
            <DeliveryProvider>
              <TabProvider>
                <ToastProvider>
                  <AppGate />
                </ToastProvider>
              </TabProvider>
            </DeliveryProvider>
          </AgentProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemePreferenceProvider>
  );
}
