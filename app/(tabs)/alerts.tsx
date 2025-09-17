import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { firestore, auth } from '@/services/firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';

interface Alert {
  id: string;
  title: string;
  body: string;
  severity: 'info' | 'warning' | 'danger';
  dispatchedAt: Date;
  ttlSeconds: number;
}

export default function AlertsInbox() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = () => {
    const alertsQuery = query(
      collection(firestore, 'alerts'),
      orderBy('dispatchedAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(alertsQuery, (snapshot) => {
      const alertData: Alert[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        alertData.push({
          id: doc.id,
          title: data.title,
          body: data.body,
          severity: data.severity,
          dispatchedAt: data.dispatchedAt.toDate(),
          ttlSeconds: data.ttlSeconds || 90,
        });
      });
      setAlerts(alertData);
      setRefreshing(false);
    });

    return unsubscribe;
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'info':
        return 'info';
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      default:
        return 'notifications';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString();
  };

  const isExpired = (alert: Alert) => {
    const now = new Date();
    const expiry = new Date(alert.dispatchedAt.getTime() + alert.ttlSeconds * 1000);
    return now > expiry;
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAlerts();
  };

  const renderAlert = ({ item }: { item: Alert }) => {
    const expired = isExpired(item);
    
    return (
      <TouchableOpacity
        style={[styles.alertCard, expired && styles.expiredCard]}
        onPress={() => router.push(`/alert-detail?id=${item.id}`)}>
        <View style={styles.alertHeader}>
          <MaterialIcons
            name={getSeverityIcon(item.severity)}
            size={24}
            color={getSeverityColor(item.severity)}
          />
          <View style={styles.alertInfo}>
            <Text style={[styles.alertTitle, expired && styles.expiredText]}>
              {item.title}
            </Text>
            <Text style={[styles.alertTime, expired && styles.expiredText]}>
              {formatTime(item.dispatchedAt)}
            </Text>
          </View>
          {expired && (
            <Text style={styles.expiredBadge}>EXPIRED</Text>
          )}
        </View>
        <Text style={[styles.alertBody, expired && styles.expiredText]} numberOfLines={2}>
          {item.body}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Alerts</Text>
        <Text style={styles.headerSubtitle}>
          {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="notifications-none" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No alerts yet</Text>
            <Text style={styles.emptySubtext}>
              You'll be notified here when emergency alerts are issued for your area.
            </Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expiredCard: {
    backgroundColor: '#f8f8f8',
    opacity: 0.7,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  alertTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  alertBody: {
    fontSize: 16,
    color: '#555',
    lineHeight: 22,
  },
  expiredText: {
    color: '#999',
  },
  expiredBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});