import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { ActiveSessionGpsState } from '../session/models';

type SessionActiveScreenProps = {
  gpsState: ActiveSessionGpsState;
  session: {
    id: string;
    startedAt: string;
  };
  onStopSession: () => void;
};

export function SessionActiveScreen({ gpsState, session, onStopSession }: SessionActiveScreenProps) {
  const startedAt = new Date(session.startedAt);
  const startedAtLabel = Number.isNaN(startedAt.getTime())
    ? 'Session active'
    : startedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const durationMinutes = Math.floor(gpsState.elapsedSeconds / 60);
  const durationSeconds = gpsState.elapsedSeconds % 60;
  const durationLabel = `${durationMinutes.toString().padStart(2, '0')}:${durationSeconds
    .toString()
    .padStart(2, '0')}`;

  const distanceKilometers = gpsState.distanceMeters / 1000;
  const distanceLabel = distanceKilometers >= 1 ? `${distanceKilometers.toFixed(2)} km` : `${gpsState.distanceMeters.toFixed(0)} m`;

  const speedLabel =
    gpsState.latestSpeedMps === null
      ? 'GPS speed unavailable'
      : `${(gpsState.latestSpeedMps * 3.6).toFixed(1)} km/h`;

  const accuracyLabel =
    gpsState.latestAccuracyMeters === null
      ? 'GPS data unavailable'
      : `${gpsState.latestAccuracyMeters.toFixed(0)} m`;

  const accuracyQuality =
    gpsState.latestAccuracyMeters === null
      ? 'Insufficient GPS evidence'
      : gpsState.latestAccuracyMeters > 50
        ? 'Poor GPS accuracy'
        : 'GPS accuracy acceptable';

  const gpsStatusLabel = getGpsStatusLabel(gpsState.status);

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Session Active</Text>
        <Text style={styles.title}>Practice session started</Text>
        <Text style={styles.body}>GPS is recorded locally as raw evidence only. This screen does not interpret GPS as an RSA fault and does not run scoring.</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Started at</Text>
        <Text style={styles.statusValue}>{startedAtLabel}</Text>
        <Text style={styles.statusMeta}>Session reference: {session.id}</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>GPS status</Text>
        <Text style={styles.statusValue}>{gpsStatusLabel}</Text>
        <Text style={styles.statusList}>Session duration: {durationLabel}</Text>
        <Text style={styles.statusList}>Distance travelled: {distanceLabel}</Text>
        <Text style={styles.statusList}>GPS speed recorded: {speedLabel}</Text>
        <Text style={styles.statusList}>GPS accuracy: {accuracyLabel}</Text>
        <Text style={styles.statusList}>Accuracy quality: {accuracyQuality}</Text>
        <Text style={styles.statusList}>GPS sample count: {gpsState.sampleCount}</Text>
      </View>

      {gpsState.errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>GPS recording update</Text>
          <Text style={styles.errorBody}>{gpsState.errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current scope</Text>
        <Text style={styles.statusList}>• No camera recording</Text>
        <Text style={styles.statusList}>• No accelerometer or gyroscope capture</Text>
        <Text style={styles.statusList}>• No scoring or AI feedback</Text>
        <Text style={styles.statusList}>• No backend or saved history</Text>
      </View>

      <Pressable accessibilityRole="button" onPress={onStopSession} style={styles.stopButton}>
        <Text style={styles.stopButtonText}>Stop session</Text>
      </Pressable>
    </ScrollView>
  );
}

function getGpsStatusLabel(status: ActiveSessionGpsState['status']): string {
  switch (status) {
    case 'recording':
      return 'GPS: Recording';
    case 'requesting-permission':
      return 'GPS: Requesting permission';
    case 'permission-denied':
      return 'GPS: Permission denied';
    case 'error':
      return 'GPS: Data unavailable';
    case 'stopped':
      return 'GPS: Stopped';
    case 'idle':
    default:
      return 'GPS: Waiting to start';
  }
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
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7f1d1d',
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
