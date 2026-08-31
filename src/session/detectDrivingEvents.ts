import { DETECTOR_VERSION, PROVISIONAL_EVENT_CONFIG } from './eventConfig';
import {
  createDrivingEvent,
  getBearingChangeStats,
  getLargestTimestampGap,
  getPeakDynamicAcceleration,
  getPeakMotionMagnitude,
  sortEvents,
} from './detectionUtils';
import type { DetectDrivingEventsInput, DetectDrivingEventsResult, DrivingEvent, DrivingEventSeverity } from './eventModels';

export function detectDrivingEvents({ sessionId, gpsState, motionState }: DetectDrivingEventsInput): DetectDrivingEventsResult {
  const warnings = detectDataQualityWarnings({ sessionId, gpsState, motionState });

  const primaryEvents = sortEvents([
    ...detectHardBraking({ sessionId, gpsState, motionState }),
    ...detectHarshAcceleration({ sessionId, gpsState, motionState }),
    ...detectLateralInstability({ sessionId, gpsState, motionState }),
  ]);

  return {
    events: primaryEvents,
    warnings: sortEvents(warnings),
  };
}

function detectDataQualityWarnings({ sessionId, gpsState, motionState }: DetectDrivingEventsInput): DrivingEvent[] {
  const warnings: DrivingEvent[] = [];

  if (
    gpsState.sampleCount < PROVISIONAL_EVENT_CONFIG.dataQuality.minGpsSamplesForDetection ||
    motionState.accelerometer.sampleCount < PROVISIONAL_EVENT_CONFIG.dataQuality.minAccelerometerSamplesForDetection ||
    motionState.gyroscope.sampleCount < PROVISIONAL_EVENT_CONFIG.dataQuality.minGyroscopeSamplesForDetection
  ) {
    warnings.push(
      createDrivingEvent({
        eventId: 'session_data_insufficient',
        sessionId,
        category: 'Assessment Coverage',
        startTime: gpsState.startedAtMs ?? motionState.startedAtMs ?? Date.now(),
        endTime: Date.now(),
        severity: 'informational',
        confidence: 1,
        source: ['gps', 'accelerometer', 'gyroscope'],
        requiredData: ['gps', 'accelerometer', 'gyroscope'],
        evidence: {
          gpsSampleCount: gpsState.sampleCount,
          accelerometerSampleCount: motionState.accelerometer.sampleCount,
          gyroscopeSampleCount: motionState.gyroscope.sampleCount,
        },
        detectionMethod: 'coverage checks over current in-memory telemetry',
        detectorVersion: DETECTOR_VERSION,
        scoringEnabled: false,
      }),
    );
  }

  if (
    gpsState.latestAccuracyMeters !== null &&
    gpsState.latestAccuracyMeters > PROVISIONAL_EVENT_CONFIG.dataQuality.gpsAccuracyDegradedMeters
  ) {
    const latestGpsSample = gpsState.samples[gpsState.samples.length - 1];

    warnings.push(
      createDrivingEvent({
        eventId: 'gps_quality_degraded',
        sessionId,
        category: 'Assessment Coverage',
        startTime: latestGpsSample?.timestamp ?? Date.now(),
        endTime: latestGpsSample?.timestamp ?? Date.now(),
        severity: 'informational',
        confidence: 1,
        source: ['gps'],
        requiredData: ['gps'],
        evidence: {
          latestAccuracyMeters: gpsState.latestAccuracyMeters,
          provisionalMaxAccuracyMeters: PROVISIONAL_EVENT_CONFIG.dataQuality.gpsAccuracyDegradedMeters,
        },
        detectionMethod: 'current GPS accuracy threshold check',
        detectorVersion: DETECTOR_VERSION,
        scoringEnabled: false,
      }),
    );
  }

  const largestGpsGapMs = getLargestTimestampGap(gpsState.samples);
  const largestAccelerometerGapMs = getLargestTimestampGap(motionState.accelerometer.samples);
  const largestGyroscopeGapMs = getLargestTimestampGap(motionState.gyroscope.samples);

  if (
    largestGpsGapMs > PROVISIONAL_EVENT_CONFIG.dataQuality.maxGpsGapMs ||
    largestAccelerometerGapMs > PROVISIONAL_EVENT_CONFIG.dataQuality.maxMotionGapMs ||
    largestGyroscopeGapMs > PROVISIONAL_EVENT_CONFIG.dataQuality.maxMotionGapMs
  ) {
    const lastTimestamp = Math.max(
      gpsState.samples[gpsState.samples.length - 1]?.timestamp ?? 0,
      motionState.accelerometer.samples[motionState.accelerometer.samples.length - 1]?.timestamp ?? 0,
      motionState.gyroscope.samples[motionState.gyroscope.samples.length - 1]?.timestamp ?? 0,
      Date.now(),
    );

    warnings.push(
      createDrivingEvent({
        eventId: 'sensor_data_gap',
        sessionId,
        category: 'Assessment Coverage',
        startTime: lastTimestamp,
        endTime: lastTimestamp,
        severity: 'informational',
        confidence: 1,
        source: ['gps', 'accelerometer', 'gyroscope'],
        requiredData: ['gps', 'accelerometer', 'gyroscope'],
        evidence: {
          largestGpsGapMs,
          largestAccelerometerGapMs,
          largestGyroscopeGapMs,
          provisionalMaxGpsGapMs: PROVISIONAL_EVENT_CONFIG.dataQuality.maxGpsGapMs,
          provisionalMaxMotionGapMs: PROVISIONAL_EVENT_CONFIG.dataQuality.maxMotionGapMs,
        },
        detectionMethod: 'timestamp gap detection across telemetry streams',
        detectorVersion: DETECTOR_VERSION,
        scoringEnabled: false,
      }),
    );
  }

  return warnings;
}

