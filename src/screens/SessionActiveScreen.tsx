import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DeveloperTestingPanel } from './DeveloperTestingPanel';
import type { DrivingEventDetectionState } from '../session/eventModels';
import type { DeveloperSimulationScenario } from '../session/eventModels';
import type { ActiveSessionGpsState, ActiveSessionMotionState, MotionRecordingStatus } from '../session/models';
import { formatMotionAxes, formatMotionMagnitude } from '../session/motionUtils';

type SessionActiveScreenProps = {
  eventDetectionState: DrivingEventDetectionState;
  gpsState: ActiveSessionGpsState;
  motionState: ActiveSessionMotionState;
  session: {
    id: string;
    startedAt: string;
  };
  onClearSimulation: () => void;
  onSimulateScenario: (scenario: DeveloperSimulationScenario) => void;
  onStopSession: () => void;
};

export function SessionActiveScreen({ eventDetectionState, gpsState, motionState, session, onClearSimulation, onSimulateScenario, onStopSession }: SessionActiveScreenProps) {
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
  const accelerometerStatusLabel = getMotionStatusLabel(motionState.accelerometer.status);
  const gyroscopeStatusLabel = getMotionStatusLabel(motionState.gyroscope.status);

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Session Active</Text>
        <Text style={styles.title}>Practice session started</Text>
        <Text style={styles.body}>GPS and motion data are recorded locally as raw evidence only. This screen does not interpret data as an RSA fault and does not run scoring.</Text>
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
        <Text style={styles.statusLabel}>Motion sensors</Text>
        <Text style={styles.statusList}>Accelerometer: {accelerometerStatusLabel}</Text>
        <Text style={styles.statusList}>Gyroscope: {gyroscopeStatusLabel}</Text>
        <Text style={styles.statusList}>Accelerometer samples: {motionState.accelerometer.sampleCount}</Text>
        <Text style={styles.statusList}>Gyroscope samples: {motionState.gyroscope.sampleCount}</Text>
        <Text style={styles.statusList}>
          Accelerometer magnitude (latest / peak): {formatMotionMagnitude(motionState.accelerometer.latestMagnitude)} / {motionState.accelerometer.peakMagnitude.toFixed(2)}
        </Text>
        <Text style={styles.statusList}>
          Gyroscope magnitude (latest / peak): {formatMotionMagnitude(motionState.gyroscope.latestMagnitude)} / {motionState.gyroscope.peakMagnitude.toFixed(2)}
        </Text>
        <Text style={styles.statusList}>Accelerometer latest x/y/z: {formatMotionAxes(motionState.accelerometer.latestSample)}</Text>
        <Text style={styles.statusList}>Gyroscope latest x/y/z: {formatMotionAxes(motionState.gyroscope.latestSample)}</Text>
        <Text style={styles.statusMeta}>Raw x/y/z axes are recorded as measured by device orientation and are not vehicle-frame normalized.</Text>
      </View>

      {motionState.accelerometer.errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Accelerometer update</Text>
          <Text style={styles.errorBody}>{motionState.accelerometer.errorMessage}</Text>
        </View>
      ) : null}

      {motionState.gyroscope.errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Gyroscope update</Text>
          <Text style={styles.errorBody}>{motionState.gyroscope.errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Event detection</Text>
        <Text style={styles.statusValue}>{eventDetectionState.status === 'detecting' ? 'Monitoring telemetry' : 'Waiting for session'}</Text>
        <Text style={styles.statusList}>Detected events: {eventDetectionState.eventCount}</Text>
        <Text style={styles.statusList}>Data-quality warnings: {eventDetectionState.warningCount}</Text>
        <Text style={styles.statusList}>Developer simulation: {eventDetectionState.developerSimulationScenario ? 'Active' : 'Off'}</Text>
        <Text style={styles.statusMeta}>Events are IrishDrive telemetry events only. They do not claim an RSA fault, score, or pass/fail outcome.</Text>
      </View>

      {eventDetectionState.events.length > 0 ? (
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Detected events</Text>
          {eventDetectionState.events.map((event, index) => (
            <Text key={`${event.eventType}-${event.startTime}-${index}`} style={styles.statusList}>
              • {event.eventType} ({event.severity}, confidence {event.confidence.toFixed(2)})
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Data quality</Text>
        {eventDetectionState.warnings.length > 0 ? (
          eventDetectionState.warnings.map((warning, index) => (
            <Text key={`${warning.eventType}-${warning.startTime}-${index}`} style={styles.statusList}>
              • {warning.eventType.replaceAll('_', ' ')}
            </Text>
          ))
        ) : (
          <Text style={styles.statusList}>No current telemetry coverage warnings.</Text>
        )}
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.statusLabel}>Current scope</Text>
        <Text style={styles.statusList}>• No camera recording</Text>
        <Text style={styles.statusList}>• No scoring from detected events</Text>
        <Text style={styles.statusList}>• No scoring or AI feedback</Text>
        <Text style={styles.statusList}>• No backend or saved history</Text>
      </View>

      <DeveloperTestingPanel
        eventDetectionState={eventDetectionState}
        onClearSimulation={onClearSimulation}
        onSimulateScenario={onSimulateScenario}
      />

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

function getMotionStatusLabel(status: MotionRecordingStatus): string {
  switch (status) {
    case 'recording':
      return 'Recording';
    case 'unavailable':
      return 'Unavailable on this device';
    case 'error':
      return 'Data unavailable';
    case 'stopped':
      return 'Stopped';
    case 'idle':
    default:
      return 'Waiting to start';
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
