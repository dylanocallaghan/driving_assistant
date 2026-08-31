import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { env } from '../config/env';

type StatusCardProps = {
  label: string;
  title: string;
  body: string;
};

type HomeScreenProps = {
  onStartSession: () => void;
  sessionStorageStatusMessage: string | null;
  storedSessionCount: number;
};

export function HomeScreen({ onStartSession, sessionStorageStatusMessage, storedSessionCount }: HomeScreenProps) {

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Home</Text>
        <Text style={styles.title}>{env.appName}</Text>
        <Text style={styles.body}>
          Practice-ready foundation for future driving sessions. This home screen provides the primary start point while later milestones add session setup, permissions, and assessment features.
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={onStartSession}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Start session</Text>
        </Pressable>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Session setup available</Text>
          <Text style={styles.noticeBody}>
            Start session now opens the pre-drive flow. GPS recording starts in the active session after location permission is granted.
          </Text>
        </View>

        {sessionStorageStatusMessage ? (
          <View style={styles.storageNoticeCard}>
            <Text style={styles.storageNoticeTitle}>Local session storage</Text>
            <Text style={styles.storageNoticeBody}>{sessionStorageStatusMessage}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current status</Text>
        <Text style={styles.sectionBody}>
          The app is intentionally limited to milestone-safe placeholders until later implementation stages are approved.
        </Text>
      </View>

      <View style={styles.cardsGrid}>
        <StatusCard
          label="Ready now"
          title="Onboarding completed"
          body="First-run guidance is stored locally so returning users land here directly."
        />
        <StatusCard
          label="Next milestone"
          title="Driving session setup"
          body="Pre-drive flow, session lifecycle, and required checks are reserved for Milestone 4."
        />
        <StatusCard
          label="Now active"
          title="GPS recording"
          body="Active sessions record raw GPS samples locally, including timestamp, location, speed where available, and GPS accuracy."
        />
        <StatusCard
          label="Available now"
          title="Permissions and sensing"
          body="Camera permission can now be reviewed in session setup. Camera capture still remains disabled while GPS and motion sensors run during active sessions."
        />
        <StatusCard
          label="Available now"
          title="Completed session storage"
          body={`${storedSessionCount} completed session${storedSessionCount === 1 ? '' : 's'} stored locally for future results and history views.`}
        />
        <StatusCard
          label="Not active yet"
          title="Assessment and scoring"
          body="No telemetry, event detection, proprietary scoring, or AI coaching runs from the home screen."
        />
      </View>
    </ScrollView>
  );
}

function StatusCard({ label, title, body }: StatusCardProps) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    gap: 18,
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#0f766e',
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  primaryButton: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  noticeCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#155e75',
  },
  noticeBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#164e63',
  },
  storageNoticeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  storageNoticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  storageNoticeBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  section: {
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  cardsGrid: {
    gap: 14,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#0f766e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
});