function detectHardBraking({ sessionId, gpsState, motionState }: DetectDrivingEventsInput): DrivingEvent[] {
  const events: DrivingEvent[] = [];
  const samples = gpsState.samples;

  let nextAllowedStartTime = 0;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const startSample = samples[index];

    if (startSample.timestamp < nextAllowedStartTime || startSample.speedMps === null) {
      continue;
    }

    for (let candidateIndex = index + 1; candidateIndex < samples.length; candidateIndex += 1) {
      const endSample = samples[candidateIndex];
      const elapsedMs = endSample.timestamp - startSample.timestamp;

      if (elapsedMs > PROVISIONAL_EVENT_CONFIG.hardBraking.maxWindowMs) {
        break;
      }

      if (endSample.speedMps === null) {
        continue;
      }

      const speedDeltaMps = startSample.speedMps - endSample.speedMps;
      const peakDynamicAccelerationG = getPeakDynamicAcceleration(
        motionState.accelerometer.samples,
        startSample.timestamp,
        endSample.timestamp,
      );

      if (
        speedDeltaMps >= PROVISIONAL_EVENT_CONFIG.hardBraking.minSpeedDeltaMps &&
        peakDynamicAccelerationG >= PROVISIONAL_EVENT_CONFIG.hardBraking.minDynamicAccelerationG
      ) {
        const ratio = Math.min(
          speedDeltaMps / PROVISIONAL_EVENT_CONFIG.hardBraking.minSpeedDeltaMps,
          peakDynamicAccelerationG / PROVISIONAL_EVENT_CONFIG.hardBraking.minDynamicAccelerationG,
        );

        events.push(
          createDrivingEvent({
            eventId: 'hard_braking',
            sessionId,
            category: 'Vehicle Control',
            startTime: startSample.timestamp,
            endTime: endSample.timestamp,
            severity: severityFromRatio(ratio),
            confidence: 0.7 + Math.min(0.25, (ratio - 1) * 0.1),
            source: ['gps', 'accelerometer'],
            requiredData: ['gps', 'accelerometer'],
            evidence: {
              speedDropMps: Number(speedDeltaMps.toFixed(2)),
              peakDynamicAccelerationG: Number(peakDynamicAccelerationG.toFixed(3)),
              windowMs: elapsedMs,
              provisionalSpeedDeltaThresholdMps: PROVISIONAL_EVENT_CONFIG.hardBraking.minSpeedDeltaMps,
              provisionalDynamicAccelerationThresholdG: PROVISIONAL_EVENT_CONFIG.hardBraking.minDynamicAccelerationG,
            },
            detectionMethod: 'GPS speed drop corroborated by accelerometer magnitude change',
            detectorVersion: DETECTOR_VERSION,
            scoringEnabled: false,
          }),
        );

        nextAllowedStartTime = endSample.timestamp + PROVISIONAL_EVENT_CONFIG.hardBraking.cooldownMs;
        break;
      }
    }
  }

  return events;
}

