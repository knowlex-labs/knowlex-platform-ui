import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { decode, encode } from 'base-64';
import { bootstrapCore } from '@/adapters/init-core';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';

// Polyfill atob/btoa for JWT decoding in @knowlex/core
if (typeof globalThis.atob === 'undefined') {
  globalThis.atob = decode;
}
if (typeof globalThis.btoa === 'undefined') {
  globalThis.btoa = encode;
}

SplashScreen.preventAutoHideAsync();

function AuthGate() {
  const { colors } = useTheme();
  const { isAuthenticated, isRestoringSession } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isRestoringSession) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isRestoringSession, segments]);

  if (isRestoringSession) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.kxSurface }]}>
        <ActivityIndicator size="large" color={colors.kxPrimary[600]} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [coreReady, setCoreReady] = useState(false);

  // Fonts will be loaded from Google Fonts or bundled assets later.
  // For now, the system font (San Francisco / Roboto) is used as fallback.
  const fontsLoaded = true;

  useEffect(() => {
    bootstrapCore().then(() => setCoreReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && coreReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, coreReady]);

  if (!fontsLoaded || !coreReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function ThemedApp() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </>
  );
}

const styles = {
  loading: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
};
