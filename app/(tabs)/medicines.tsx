import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Pill,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  X,
  MessageCircle,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { generateDosesForAllActiveMedicines } from '@/utils/generateDoses';
import { theme } from '@/constants/theme';

interface UserMedicine {
  id: string;
  medicine_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  instructions: string;
  active: boolean;
  medicines?: {
    purpose: string;
    side_effects: string[];
    warnings: string[];
  };
}

export default function MedicinesScreen() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<UserMedicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<UserMedicine[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<UserMedicine | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; message: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    medicine_name: '',
    dosage: '',
    frequency: '',
    times_per_day: '',
    start_date: '',
    end_date: '',
    instructions: '',
  });

  const loadMedicines = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_medicines')
      .select(
        `
        *,
        medicines (
          purpose,
          side_effects,
          warnings
        )
      `
      )
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setMedicines(data as any);
      setFilteredMedicines(data as any);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadMedicines();
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter((med) =>
        med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchQuery, medicines]);

  const onRefresh = () => {
    setRefreshing(true);
    loadMedicines();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAskAI = () => {
    setShowChatbot(true);
    setChatHistory([
      {
        role: 'assistant',
        message: 'Hello! I can help you with information about your medicines. What would you like to know?',
      },
    ]);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !user || chatLoading) return;

    const userMessage = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', message: userMessage }]);
    setChatLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session found');
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
      const apiUrl = `${supabaseUrl}/functions/v1/chat-assistant`;

      const headers = {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: userMessage,
          chatHistory: chatHistory.slice(-10),
        }),
      });

      const data = await response.json();

      if (data.message) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', message: data.message },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'assistant',
            message: 'I apologize, but I encountered an error. Please try again or consult your healthcare provider.',
          },
        ]);
      }
    } catch (error) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: 'I apologize, but I encountered an error. Please try again or consult your healthcare provider.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    if (!user || !newMedicine.medicine_name || !newMedicine.dosage || !newMedicine.frequency) {
      return;
    }

    const { error } = await supabase.from('user_medicines').insert({
      user_id: user.id,
      medicine_name: newMedicine.medicine_name,
      dosage: newMedicine.dosage,
      frequency: newMedicine.frequency,
      start_date: newMedicine.start_date || new Date().toISOString().split('T')[0],
      end_date: newMedicine.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      instructions: newMedicine.instructions,
      active: true,
    });

    if (!error) {
      await generateDosesForAllActiveMedicines(user.id);

      setShowAddMedicine(false);
      setNewMedicine({
        medicine_name: '',
        dosage: '',
        frequency: '',
        times_per_day: '',
        start_date: '',
        end_date: '',
        instructions: '',
      });
      loadMedicines();
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_medicines')
      .delete()
      .eq('id', medicineId)
      .eq('user_id', user.id);

    if (!error) {
      setSelectedMedicine(null);
      loadMedicines();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>My Medicines</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMedicine(true)}>
            <Plus color={theme.colors.primary} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Search color="#999" size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search medicines..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredMedicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Pill color="#999" size={64} />
            <Text style={styles.emptyText}>No medicines found</Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Add your first medicine by scanning a prescription'}
            </Text>
          </View>
        ) : (
          filteredMedicines.map((medicine) => (
            <TouchableOpacity
              key={medicine.id}
              style={styles.medicineCard}
              onPress={() => setSelectedMedicine(medicine)}>
              <View style={styles.medicineHeader}>
                <View style={styles.pillIcon}>
                  <Pill color="#667eea" size={24} />
                </View>
                <View style={styles.medicineHeaderInfo}>
                  <Text style={styles.medicineName}>{medicine.medicine_name}</Text>
                  <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
                </View>
              </View>
              <View style={styles.medicineDetails}>
                <View style={styles.detailRow}>
                  <Clock color="#666" size={16} />
                  <Text style={styles.detailText}>{medicine.frequency}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Calendar color="#666" size={16} />
                  <Text style={styles.detailText}>
                    {formatDate(medicine.start_date)} - {formatDate(medicine.end_date)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAskAI}>
        <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.fabGradient}>
          <MessageCircle color="#fff" size={28} />
        </LinearGradient>
      </TouchableOpacity>

      <Modal
        visible={selectedMedicine !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMedicine(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedMedicine?.medicine_name}</Text>
              <TouchableOpacity onPress={() => setSelectedMedicine(null)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Dosage</Text>
                <Text style={styles.modalText}>{selectedMedicine?.dosage}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Frequency</Text>
                <Text style={styles.modalText}>{selectedMedicine?.frequency}</Text>
              </View>

              {selectedMedicine?.instructions && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Instructions</Text>
                  <Text style={styles.modalText}>{selectedMedicine.instructions}</Text>
                </View>
              )}

              {selectedMedicine?.medicines?.purpose && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Purpose</Text>
                  <Text style={styles.modalText}>{selectedMedicine.medicines.purpose}</Text>
                </View>
              )}

              {selectedMedicine?.medicines?.warnings &&
                selectedMedicine.medicines.warnings.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Warnings</Text>
                    {selectedMedicine.medicines.warnings.map((warning, index) => (
                      <View key={index} style={styles.warningItem}>
                        <AlertCircle color="#FF6B6B" size={16} />
                        <Text style={styles.warningText}>{warning}</Text>
                      </View>
                    ))}
                  </View>
                )}

              {selectedMedicine?.medicines?.side_effects &&
                selectedMedicine.medicines.side_effects.length > 0 && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Possible Side Effects</Text>
                    {selectedMedicine.medicines.side_effects.map((effect, index) => (
                      <Text key={index} style={styles.listItem}>
                        • {effect}
                      </Text>
                    ))}
                  </View>
                )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  if (selectedMedicine) {
                    handleDeleteMedicine(selectedMedicine.id);
                  }
                }}>
                <Trash2 color="#FF6B6B" size={20} />
                <Text style={styles.deleteButtonText}>Delete Medicine</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddMedicine}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMedicine(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Medicine</Text>
              <TouchableOpacity onPress={() => setShowAddMedicine(false)}>
                <X color="#333" size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Medicine Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Aspirin"
                  placeholderTextColor="#999"
                  value={newMedicine.medicine_name}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, medicine_name: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Dosage *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 500mg"
                  placeholderTextColor="#999"
                  value={newMedicine.dosage}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, dosage: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Frequency *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Twice daily, Every 8 hours"
                  placeholderTextColor="#999"
                  value={newMedicine.frequency}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, frequency: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Times per Day</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., 2, 3, 4"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={newMedicine.times_per_day}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, times_per_day: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD (optional, defaults to today)"
                  placeholderTextColor="#999"
                  value={newMedicine.start_date}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, start_date: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>End Date</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="YYYY-MM-DD (optional, defaults to 30 days)"
                  placeholderTextColor="#999"
                  value={newMedicine.end_date}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, end_date: text })}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Instructions</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="e.g., Take with food, Avoid alcohol"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  value={newMedicine.instructions}
                  onChangeText={(text) => setNewMedicine({ ...newMedicine, instructions: text })}
                />
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddMedicine}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.submitButtonGradient}>
                  <Text style={styles.submitButtonText}>Add Medicine</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showChatbot}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowChatbot(false)}>
        <View style={styles.chatContainer}>
          <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.chatHeader}>
            <Text style={styles.chatTitle}>AI Medicine Assistant</Text>
            <TouchableOpacity onPress={() => setShowChatbot(false)}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.chatMessages}>
            {chatHistory.map((msg, index) => (
              <View
                key={index}
                style={[
                  styles.chatBubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}>
                <Text
                  style={[
                    styles.chatText,
                    msg.role === 'user' ? styles.userText : styles.assistantText,
                  ]}>
                  {msg.message}
                </Text>
              </View>
            ))}
            {chatLoading && (
              <View style={[styles.chatBubble, styles.assistantBubble]}>
                <ActivityIndicator color={theme.colors.primary} size="small" />
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            <TextInput
              style={styles.chatInput}
              placeholder="Ask about your medicines..."
              placeholderTextColor="#999"
              value={chatMessage}
              onChangeText={setChatMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
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
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  medicineCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  medicineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  pillIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicineHeaderInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 16,
    color: '#666',
  },
  medicineDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '80%',
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
  modalScroll: {
    padding: 24,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 16,
    color: '#FF6B6B',
    lineHeight: 24,
  },
  listItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    lineHeight: 24,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  chatTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  chatText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#fff',
  },
  assistantText: {
    color: '#333',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalActions: {
    padding: 24,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE8E8',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
});
