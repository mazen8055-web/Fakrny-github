import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '@/contexts/AuthContext';
import { requestNotificationPermissions } from '@/utils/notifications';
import Head from 'expo-router/head';

export default function RootLayout() {
  useFrameworkReady();

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  return (
    <AuthProvider>
      <Head>
        <title>Fakrny - Your Medicine Reminder Assistant</title>
        <meta name="description" content="Never miss your medicine again. Fakrny is a smart medicine reminder app that helps you track your medications, scan prescriptions with AI, and stay on top of your health." />
        <meta name="keywords" content="medicine reminder, medication tracker, prescription scanner, health app, medicine schedule, dose tracker, AI prescription reader" />
        <meta name="author" content="Fakrny" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta property="og:title" content="Fakrny - Your Medicine Reminder Assistant" />
        <meta property="og:description" content="Never miss your medicine again. Smart medicine tracking with AI-powered prescription scanning." />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Fakrny" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Fakrny - Your Medicine Reminder Assistant" />
        <meta name="twitter:description" content="Never miss your medicine again. Smart medicine tracking with AI-powered prescription scanning." />

        <meta name="theme-color" content="#17bebb" />
        <meta name="application-name" content="Fakrny" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fakrny" />

        <link rel="canonical" href="https://fakrny.app" />
      </Head>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
