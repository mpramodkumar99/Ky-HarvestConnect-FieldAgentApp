import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import AppGate from '@/components/app-gate';
import { AuthProvider } from '@/context/auth-context';
import { DeliveryProvider } from '@/context/delivery-context';
import { LanguageProvider } from '@/context/language-context';
import { ThemePreferenceProvider, useThemePreference } from '@/context/theme-context';
import { ToastProvider } from '@/components/toast-provider';

function AppWithTheme() {
  const { scheme } = useThemePreference();
  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <LanguageProvider>
        <AuthProvider>
          <DeliveryProvider>
            <ToastProvider>
              <AppGate />
            </ToastProvider>
          </DeliveryProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <AppWithTheme />
    </ThemePreferenceProvider>
  );
}
