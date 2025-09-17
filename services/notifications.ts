import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { Audio } from 'expo-av';
import { firestore, auth } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  private static sound: Audio.Sound | null = null;

  static async initialize() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return null;
    }

    // Get push token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Save token to Firestore
    if (auth.currentUser) {
      await this.savePushToken(token);
    }

    // Set up notification handlers
    this.setupNotificationHandlers();

    return token;
  }

  static async savePushToken(token: string) {
    if (!auth.currentUser) return;

    try {
      await setDoc(doc(firestore, 'devices', auth.currentUser.uid), {
        userId: auth.currentUser.uid,
        pushToken: token,
        updatedAt: new Date(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  static setupNotificationHandlers() {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener(async (notification) => {
      console.log('Notification received:', notification);
      await this.handleEmergencyAlert(notification);
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const alertId = response.notification.request.content.data?.alertId;
      if (alertId) {
        // Navigate to alert detail
        // This would be handled by your navigation logic
      }
    });
  }

  static async handleEmergencyAlert(notification: Notifications.Notification) {
    try {
      // Play loud alert sound using expo-av
      await this.playAlertSound();
      
    } catch (error) {
      console.error('Error handling emergency alert:', error);
    }
  }

  static async playAlertSound() {
    try {
      // Configure audio mode for maximum volume
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      if (this.sound) {
        await this.sound.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/alert.mp3'),
        {
          shouldPlay: true,
          volume: 1.0,
          isLooping: false,
        }
      );

      this.sound = sound;
    } catch (error) {
      console.error('Error playing alert sound:', error);
      // Fallback: try to play a system sound
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' },
          {
            shouldPlay: true,
            volume: 1.0,
            isLooping: false,
          }
        );
        this.sound = sound;
      } catch (fallbackError) {
        console.error('Fallback sound also failed:', fallbackError);
      }
    }
  }

  static async scheduleLocalNotification(title: string, body: string, data: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Show immediately
    });
  }
}