import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, firestore } from '@/services/firebase';
import { signOut } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';

export default function Settings() {
  const [locationConsent, setLocationConsent] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLocationConsent(userData.locationConsent || false);
        }
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }
  };

  const updateLocationConsent = async (value: boolean) => {
    if (!auth.currentUser) return;

    try {
      await updateDoc(doc(firestore, 'users', auth.currentUser.uid), {
        locationConsent: value,
      });
      setLocationConsent(value);
    } catch (error) {
      console.error('Error updating location consent:', error);
      Alert.alert('Error', 'Failed to update location settings');
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut(auth);
              router.replace('/auth');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    rightComponent,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <MaterialIcons name={icon as any} size={24} color="#666" />
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent && <View style={styles.settingRight}>{rightComponent}</View>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        {user && (
          <Text style={styles.headerSubtitle}>
            {user.displayName || user.email}
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy & Permissions</Text>
        
        <SettingItem
          icon="location-on"
          title="Location Access"
          subtitle="Allow location tracking for emergency alerts"
          rightComponent={
            <Switch
              value={locationConsent}
              onValueChange={updateLocationConsent}
              trackColor={{ false: '#e0e0e0', true: '#0B5FFF' }}
              thumbColor={locationConsent ? '#fff' : '#fff'}
            />
          }
        />

        <SettingItem
          icon="notifications"
          title="Push Notifications"
          subtitle="Receive emergency alerts"
          rightComponent={
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#e0e0e0', true: '#0B5FFF' }}
              thumbColor={pushNotifications ? '#fff' : '#fff'}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <SettingItem
          icon="person"
          title="Profile"
          subtitle="Manage your profile information"
          rightComponent={<MaterialIcons name="chevron-right" size={24} color="#ccc" />}
        />

        <SettingItem
          icon="security"
          title="Privacy Policy"
          subtitle="How we protect your data"
          rightComponent={<MaterialIcons name="chevron-right" size={24} color="#ccc" />}
        />

        <SettingItem
          icon="description"
          title="Terms of Service"
          subtitle="App usage terms and conditions"
          rightComponent={<MaterialIcons name="chevron-right" size={24} color="#ccc" />}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <SettingItem
          icon="help"
          title="Help & FAQ"
          subtitle="Get help using the app"
          rightComponent={<MaterialIcons name="chevron-right" size={24} color="#ccc" />}
          onPress={() => router.push('/help')}
        />

        <SettingItem
          icon="feedback"
          title="Send Feedback"
          subtitle="Report issues or suggest improvements"
          rightComponent={<MaterialIcons name="chevron-right" size={24} color="#ccc" />}
        />
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <MaterialIcons name="logout" size={24} color="#FF4D4F" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>BewareGH Citizen v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    marginLeft: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 16,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF4D4F',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D4F',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#999',
  },
});