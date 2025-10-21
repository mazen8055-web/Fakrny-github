import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { theme } from '@/constants/theme';
import {
  User,
  Mail,
  Calendar,
  Phone,
  Globe,
  Moon,
  Bell,
  LogOut,
  Save,
  FileText,
  ShieldCheck,
  Scale,
  Lock,
  AlertTriangle,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';

interface Profile {
  full_name: string;
  date_of_birth: string;
  phone_number: string;
  language_preference: string;
  theme_preference: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    date_of_birth: '',
    phone_number: '',
    language_preference: 'en',
    theme_preference: 'light',
  });

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        date_of_birth: data.date_of_birth || '',
        phone_number: data.phone_number || '',
        language_preference: data.language_preference || 'en',
        theme_preference: data.theme_preference || 'light',
      });
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update profile');
    } else {
      Alert.alert('Success', 'Profile updated successfully');
      setEditing(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { data: { session } } = await supabase.auth.getSession();

              if (!session) {
                throw new Error('Not authenticated');
              }

              const { data, error } = await supabase.functions.invoke('delete-account', {
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              });

              if (error) throw error;

              Alert.alert('Success', 'Your account has been deleted', [
                {
                  text: 'OK',
                  onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                  },
                },
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };


  const toggleTheme = async () => {
    const newTheme = profile.theme_preference === 'light' ? 'dark' : 'light';
    setProfile({
      ...profile,
      theme_preference: newTheme,
    });

    if (user) {
      await supabase
        .from('profiles')
        .update({ theme_preference: newTheme, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }
  };

  const selectLanguage = async (languageCode: string) => {
    setProfile({
      ...profile,
      language_preference: languageCode,
    });
    setShowLanguageModal(false);

    if (user) {
      await supabase
        .from('profiles')
        .update({ language_preference: languageCode, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }
  };

  const getLanguageName = () => {
    const lang = LANGUAGES.find((l) => l.code === profile.language_preference);
    return lang ? `${lang.flag} ${lang.name}` : 'English';
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17bebb', '#14a8a4']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <User color="#fff" size={48} />
          </View>
        </View>
        <Text style={styles.name}>{profile.full_name || 'User'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Text style={styles.editButton}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={saveProfile} disabled={loading}>
                <View style={styles.saveButton}>
                  <Save color="#17bebb" size={20} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <User color="#666" size={20} />
                <Text style={styles.labelText}>Full Name</Text>
              </View>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.full_name}
                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                editable={editing}
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Mail color="#666" size={20} />
                <Text style={styles.labelText}>Email</Text>
              </View>
              <Text style={styles.staticText}>{user?.email}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Phone color="#666" size={20} />
                <Text style={styles.labelText}>Phone Number</Text>
              </View>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.phone_number}
                onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                editable={editing}
                placeholder="Enter your phone number"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <View style={styles.inputLabel}>
                <Calendar color="#666" size={20} />
                <Text style={styles.labelText}>Date of Birth</Text>
              </View>
              <TextInput
                style={[styles.input, !editing && styles.inputDisabled]}
                value={profile.date_of_birth}
                onChangeText={(text) => setProfile({ ...profile, date_of_birth: text })}
                editable={editing}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.preferenceRow}
              onPress={() => setShowLanguageModal(true)}>
              <View style={styles.preferenceLabel}>
                <Globe color="#666" size={20} />
                <View style={styles.preferenceLabelText}>
                  <Text style={styles.labelText}>Language</Text>
                  <Text style={styles.sublabelText}>{getLanguageName()}</Text>
                </View>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Moon color="#666" size={20} />
                <View style={styles.preferenceLabelText}>
                  <Text style={styles.labelText}>Dark Mode</Text>
                  <Text style={styles.sublabelText}>Currently {profile.theme_preference}</Text>
                </View>
              </View>
              <Switch
                value={profile.theme_preference === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.preferenceRow}>
              <View style={styles.preferenceLabel}>
                <Bell color="#666" size={20} />
                <View style={styles.preferenceLabelText}>
                  <Text style={styles.labelText}>Notifications</Text>
                  <Text style={styles.sublabelText}>Medicine reminders</Text>
                </View>
              </View>
              <Switch
                value={true}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Policies</Text>

          <View style={styles.card}>
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'tos' } })}>
              <View style={styles.legalIcon}>
                <FileText color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Terms of Service</Text>
                <Text style={styles.legalSubtitle}>Review our terms and conditions</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'tac' } })}>
              <View style={styles.legalIcon}>
                <Scale color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Terms and Conditions</Text>
                <Text style={styles.legalSubtitle}>App usage terms</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'privacy' } })}>
              <View style={styles.legalIcon}>
                <ShieldCheck color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Privacy Policy</Text>
                <Text style={styles.legalSubtitle}>How we protect your data</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'security' } })}>
              <View style={styles.legalIcon}>
                <Lock color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Data & Security</Text>
                <Text style={styles.legalSubtitle}>Security measures and controls</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'disclaimer' } })}>
              <View style={styles.legalIcon}>
                <AlertTriangle color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Medical Disclaimer</Text>
                <Text style={styles.legalSubtitle}>Important legal information</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => router.push({ pathname: '/legal-document', params: { type: 'consent' } })}>
              <View style={styles.legalIcon}>
                <FileText color={theme.colors.primary} size={20} />
              </View>
              <View style={styles.legalContent}>
                <Text style={styles.legalTitle}>Consent & User Agreement</Text>
                <Text style={styles.legalSubtitle}>Your rights and responsibilities</Text>
              </View>
              <ChevronRight color="#999" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.actionButton} onPress={handleSignOut}>
              <LogOut color="#FF6B6B" size={20} />
              <Text style={styles.actionButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={loading}>
              <Trash2 color="#FF3B30" size={20} />
              <View style={styles.deleteContent}>
                <Text style={styles.deleteButtonText}>Delete Account</Text>
                <Text style={styles.deleteButtonSubtext}>Permanently delete all data</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Fakrny v1.0.0</Text>
          <Text style={styles.footerSubtext}>Your Medicine Reminder Assistant</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    profile.language_preference === language.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => selectLanguage(language.code)}>
                  <Text style={styles.languageFlag}>{language.flag}</Text>
                  <Text
                    style={[
                      styles.languageName,
                      profile.language_preference === language.code && styles.languageNameSelected,
                    ]}>
                    {language.name}
                  </Text>
                  {profile.language_preference === language.code && (
                    <View style={styles.checkmark}>
                      <Text style={styles.checkmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sublabelText: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  inputDisabled: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  staticText: {
    fontSize: 16,
    color: '#666',
    paddingVertical: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  preferenceLabelText: {
    gap: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  deleteContent: {
    flex: 1,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
  deleteButtonSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  legalIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legalContent: {
    flex: 1,
    gap: 2,
  },
  legalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  legalSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  modalClose: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  languageList: {
    padding: 16,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 12,
    gap: 12,
  },
  languageOptionSelected: {
    backgroundColor: theme.colors.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  languageFlag: {
    fontSize: 32,
  },
  languageName: {
    fontSize: 18,
    color: '#333',
    flex: 1,
  },
  languageNameSelected: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
