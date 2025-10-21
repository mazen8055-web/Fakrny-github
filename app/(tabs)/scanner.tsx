import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, FileText, Sparkles } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { generateDosesForAllActiveMedicines } from '@/utils/generateDoses';
import { theme } from '@/constants/theme';

export default function ScannerScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [image, setImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need camera and media library permissions to scan prescriptions.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const processPrescription = async () => {
    if (!image || !user) return;

    setProcessing(true);

    try {
      const response = await fetch(image);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const fileName = `prescription_${Date.now()}.jpg`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, uint8Array, {
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('prescriptions').getPublicUrl(filePath);

      const { data: prescriptionData, error: prescriptionError} = await supabase
        .from('prescriptions')
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          prescription_date: new Date().toISOString().split('T')[0],
          processed: false,
        })
        .select()
        .single();

      if (prescriptionError) {
        throw prescriptionError;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;

      const apiUrl = `${supabaseUrl}/functions/v1/analyze-prescription`;

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const aiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prescription_id: prescriptionData.id,
          image_url: publicUrl,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        throw new Error(`AI service returned error: ${aiResponse.status} - ${errorText}`);
      }

      const aiResult = await aiResponse.json();

      if (aiResult.success && aiResult.medicines && aiResult.medicines.length > 0) {
        await generateDosesForAllActiveMedicines(user.id);

        Alert.alert(
          'Success!',
          `Found ${aiResult.medicines.length} medicine(s) in your prescription. They have been added to your medicine list with automatic dose scheduling.`,
          [
            {
              text: 'View Medicines',
              onPress: () => router.push('/(tabs)/medicines'),
            },
            { text: 'OK' },
          ]
        );
      } else {
        Alert.alert(
          'Prescription Saved',
          'Prescription uploaded but AI could not extract medicines automatically. Please add them manually.',
          [
            {
              text: 'Add Manually',
              onPress: () => router.push('/(tabs)/medicines'),
            },
            { text: 'OK' },
          ]
        );
      }

      setImage(null);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process prescription');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <Text style={styles.title}>Scan Prescription</Text>
        <Text style={styles.subtitle}>Take a photo or upload an image</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {!image ? (
          <>
            <View style={styles.infoCard}>
              <Sparkles color={theme.colors.primary} size={32} />
              <Text style={styles.infoTitle}>AI-Powered Scanning</Text>
              <Text style={styles.infoText}>
                Our AI can read doctor's handwriting and extract medicine details from your
                prescription in multiple languages.
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity style={styles.actionCard} onPress={takePhoto}>
                <View style={styles.actionIconContainer}>
                  <Camera color="#fff" size={40} />
                </View>
                <Text style={styles.actionTitle}>Take Photo</Text>
                <Text style={styles.actionDescription}>Use your camera to scan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={pickImage}>
                <View style={[styles.actionIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                  <ImageIcon color="#fff" size={40} />
                </View>
                <Text style={styles.actionTitle}>Choose Image</Text>
                <Text style={styles.actionDescription}>Pick from gallery</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tipsCard}>
              <FileText color={theme.colors.primary} size={24} />
              <Text style={styles.tipsTitle}>Tips for Best Results</Text>
              <View style={styles.tipsList}>
                <Text style={styles.tipItem}>• Ensure good lighting</Text>
                <Text style={styles.tipItem}>• Keep prescription flat and clear</Text>
                <Text style={styles.tipItem}>• Avoid shadows or glare</Text>
                <Text style={styles.tipItem}>• Include all medicine details</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Preview</Text>
              <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" />

              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.previewButton, styles.retakeButton]}
                  onPress={() => setImage(null)}>
                  <Text style={styles.retakeButtonText}>Retake</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.previewButton, styles.processButton]}
                  onPress={processPrescription}
                  disabled={processing}>
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.processButtonText}>Process Prescription</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                Google Gemini AI will analyze your prescription and automatically extract medicine information including name, dosage, frequency, and instructions.
              </Text>
            </View>
          </>
        )}
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
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  actionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 16,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  previewCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    marginBottom: 24,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  retakeButton: {
    backgroundColor: '#f5f5f5',
  },
  retakeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  processButton: {
    backgroundColor: theme.colors.primary,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  noteCard: {
    backgroundColor: theme.colors.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  noteText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    lineHeight: 20,
  },
});
