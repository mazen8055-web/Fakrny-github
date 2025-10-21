import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Index() {
  const { session, user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [checkingDisclaimer, setCheckingDisclaimer] = useState(true);

  useEffect(() => {
    async function checkDisclaimerAcceptance() {
      if (loading || !session || !user) {
        setCheckingDisclaimer(false);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('disclaimer_accepted')
        .eq('id', user.id)
        .single();

      if (data && !data.disclaimer_accepted) {
        router.replace('/disclaimer');
      }

      setCheckingDisclaimer(false);
    }

    checkDisclaimerAcceptance();
  }, [session, user, loading]);

  useEffect(() => {
    if (loading || checkingDisclaimer) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isEmptyPath = (segments as string[]).length === 0;

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (session && isEmptyPath) {
      router.replace('/(tabs)');
    } else if (!session && isEmptyPath) {
      router.replace('/(auth)/login');
    }
  }, [session, loading, checkingDisclaimer]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4CAF50" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
