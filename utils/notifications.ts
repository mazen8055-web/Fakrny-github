import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicine-reminders', {
      name: 'Medicine Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });
  }

  return true;
}

export async function scheduleMedicineReminder(
  medicineName: string,
  dosage: string,
  time: Date,
  repeatDaily: boolean = true
) {
  const trigger = repeatDaily
    ? {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      }
    : time;

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to take your medicine!',
      body: `${medicineName} - ${dosage}`,
      data: { medicineName, dosage },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: trigger as any,
  });

  return notificationId;
}

export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}
