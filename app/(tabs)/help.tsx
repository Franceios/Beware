import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function Help() {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const FAQItem = ({
    id,
    question,
    answer,
  }: {
    id: string;
    question: string;
    answer: string;
  }) => {
    const isExpanded = expandedSections.includes(id);
    
    return (
      <TouchableOpacity
        style={styles.faqItem}
        onPress={() => toggleSection(id)}>
        <View style={styles.faqHeader}>
          <Text style={styles.faqQuestion}>{question}</Text>
          <MaterialIcons
            name={isExpanded ? 'expand-less' : 'expand-more'}
            size={24}
            color="#666"
          />
        </View>
        {isExpanded && (
          <Text style={styles.faqAnswer}>{answer}</Text>
        )}
      </TouchableOpacity>
    );
  };

  const ContactItem = ({
    icon,
    title,
    subtitle,
    onPress,
  }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.contactItem} onPress={onPress}>
      <MaterialIcons name={icon as any} size={24} color="#0B5FFF" />
      <View style={styles.contactText}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <Text style={styles.headerSubtitle}>
          Get help using BewareGH Citizen
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Emergency Information</Text>
        <View style={styles.emergencyCard}>
          <MaterialIcons name="warning" size={32} color="#FF4D4F" />
          <View style={styles.emergencyText}>
            <Text style={styles.emergencyTitle}>Emergency Numbers</Text>
            <Text style={styles.emergencySubtitle}>
              Police: 191 | Fire: 192 | Ambulance: 193
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <FAQItem
          id="how-it-works"
          question="How does BewareGH Citizen work?"
          answer="BewareGH Citizen uses your location to determine which emergency alert zones you're in. When authorities issue alerts for your area, you'll receive push notifications with important safety information."
        />

        <FAQItem
          id="location-privacy"
          question="Is my location data safe?"
          answer="Yes, your location is only used to determine which alert zones you're in. We don't track your movements or share your location with third parties. You can revoke location permissions at any time in Settings."
        />

        <FAQItem
          id="alert-types"
          question="What types of alerts will I receive?"
          answer="You'll receive three types of alerts: Info (blue) for general announcements, Warning (green) for potential hazards, and Danger (red) for immediate threats requiring action."
        />

        <FAQItem
          id="acknowledge-alerts"
          question="Do I need to acknowledge alerts?"
          answer="Yes, acknowledging alerts within the time limit helps authorities know you've received important safety information. This improves emergency response coordination."
        />

        <FAQItem
          id="battery-usage"
          question="Will this app drain my battery?"
          answer="BewareGH Citizen is designed to be battery-efficient. It only uses location services when needed and optimizes background processes to minimize battery impact."
        />

        <FAQItem
          id="offline-access"
          question="Does the app work offline?"
          answer="Some features like viewing previously downloaded alerts work offline, but you need internet connectivity to receive new emergency alerts and update your location."
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        
        <ContactItem
          icon="email"
          title="Email Support"
          subtitle="Get help via email"
          onPress={() => Linking.openURL('mailto:support@bewaregh.com')}
        />

        <ContactItem
          icon="phone"
          title="Phone Support"
          subtitle="+233 XX XXX XXXX"
          onPress={() => Linking.openURL('tel:+233XXXXXXXX')}
        />

        <ContactItem
          icon="language"
          title="Website"
          subtitle="Visit our website for more info"
          onPress={() => Linking.openURL('https://bewaregh.com')}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.aboutText}>
            BewareGH Citizen is developed to help keep Ghanaian citizens safe by providing
            timely emergency alerts and safety information. The app is part of the national
            emergency response infrastructure.
          </Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#f8f8f8',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff5f5',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4F',
  },
  emergencyText: {
    marginLeft: 16,
    flex: 1,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF4D4F',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  contactText: {
    flex: 1,
    marginLeft: 16,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  aboutCard: {
    padding: 20,
  },
  aboutText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});