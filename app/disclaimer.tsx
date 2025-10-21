import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Check } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export default function DisclaimerScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!user || !accepted) return;

    setLoading(true);

    await supabase
      .from('profiles')
      .update({
        disclaimer_accepted: true,
        disclaimer_accepted_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <View style={styles.iconContainer}>
          <AlertTriangle color="#fff" size={64} />
        </View>
        <Text style={styles.title}>Important Notice</Text>
        <Text style={styles.subtitle}>Medical Disclaimer</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.disclaimerCard}>
          <Text style={styles.heading}>Please Read Carefully</Text>

          <Text style={styles.text}>
            Fakrny is a medication reminder and tracking application designed to help you manage
            your medicine schedule. However, it is important to understand the following:
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚕️ Not a Medical Device</Text>
            <Text style={styles.text}>
              Fakrny is NOT a medical device and is not intended to diagnose, treat, cure, or
              prevent any disease or medical condition.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👨‍⚕️ Not a Substitute for Medical Advice</Text>
            <Text style={styles.text}>
              This app does not replace professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or qualified healthcare provider with any
              questions about your medical condition or medications.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Medication Information</Text>
            <Text style={styles.text}>
              The AI-powered prescription scanning feature is provided as a convenience tool. While
              we strive for accuracy, errors may occur. Always verify medication details with your
              healthcare provider or pharmacist.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Your Responsibility</Text>
            <Text style={styles.text}>
              You are responsible for:
              {'\n'}• Taking medications as prescribed by your doctor
              {'\n'}• Verifying all medication information
              {'\n'}• Reading and following prescription instructions
              {'\n'}• Consulting your healthcare provider before making changes
              {'\n'}• Reporting any adverse reactions to your doctor
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🚨 Emergencies</Text>
            <Text style={styles.text}>
              In case of a medical emergency, call emergency services immediately. Do not rely on
              this app for emergency situations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 No Guarantees</Text>
            <Text style={styles.text}>
              We do not guarantee that:
              {'\n'}• The app will always function without errors
              {'\n'}• Reminders will always be delivered on time
              {'\n'}• AI scanning will be 100% accurate
              {'\n'}• The app will prevent missed doses
            </Text>
          </View>

          <View style={styles.warningBox}>
            <AlertTriangle color={theme.colors.error} size={24} />
            <Text style={styles.warningText}>
              By using Fakrny, you acknowledge that you understand and accept these terms. You
              agree that the developers and distributors of this app are not liable for any
              consequences resulting from your use of this application.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAccepted(!accepted)}>
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Check color="#fff" size={20} />}
          </View>
          <Text style={styles.checkboxText}>
            I have read and understand the medical disclaimer. I agree to use Fakrny as a reminder
            tool only and will consult healthcare professionals for all medical decisions.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, (!accepted || loading) && styles.buttonDisabled]}
          onPress={handleAccept}
          disabled={!accepted || loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Please wait...' : 'Accept and Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.declineButton}
          onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.declineText}>Decline and Exit</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  disclaimerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.textLight,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: theme.colors.errorLight,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.error,
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.error,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.text,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  declineButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textLight,
  },
});