function detectHarshAcceleration({ sessionId, gpsState, motionState }: DetectDrivingEventsInput): DrivingEvent[] {
  const events: DrivingEvent[] = [];
  const samples = gpsState.samples;

  let nextAllowedStartTime = 0;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const startSample = samples[index];

    if (startSample.timestamp < nextAllowedStartTime || startSample.speedMps === null) {
      continue;
    }

    for (let candidateIndex = index + 1; candidateIndex < samples.length; candidateIndex += 1) {
      const endSample = samples[candidateIndex];
      const elapsedMs = endSample.timestamp - startSample.timestamp;

      if (elapsedMs > PROVISIONAL_EVENT_CONFIG.harshAcceleration.maxWindowMs) {
        break;
      }

      if (endSample.speedMps === null) {
        continue;
      }

      const speedDeltaMps = endSample.speedMps - startSample.speedMps;
      const peakDynamicAccelerationG = getPeakDynamicAcceleration(
        motionState.accelerometer.samples,
        startSample.timestamp,
        endSample.timestamp,
      );

      if (
        speedDeltaMps >= PROVISIONAL_EVENT_CONFIG.harshAcceleration.minSpeedDeltaMps &&
        peakDynamicAccelerationG >= PROVISIONAL_EVENT_CONFIG.harshAcceleration.minDynamicAccelerationG
      ) {
        const ratio = Math.min(
          speedDeltaMps / PROVISIONAL_EVENT_CONFIG.harshAcceleration.minSpeedDeltaMps,
          peakDynamicAccelerationG / PROVISIONAL_EVENT_CONFIG.harshAcceleration.minDynamicAccelerationG,
        );

        events.push(
          createDrivingEvent({
            eventId: 'harsh_acceleration',
            sessionId,
            category: 'Vehicle Control',
            startTime: startSample.timestamp,
            endTime: endSample.timestamp,
            severity: severityFromRatio(ratio),
            confidence: 0.7 + Math.min(0.25, (ratio - 1) * 0.1),
            source: ['gps', 'accelerometer'],
            requiredData: ['gps', 'accelerometer'],
            evidence: {
              speedIncreaseMps: Number(speedDeltaMps.toFixed(2)),
              peakDynamicAccelerationG: Number(peakDynamicAccelerationG.toFixed(3)),
              windowMs: elapsedMs,
              provisionalSpeedDeltaThresholdMps: PROVISIONAL_EVENT_CONFIG.harshAcceleration.minSpeedDeltaMps,
              provisionalDynamicAccelerationThresholdG: PROVISIONAL_EVENT_CONFIG.harshAcceleration.minDynamicAccelerationG,
            },
            detectionMethod: 'GPS speed increase corroborated by accelerometer magnitude change',
            detectorVersion: DETECTOR_VERSION,
            scoringEnabled: false,
          }),
        );

        nextAllowedStartTime = endSample.timestamp + PROVISIONAL_EVENT_CONFIG.harshAcceleration.cooldownMs;
        break;
      }
    }
  }

  return events;
}

