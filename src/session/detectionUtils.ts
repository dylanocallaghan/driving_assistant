import { distanceBetweenSamplesMeters } from './distance';
import type { DrivingEvent, DrivingEventCategory, DrivingEventSeverity, DrivingEventSource, DrivingEventType } from './eventModels';
import type { GpsSample, MotionSample } from './models';

export function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

export function dynamicAccelerationFromSample(sample: MotionSample): number {
  const magnitude = Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
  return Math.abs(magnitude - 1);
}

export function getPeakDynamicAcceleration(samples: MotionSample[], startTime: number, endTime: number): number {
  return sliceMotionSamplesByTime(samples, startTime, endTime).reduce((peak, sample) => {
    return Math.max(peak, dynamicAccelerationFromSample(sample));
  }, 0);
}

export function getPeakMotionMagnitude(samples: MotionSample[], startTime: number, endTime: number): number {
  return sliceMotionSamplesByTime(samples, startTime, endTime).reduce((peak, sample) => {
    const magnitude = Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
    return Math.max(peak, magnitude);
  }, 0);
}

export function sliceMotionSamplesByTime(samples: MotionSample[], startTime: number, endTime: number): MotionSample[] {
  return samples.filter((sample) => sample.timestamp >= startTime && sample.timestamp <= endTime);
}

export function findNextGpsSampleIndexWithinWindow(samples: GpsSample[], fromIndex: number, maxWindowMs: number): number | null {
  const fromSample = samples[fromIndex];

  for (let index = fromIndex + 1; index < samples.length; index += 1) {
    const candidate = samples[index];
    if (candidate.timestamp - fromSample.timestamp > maxWindowMs) {
      break;
    }

    if (fromSample.speedMps !== null && candidate.speedMps !== null) {
      return index;
    }
  }

  return null;
}

export function getLargestTimestampGap(samples: Array<{ timestamp: number }>): number {
  let largestGap = 0;

  for (let index = 1; index < samples.length; index += 1) {
    largestGap = Math.max(largestGap, samples[index].timestamp - samples[index - 1].timestamp);
  }

  return largestGap;
}

export function getBearingChangeStats(samples: GpsSample[], startTime: number, endTime: number, minDistanceMeters: number): { totalBearingChange: number; directionChanges: number } {
  const scopedSamples = samples.filter((sample) => sample.timestamp >= startTime && sample.timestamp <= endTime);
  const bearings: number[] = [];

  for (let index = 1; index < scopedSamples.length; index += 1) {
    const previous = scopedSamples[index - 1];
    const current = scopedSamples[index];

    if (distanceBetweenSamplesMeters(previous, current) < minDistanceMeters) {
      continue;
    }

    bearings.push(calculateBearingDegrees(previous, current));
  }

  let totalBearingChange = 0;
  let directionChanges = 0;
  let previousSignedDelta: number | null = null;

  for (let index = 1; index < bearings.length; index += 1) {
    const signedDelta = normalizeBearingDelta(bearings[index] - bearings[index - 1]);
    const absoluteDelta = Math.abs(signedDelta);

    totalBearingChange += absoluteDelta;

    if (previousSignedDelta !== null && Math.sign(previousSignedDelta) !== Math.sign(signedDelta) && absoluteDelta > 0) {
      directionChanges += 1;
    }

    if (absoluteDelta > 0) {
      previousSignedDelta = signedDelta;
    }
  }

  return {
    totalBearingChange,
    directionChanges,
  };
}

export function createDrivingEvent(args: {
  eventId: DrivingEventType;
  sessionId: string;
  category: DrivingEventCategory;
  startTime: number;
  endTime: number;
  severity: DrivingEventSeverity;
  confidence: number;
  source: DrivingEventSource[];
  requiredData: DrivingEventSource[];
  evidence: Record<string, boolean | number | string | null>;
  detectionMethod: string;
  detectorVersion: string;
  scoringEnabled: boolean;
}): DrivingEvent {
  return {
    eventId: args.eventId,
    sessionId: args.sessionId,
    eventType: args.eventId,
    category: args.category,
    startTime: args.startTime,
    endTime: args.endTime,
    severity: args.severity,
    confidence: clampConfidence(args.confidence),
    source: args.source,
    requiredData: args.requiredData,
    evidence: args.evidence,
    detectionMethod: args.detectionMethod,
    detectorVersion: args.detectorVersion,
    status: 'MVP',
    scoringEnabled: args.scoringEnabled,
  };
}

export function sortEvents(events: DrivingEvent[]): DrivingEvent[] {
  return [...events].sort((left, right) => left.startTime - right.startTime || left.eventType.localeCompare(right.eventType));
}

function calculateBearingDegrees(from: GpsSample, to: GpsSample): number {
  const fromLatitude = toRadians(from.latitude);
  const toLatitude = toRadians(to.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);

  const y = Math.sin(longitudeDelta) * Math.cos(toLatitude);
  const x = Math.cos(fromLatitude) * Math.sin(toLatitude) - Math.sin(fromLatitude) * Math.cos(toLatitude) * Math.cos(longitudeDelta);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;

  return (bearing + 360) % 360;
}

function normalizeBearingDelta(delta: number): number {
  if (delta > 180) {
    return delta - 360;
  }

  if (delta < -180) {
    return delta + 360;
  }

  return delta;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}