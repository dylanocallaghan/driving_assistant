import type { MotionSample } from './models';

export function canStartMotionRecording(
  hasAccelerometerSubscription: boolean,
  hasGyroscopeSubscription: boolean,
): boolean {
  return !hasAccelerometerSubscription && !hasGyroscopeSubscription;
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