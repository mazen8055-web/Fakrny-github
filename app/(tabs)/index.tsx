import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Clock, Calendar, CheckCircle, Camera, Pill, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { generateDosesForAllActiveMedicines } from '@/utils/generateDoses';
import { theme } from '@/constants/theme';

interface MedicineDose {
  id: string;
  scheduled_time: string;
  status: string;
  taken_at: string | null;
  user_medicines: {
    medicine_name: string;
    dosage: string;
  };
}

interface Stats {
  activeMedicines: number;
  todayTaken: number;
  todayTotal: number;
  upcomingCount: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingMeds, setUpcomingMeds] = useState<MedicineDose[]>([]);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState<Stats>({
    activeMedicines: 0,
    todayTaken: 0,
    todayTotal: 0,
    upcomingCount: 0,
  });

  const loadData = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    await generateDosesForAllActiveMedicines(user.id);

    const { data: profileData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (profileData?.full_name) {
      const firstName = profileData.full_name.split(' ')[0];
      setUserName(firstName);
    } else {
      setUserName(user.email?.split('@')[0] || 'User');
    }

    const { data: activeMedicinesData } = await supabase
      .from('user_medicines')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true);

    const { data: todayDosesData } = await supabase
      .from('medicine_doses')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_time', `${today}T00:00:00`)
      .lte('scheduled_time', `${today}T23:59:59`);

    const { data: upcomingData } = await supabase
      .from('medicine_doses')
      .select(`
        id,
        scheduled_time,
        status,
        taken_at,
        user_medicines (
          medicine_name,
          dosage
        )
      `)
      .eq('user_id', user.id)
      .gte('scheduled_time', now)
      .order('scheduled_time', { ascending: true })
      .limit(5);

    const takenToday = todayDosesData?.filter((dose) => dose.status === 'taken').length || 0;

    setStats({
      activeMedicines: activeMedicinesData?.length || 0,
      todayTaken: takenToday,
      todayTotal: todayDosesData?.length || 0,
      upcomingCount: upcomingData?.length || 0,
    });

    setUpcomingMeds((upcomingData as any) || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const markAsTaken = async (doseId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('medicine_doses')
      .update({
        status: 'taken',
        taken_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', doseId)
      .eq('user_id', user.id);

    if (error) {
      return;
    }

    await loadData();
  };

  const removeDose = async (doseId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('medicine_doses')
      .delete()
      .eq('id', doseId)
      .eq('user_id', user.id);

    if (error) {
      return;
    }

    await loadData();
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17bebb', '#14a8a4']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{userName || 'User'}</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <Pill color={theme.colors.primary} size={24} />
            </View>
            <Text style={styles.statNumber}>{stats.activeMedicines}</Text>
            <Text style={styles.statLabel}>Active Medicines</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: theme.colors.successLight }]}>
              <CheckCircle color={theme.colors.success} size={24} />
            </View>
            <Text style={styles.statNumber}>
              {stats.todayTaken}/{stats.todayTotal}
            </Text>
            <Text style={styles.statLabel}>Taken Today</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Doses</Text>
            <Clock color="#666" size={20} />
          </View>

          {upcomingMeds.length === 0 ? (
            <View style={styles.emptyState}>
              <CheckCircle color={theme.colors.primary} size={48} />
              <Text style={styles.emptyText}>All caught up!</Text>
              <Text style={styles.emptySubtext}>No upcoming doses scheduled</Text>
            </View>
          ) : (
            upcomingMeds.map((med) => (
              <View key={med.id} style={styles.medicineCard}>
                <View style={styles.medicineIconContainer}>
                  <View style={styles.medicineIcon}>
                    {med.status === 'taken' ? (
                      <CheckCircle color="#17bebb" size={24} />
                    ) : (
                      <Clock color="#17bebb" size={24} />
                    )}
                  </View>
                </View>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{med.user_medicines.medicine_name}</Text>
                  <Text style={styles.medicineDosage}>{med.user_medicines.dosage}</Text>
                  <Text style={styles.medicineTimeLabel}>{formatTime(med.scheduled_time)}</Text>
                </View>
                <View style={styles.medicineActions}>
                  {med.status === 'pending' ? (
                    <TouchableOpacity
                      style={styles.takenButton}
                      onPress={() => markAsTaken(med.id)}>
                      <Text style={styles.takenButtonText}>Mark Taken</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.takenBadge}>
                      <CheckCircle color="#17bebb" size={16} />
                      <Text style={styles.takenBadgeText}>Taken</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDose(med.id)}>
                    <Trash2 color="#FF6B6B" size={18} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/scanner')}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.actionGradient}>
              <Camera color="#fff" size={28} />
              <Text style={styles.actionText}>Scan Prescription</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/medicines')}>
            <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.actionGradient}>
              <Pill color="#fff" size={28} />
              <Text style={styles.actionText}>View Medicines</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  headerContent: {
    gap: 8,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
    textAlign: 'center',
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    ...theme.shadows.sm,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: theme.fontSize.xxxl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.xxl,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  emptyText: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  emptySubtext: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textLight,
  },
  medicineCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  medicineIconContainer: {
    marginRight: 16,
  },
  medicineIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: theme.fontSize.base,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textLight,
  },
  medicineTimeLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  medicineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takenButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
  },
  takenButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.white,
  },
  takenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  takenBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.success,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    gap: 16,
  },
  actionButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  actionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
});
