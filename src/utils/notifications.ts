import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// expo-notifications remote push was removed from Expo Go in SDK 53.
// All calls are wrapped in try-catch so the app works in Expo Go (silent no-ops)
// and notifications work as expected in a development build.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

export async function registerForPushNotificationsAsync(): Promise<void> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('orders', {
        name: 'New Orders',
        importance: Notifications.AndroidImportance.MAX,
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
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {}
}

export function addNotificationTapListener(
  callback: (data: Record<string, unknown>) => void,
): () => void {
  try {
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      callback(response.notification.request.content.data as Record<string, unknown>);
    });
    return () => sub.remove();
  } catch {
    return () => {};
  }
}
