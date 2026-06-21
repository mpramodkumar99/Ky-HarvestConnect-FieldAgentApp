import { Platform } from 'react-native';

// expo-notifications throws at module init in Expo Go (SDK 53+).
// Static `import` runs before any try-catch, so we use lazy require() instead.
type NotificationsModule = typeof import('expo-notifications');

let _mod: NotificationsModule | null = null;
let _ready = false;

function getModule(): NotificationsModule | null {
  if (_ready) return _mod;
  _ready = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _mod = require('expo-notifications') as NotificationsModule;
    _mod.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    _mod = null; // Expo Go — silently disable
  }
  return _mod;
}

export async function registerForPushNotificationsAsync(): Promise<void> {
  const n = getModule();
  if (!n) return;
  try {
    const { status: existing } = await n.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await n.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') return;
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('orders', {
        name: 'New Orders',
        importance: n.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2E7D32',
      });
    }
  } catch {}
}

export async function fireLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  const n = getModule();
  if (!n) return;
  try {
    await n.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {}
}

export function addNotificationTapListener(
  callback: (data: Record<string, unknown>) => void,
): () => void {
  const n = getModule();
  if (!n) return () => {};
  try {
    const sub = n.addNotificationResponseReceivedListener(response => {
      callback(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
