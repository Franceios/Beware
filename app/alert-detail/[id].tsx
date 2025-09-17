import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { firestore, auth } from '@/services/firebase';
import { doc, getDoc, addDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface AlertData {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'danger';
  dispatchedAt: Date;
  ttlSeconds: number;
}

export default function AlertDetail() {
  const { id } = useLocalSearchParams();
  const [alert, setAlert] = useState<AlertData | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadAlert(id as string);
    }
  }, [id]);

  useEffect(() => {
    if (alert && timeRemaining > 0) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(alert.dispatchedAt.getTime() + alert.ttlSeconds * 1000);
        const remaining = Math.max(0, expiry.getTime() - now.getTime());
        setTimeRemaining(remaining);

        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [alert, timeRemaining]);

  const loadAlert = async (alertId: string) => {
    try {
      const alertDoc = await getDoc(doc(firestore, 'alerts', alertId));
      if (alertDoc.exists()) {
        const data = alertDoc.data();
        const alertData: AlertData = {
          id: alertDoc.id,
          title: data.title,
          body: data.body,
          severity: data.severity,
          dispatchedAt: data.dispatchedAt.toDate(),
          ttlSeconds: data.ttlSeconds || 90,
        };
        setAlert(alertData);

        // Calculate initial time remaining
        const now = new Date();
        const expiry = new Date(alertData.dispatchedAt.getTime() + alertData.ttlSeconds * 1000);
        const remaining = Math.max(0, expiry.getTime() - now.getTime());
        setTimeRemaining(remaining);

        // Check if already acknowledged
        await checkAcknowledgment(alertId);
      }
    } catch (error) {
      console.error('Error loading alert:', error);
      Alert.alert('Error', 'Failed to load alert details');
    } finally {
      setLoading(false);
    }
  };

  const checkAcknowledgment = async (alertId: string) => {
    if (!auth.currentUser) return;

    try {
      const acksQuery = query(
        collection(firestore, 'acks'),
        where('alertId', '==', alertId),
        where('userId', '==', auth.currentUser.uid)
      );
      const acksSnapshot = await getDocs(acksQuery);
      setAcknowledged(!acksSnapshot.empty);
    } catch (error) {
      console.error('Error checking acknowledgment:', error);
    }
  };

  const acknowledgeAlert = async () => {
    if (!alert || !auth.currentUser) return;

    try {
      const now = new Date();
      const expiry = new Date(alert.dispatchedAt.getTime() + alert.ttlSeconds * 1000);
      const withinTTL = now <= expiry;

      await addDoc(collection(firestore, 'acks'), {
        alertId: alert.id,
        userId: auth.currentUser.uid,
        ackAt: now,
        withinTTL,
      });

      setAcknowledged(true);
      Alert.alert(
        'Acknowledged',
        withinTTL
          ? 'Alert acknowledged successfully'
          : 'Alert acknowledged (outside time limit)'
      );
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      Alert.alert('Error', 'Failed to acknowledge alert');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info':
        return '#0B5FFF';
      case 'warning':
        return '#0FAF5F';
      case 'danger':
        return '#FF4D4F';
      default:
        return '#666';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'Information';
      case 'warning':
        return 'Warning';
      case 'danger':
        return 'Danger';
      default:
        return 'Alert';
    }
  };

  const formatTimeRemaining = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading alert...</Text>
      </View>
    );
  }

  if (!alert) {
    return (
      <View style={styles.errorContainer}>
        <Text>Alert not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isExpired = timeRemaining === 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIcon} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Alert</Text>
      </View>

      <View style={[styles.severityBanner, { backgroundColor: getSeverityColor(alert.severity) }]}>
        <MaterialIcons
          name={alert.severity === 'danger' ? 'warning' : 'info'}
          size={32}
          color="#fff"
        />
        <View style={styles.severityInfo}>
          <Text style={styles.severityLabel}>{getSeverityLabel(alert.severity)}</Text>
          <Text style={styles.severityTime}>
            {alert.dispatchedAt.toLocaleString()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.alertTitle}>{alert.title}</Text>
        <Text style={styles.alertBody}>{alert.body}</Text>

        {!isExpired ? (
          <View style={styles.ttlContainer}>
            <MaterialIcons name="timer" size={24} color="#FF4D4F" />
            <Text style={styles.ttlText}>
              Time remaining: {formatTimeRemaining(timeRemaining)}
            </Text>
          </View>
        ) : (
          <View style={styles.expiredContainer}>
            <MaterialIcons name="timer-off" size={24} color="#999" />
            <Text style={styles.expiredText}>This alert has expired</Text>
          </View>
        )}

        {!acknowledged ? (
          <TouchableOpacity
            style={[
              styles.acknowledgeButton,
              isExpired && styles.acknowledgeButtonExpired,
            ]}
            onPress={acknowledgeAlert}>
            <MaterialIcons
              name="check-circle"
              size={24}
              color={isExpired ? '#999' : '#fff'}
            />
            <Text style={[
              styles.acknowledgeButtonText,
              isExpired && styles.acknowledgeButtonTextExpired,
            ]}>
              {isExpired ? 'Acknowledge (Expired)' : 'Acknowledge Alert'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.acknowledgedContainer}>
            <MaterialIcons name="check-circle" size={24} color="#0FAF5F" />
            <Text style={styles.acknowledgedText}>Alert Acknowledged</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  severityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  severityInfo: {
    marginLeft: 16,
    flex: 1,
  },
  severityLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  severityTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  alertBody: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    marginBottom: 32,
  },
  ttlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f5',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4F',
    marginBottom: 24,
  },
  ttlText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D4F',
    marginLeft: 12,
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#999',
    marginBottom: 24,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginLeft: 12,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0FAF5F',
    padding: 16,
    borderRadius: 8,
  },
  acknowledgeButtonExpired: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  acknowledgeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  acknowledgeButtonTextExpired: {
    color: '#999',
  },
  acknowledgedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0FAF5F',
  },
  acknowledgedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0FAF5F',
    marginLeft: 8,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#0B5FFF',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
});