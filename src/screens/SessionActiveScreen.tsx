import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SessionActiveScreenProps = {
  session: {
    id: string;
    startedAt: string;
  };
  onStopSession: () => void;
};

export function SessionActiveScreen({ session, onStopSession }: SessionActiveScreenProps) {
  const startedAt = new Date(session.startedAt);
  const startedAtLabel = Number.isNaN(startedAt.getTime())
    ? 'Session active'
    : startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Session Active</Text>
        <Text style={styles.title}>Practice session started</Text>
        <Text style={styles.body}>This milestone establishes the start and stop lifecycle only. Driving capture and assessment features remain disabled until later milestones.</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Started at</Text>
        <Text style={styles.statusValue}>{startedAtLabel}</Text>
        <Text style={styles.statusMeta}>Session reference: {session.id}</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current scope</Text>
        <Text style={styles.statusList}>• No camera recording</Text>
        <Text style={styles.statusList}>• No GPS capture</Text>
        <Text style={styles.statusList}>• No sensor collection</Text>
        <Text style={styles.statusList}>• No scoring or AI feedback</Text>
        <Text style={styles.statusList}>• No backend or saved history</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onStopSession} style={styles.stopButton}>
        <Text style={styles.stopButtonText}>Stop session</Text>
      </Pressable>
    </ScrollView>
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
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 12,
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
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#0f766e',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  statusMeta: {
    fontSize: 13,
    lineHeight: 20,
    color: '#64748b',
  },
  statusList: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  stopButton: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  stopButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
