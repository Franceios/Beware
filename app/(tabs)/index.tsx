import React, { useState, useEffect, useRef } from 'react';
import 'react-native-gesture-handler';
import {
  View,
  StyleSheet,
  Alert,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import MapView, { Marker, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheet } from '@/components/BottomSheet';
import { firestore } from '@/services/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

interface PolygonData {
  id: string;
  name: string;
  coordinates: { latitude: number; longitude: number }[];
  regionCenter: { latitude: number; longitude: number };
}

export default function HomeMap() {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [polygons, setPolygons] = useState<PolygonData[]>([]);
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonData | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    requestLocationPermission();
    loadPolygons();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required for emergency alerts');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const loadPolygons = () => {
    const polygonsQuery = query(collection(firestore, 'polygons'));
    const unsubscribe = onSnapshot(polygonsQuery, (snapshot) => {
      const polygonData: PolygonData[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        polygonData.push({
          id: doc.id,
          name: data.name,
          coordinates: data.coordinates.map((coord: [number, number]) => ({
            latitude: coord[0],
            longitude: coord[1],
          })),
          regionCenter: {
            latitude: data.regionCenter.latitude,
            longitude: data.regionCenter.longitude,
          },
        });
      });
      setPolygons(polygonData);
    });

    return unsubscribe;
  };

  const centerOnUser = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handlePolygonPress = (polygon: PolygonData) => {
    setSelectedPolygon(polygon);
    setShowBottomSheet(true);
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 5.6037,
          longitude: -0.1870,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}>
        
        {polygons.map((polygon) => (
          <Polygon
            key={polygon.id}
            coordinates={polygon.coordinates}
            strokeColor="#0B5FFF"
            fillColor="rgba(11, 95, 255, 0.1)"
            strokeWidth={2}
            tappable={true}
            onPress={() => handlePolygonPress(polygon)}
          />
        ))}
        
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="Your Location"
            pinColor="#FF4D4F"
          />
        )}
      </MapView>

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fab} onPress={centerOnUser}>
          <MaterialIcons name="my-location" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <BottomSheet
        visible={showBottomSheet}
        onClose={() => setShowBottomSheet(false)}
        title={selectedPolygon?.name || ''}
        content={
          <View style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetText}>
              Emergency alert zone: {selectedPolygon?.name}
            </Text>
            <Text style={styles.bottomSheetSubtext}>
              You will receive notifications for emergencies in this area.
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
  },
  map: {
    flex: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
  },
  fab: {
    backgroundColor: '#0B5FFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  bottomSheetContent: {
    padding: 20,
  },
  bottomSheetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  bottomSheetSubtext: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});