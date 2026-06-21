import AppGate from '@/components/app-gate';
import { AuthProvider } from '@/context/auth-context';
import { AgentProfileProvider } from '@/context/agent-profile-context';
import { DeliveryProvider } from '@/context/delivery-context';
import { LanguageProvider } from '@/context/language-context';
import { ThemePreferenceProvider } from '@/context/theme-context';
import { ToastProvider } from '@/components/toast-provider';

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <LanguageProvider>
        <AuthProvider>
          <AgentProfileProvider>
            <DeliveryProvider>
              <ToastProvider>
                <AppGate />
              </ToastProvider>
            </DeliveryProvider>
          </AgentProfileProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemePreferenceProvider>
  );
}
