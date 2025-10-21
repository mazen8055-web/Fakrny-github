import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { legalDocuments, LegalDocumentType } from '@/constants/legalDocuments';

export default function LegalDocumentScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();

  const document = legalDocuments[type as LegalDocumentType];

  if (!document) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Document not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#17bebb', '#14a8a4']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft color="#fff" size={28} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{document.title}</Text>
            <Text style={styles.lastUpdated}>Last updated: {document.lastUpdated}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.documentCard}>
          <Text style={styles.documentText}>{document.content}</Text>
        </View>

        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            For questions about these terms, contact us at:
          </Text>
          <Text style={styles.contactEmail}>Support@demandcom.com</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  backButton: {
    marginTop: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
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
  documentCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  documentText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  contactCard: {
    backgroundColor: '#E0F7F7',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  contactEmail: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17bebb',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
});
