import type { MotionSample } from './models';
import type { MotionTelemetrySummary } from './models';

export const initialMotionTelemetrySummary: MotionTelemetrySummary = {
  averageMagnitude: null,
  invalidSampleCount: 0,
  largestSampleGapMs: 0,
  latestTimestamp: null,
  validSampleCount: 0,
};

export function canStartMotionRecording(
  hasAccelerometerSubscription: boolean,
  hasGyroscopeSubscription: boolean,
): boolean {
  return !hasAccelerometerSubscription && !hasGyroscopeSubscription;
}

export function normalizeMotionAxisValue(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function toMotionSample(reading: { x: number; y: number; z: number }, timestamp: number = Date.now()): MotionSample | null {
  const x = normalizeMotionAxisValue(reading.x);
  const y = normalizeMotionAxisValue(reading.y);
  const z = normalizeMotionAxisValue(reading.z);

  if (x === null || y === null || z === null) {
    return null;
  }

  return {
    timestamp,
    x,
    y,
    z,
  };
}

export function magnitudeFromMotionSample(sample: MotionSample): number {
  return Math.sqrt(sample.x * sample.x + sample.y * sample.y + sample.z * sample.z);
}

export function summarizeMotionSamples(samples: MotionSample[], invalidSampleCount: number): MotionTelemetrySummary {
  if (samples.length === 0) {
    return {
      ...initialMotionTelemetrySummary,
      invalidSampleCount,
    };
  }

  let magnitudeSum = 0;
  let largestSampleGapMs = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const sample = samples[index];
    magnitudeSum += magnitudeFromMotionSample(sample);

    if (index > 0) {
      largestSampleGapMs = Math.max(largestSampleGapMs, sample.timestamp - samples[index - 1].timestamp);
    }
  }

  return {
    averageMagnitude: magnitudeSum / samples.length,
    invalidSampleCount,
    largestSampleGapMs,
    latestTimestamp: samples[samples.length - 1].timestamp,
    validSampleCount: samples.length,
  };
}

export function formatMotionMagnitude(value: number | null): string {
  if (value === null) {
    return 'N/A';
  }

  return value.toFixed(2);
}

export function formatMotionAxes(sample: MotionSample | null): string {
  if (!sample) {
    return 'N/A';
  }

  return `${sample.x.toFixed(2)} / ${sample.y.toFixed(2)} / ${sample.z.toFixed(2)}`;
}