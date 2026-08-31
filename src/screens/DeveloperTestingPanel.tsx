import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DrivingEvent, DrivingEventDetectionState, DeveloperSimulationScenario } from '../session/eventModels';
import { getDeveloperSimulationLabel } from '../session/developerSimulation';

type DeveloperTestingPanelProps = {
  eventDetectionState: DrivingEventDetectionState;
  onClearSimulation: () => void;
  onSimulateScenario: (scenario: DeveloperSimulationScenario) => void;
};

const simulationButtons: Array<{ label: string; scenario: DeveloperSimulationScenario }> = [
  { label: 'Simulate hard braking', scenario: 'hard_braking' },
  { label: 'Simulate harsh acceleration', scenario: 'harsh_acceleration' },
  { label: 'Simulate lateral instability', scenario: 'lateral_instability' },
  { label: 'Simulate GPS degradation', scenario: 'gps_quality_degraded' },
  { label: 'Simulate sensor data gap', scenario: 'sensor_data_gap' },
  { label: 'Simulate insufficient session data', scenario: 'session_data_insufficient' },
];

export function DeveloperTestingPanel({ eventDetectionState, onClearSimulation, onSimulateScenario }: DeveloperTestingPanelProps) {
  const simulationLabel = getDeveloperSimulationLabel(eventDetectionState.developerSimulationScenario);
  const isSimulationActive = eventDetectionState.developerSimulationScenario !== null;

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Developer Testing</Text>
      <Text style={styles.body}>Temporary local-only controls to feed synthetic telemetry through the existing Milestone 6 detection pipeline. These controls do not alter live GPS or motion recording.</Text>
      <View style={styles.buttonGrid}>
        {simulationButtons.map((button) => (
          <Pressable
            key={button.scenario}
            accessibilityRole="button"
            onPress={() => onSimulateScenario(button.scenario)}
            style={[
              styles.button,
              eventDetectionState.developerSimulationScenario === button.scenario ? styles.buttonSelected : null,
            ]}
          >
            <Text style={styles.buttonText}>{button.label}</Text>
          </Pressable>
        ))}
        <Pressable accessibilityRole="button" onPress={onClearSimulation} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear simulated test state</Text>
        </Pressable>
      </View>

      {isSimulationActive ? (
        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Simulation active</Text>
          <Text style={styles.noticeBody}>{simulationLabel}</Text>
          <Text style={styles.noticeBody}>Event detection results below are simulated developer outcomes, not real driving events from the current live telemetry session.</Text>
        </View>
      ) : null}

      {isSimulationActive ? (
        <View style={styles.detailsColumn}>
          <Text style={styles.detailsTitle}>Simulated pipeline output</Text>
          {eventDetectionState.events.length === 0 && eventDetectionState.warnings.length === 0 ? (
            <Text style={styles.body}>No simulated events or warnings currently produced by the pipeline.</Text>
          ) : null}
          {eventDetectionState.events.map((event, index) => (
            <DeveloperEventCard key={`${event.eventType}-${event.startTime}-${index}`} event={event} kind="Detected event" />
          ))}
          {eventDetectionState.warnings.map((event, index) => (
            <DeveloperEventCard key={`${event.eventType}-${event.startTime}-${index}`} event={event} kind="Data-quality warning" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

type DeveloperEventCardProps = {
  event: DrivingEvent;
  kind: string;
};

function DeveloperEventCard({ event, kind }: DeveloperEventCardProps) {
  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{kind}</Text>
      <Text style={styles.eventLine}>event_id: {event.eventId}</Text>
      <Text style={styles.eventLine}>event_type: {event.eventType}</Text>
      <Text style={styles.eventLine}>session_id: {event.sessionId}</Text>
      <Text style={styles.eventLine}>category: {event.category}</Text>
      <Text style={styles.eventLine}>start_time: {event.startTime}</Text>
      <Text style={styles.eventLine}>end_time: {event.endTime}</Text>
      <Text style={styles.eventLine}>severity: {event.severity}</Text>
      <Text style={styles.eventLine}>confidence: {event.confidence.toFixed(2)}</Text>
      <Text style={styles.eventLine}>source: {event.source.join(', ')}</Text>
      <Text style={styles.eventLine}>required_data: {event.requiredData.join(', ')}</Text>
      <Text style={styles.eventLine}>detector_version: {event.detectorVersion}</Text>
      <Text style={styles.eventLine}>status: {event.status}</Text>
      <Text style={styles.eventLine}>scoring_enabled: {String(event.scoringEnabled)}</Text>
      <Text style={styles.eventLine}>detection_method: {event.detectionMethod}</Text>
      <Text style={styles.eventLine}>evidence: {JSON.stringify(event.evidence)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#c2410c',
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7c2d12',
  },
  buttonGrid: {
    gap: 10,
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  buttonSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#ffedd5',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9a3412',
  },
  clearButton: {
    backgroundColor: '#7c2d12',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  noticeCard: {
    backgroundColor: '#fff1f2',
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9f1239',
  },
  noticeBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#881337',
  },
  detailsColumn: {
    gap: 10,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7c2d12',
  },
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9a3412',
  },
  eventLine: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7c2d12',
  },
});