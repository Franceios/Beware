import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { DemoDataService } from '@/services/demoData';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Seed demo data when user is authenticated
        DemoDataService.seedDemoData();
      }
    });

    return unsubscribe;
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="alert-detail" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}