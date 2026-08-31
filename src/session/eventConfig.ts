export const DETECTOR_VERSION = 'milestone-6-provisional-v1';

export const PROVISIONAL_EVENT_CONFIG = {
  dataQuality: {
    gpsAccuracyDegradedMeters: 35,
    minGpsSamplesForDetection: 3,
    minAccelerometerSamplesForDetection: 8,
    minGyroscopeSamplesForDetection: 8,
    maxGpsGapMs: 5000,
    maxMotionGapMs: 1000,
  },
  hardBraking: {
    maxWindowMs: 4000,
    minSpeedDeltaMps: 2.5,
    minDynamicAccelerationG: 0.12,
    cooldownMs: 4000,
  },
  harshAcceleration: {
    maxWindowMs: 4000,
    minSpeedDeltaMps: 2.5,
    minDynamicAccelerationG: 0.12,
    cooldownMs: 4000,
  },
  lateralInstability: {
    windowMs: 5000,
    minGyroscopeMagnitude: 0.35,
    minDynamicAccelerationG: 0.08,
    minBearingDeltaDegrees: 35,
    minRepeatedDirectionChanges: 2,
    minGpsSegmentDistanceMeters: 8,
    cooldownMs: 6000,
  },
} as const;