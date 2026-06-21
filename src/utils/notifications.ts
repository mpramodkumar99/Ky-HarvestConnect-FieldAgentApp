import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<void> {
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
}

export async function fireLocalNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch {
    // Notifications may not be available in Expo Go on all devices
  }
}

export function addNotificationTapListener(callback: (data: Record<string, unknown>) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    callback(response.notification.request.content.data as Record<string, unknown>);
  });
  return () => sub.remove();
}