function detectLateralInstability({ sessionId, gpsState, motionState }: DetectDrivingEventsInput): DrivingEvent[] {
  const events: DrivingEvent[] = [];
  const samples = gpsState.samples;

  let nextAllowedStartTime = 0;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const startSample = samples[index];

    if (startSample.timestamp < nextAllowedStartTime) {
      continue;
    }

    const windowEndTime = startSample.timestamp + PROVISIONAL_EVENT_CONFIG.lateralInstability.windowMs;
    const windowEndSample = samples.find((sample) => sample.timestamp >= windowEndTime);

    if (!windowEndSample) {
      continue;
    }

    const peakGyroscopeMagnitude = getPeakMotionMagnitude(
      motionState.gyroscope.samples,
      startSample.timestamp,
      windowEndSample.timestamp,
    );
    const peakDynamicAccelerationG = getPeakDynamicAcceleration(
      motionState.accelerometer.samples,
      startSample.timestamp,
      windowEndSample.timestamp,
    );
    const { totalBearingChange, directionChanges } = getBearingChangeStats(
      samples,
      startSample.timestamp,
      windowEndSample.timestamp,
      PROVISIONAL_EVENT_CONFIG.lateralInstability.minGpsSegmentDistanceMeters,
    );

    if (
      peakGyroscopeMagnitude >= PROVISIONAL_EVENT_CONFIG.lateralInstability.minGyroscopeMagnitude &&
      peakDynamicAccelerationG >= PROVISIONAL_EVENT_CONFIG.lateralInstability.minDynamicAccelerationG &&
      totalBearingChange >= PROVISIONAL_EVENT_CONFIG.lateralInstability.minBearingDeltaDegrees &&
      directionChanges >= PROVISIONAL_EVENT_CONFIG.lateralInstability.minRepeatedDirectionChanges
    ) {
      const ratio = Math.min(
        peakGyroscopeMagnitude / PROVISIONAL_EVENT_CONFIG.lateralInstability.minGyroscopeMagnitude,
        peakDynamicAccelerationG / PROVISIONAL_EVENT_CONFIG.lateralInstability.minDynamicAccelerationG,
        totalBearingChange / PROVISIONAL_EVENT_CONFIG.lateralInstability.minBearingDeltaDegrees,
      );

      events.push(
        createDrivingEvent({
          eventId: 'lateral_instability',
          sessionId,
          category: 'Vehicle Stability',
          startTime: startSample.timestamp,
          endTime: windowEndSample.timestamp,
          severity: severityFromRatio(ratio),
          confidence: 0.55 + Math.min(0.2, (ratio - 1) * 0.08),
          source: ['gps', 'accelerometer', 'gyroscope'],
          requiredData: ['gps', 'accelerometer', 'gyroscope'],
          evidence: {
            peakGyroscopeMagnitude: Number(peakGyroscopeMagnitude.toFixed(3)),
            peakDynamicAccelerationG: Number(peakDynamicAccelerationG.toFixed(3)),
            totalBearingChangeDegrees: Number(totalBearingChange.toFixed(2)),
            directionChanges,
            provisionalGyroscopeThreshold: PROVISIONAL_EVENT_CONFIG.lateralInstability.minGyroscopeMagnitude,
            provisionalDynamicAccelerationThresholdG: PROVISIONAL_EVENT_CONFIG.lateralInstability.minDynamicAccelerationG,
            provisionalBearingChangeThresholdDegrees: PROVISIONAL_EVENT_CONFIG.lateralInstability.minBearingDeltaDegrees,
          },
          detectionMethod: 'gyroscope magnitude, accelerometer dynamics, and GPS trajectory change analysis',
          detectorVersion: DETECTOR_VERSION,
          scoringEnabled: false,
        }),
      );

      nextAllowedStartTime = windowEndSample.timestamp + PROVISIONAL_EVENT_CONFIG.lateralInstability.cooldownMs;
    }
  }

  return events;
}

function severityFromRatio(ratio: number): DrivingEventSeverity {
  if (ratio >= 1.8) {
    return 'severe';
  }

  if (ratio >= 1.4) {
    return 'moderate';
  }

  return 'minor';
}