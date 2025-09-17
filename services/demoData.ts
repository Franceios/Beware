import { firestore } from './firebase';
import { collection, doc, setDoc, addDoc } from 'firebase/firestore';

export class DemoDataService {
  static async seedDemoData() {
    try {
      // Create demo polygons
      await this.createDemoPolygons();
      
      // Create demo alert
      await this.createDemoAlert();
      
      console.log('Demo data seeded successfully');
    } catch (error) {
      console.error('Error seeding demo data:', error);
    }
  }

  private static async createDemoPolygons() {
    // Accra Central polygon
    const accraPolygon = {
      name: 'Accra Central',
      coordinates: [
        [5.5502, -0.2084],
        [5.5520, -0.2050],
        [5.5490, -0.2030],
        [5.5470, -0.2070],
        [5.5502, -0.2084], // Close the polygon
      ],
      regionCenter: {
        latitude: 5.5496,
        longitude: -0.2057,
      },
    };

    // East Legon polygon
    const eastLegonPolygon = {
      name: 'East Legon',
      coordinates: [
        [5.6500, -0.1650],
        [5.6520, -0.1600],
        [5.6480, -0.1580],
        [5.6460, -0.1630],
        [5.6500, -0.1650], // Close the polygon
      ],
      regionCenter: {
        latitude: 5.6490,
        longitude: -0.1615,
      },
    };

    await setDoc(doc(firestore, 'polygons', 'accra-central'), accraPolygon);
    await setDoc(doc(firestore, 'polygons', 'east-legon'), eastLegonPolygon);
  }

  private static async createDemoAlert() {
    const demoAlert = {
      title: 'Flash Flood Warning',
      body: 'Heavy rainfall has caused flooding in low-lying areas. Avoid unnecessary travel and stay away from flooded roads. Emergency services are on standby.',
      severity: 'warning',
      polygonId: 'accra-central',
      dispatchedAt: new Date(),
      ttlSeconds: 300, // 5 minutes for demo
    };

    await addDoc(collection(firestore, 'alerts'), demoAlert);
  }
}