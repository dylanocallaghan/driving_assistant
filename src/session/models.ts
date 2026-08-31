export type GpsRecordingStatus =
  | 'idle'
  | 'requesting-permission'
  | 'permission-denied'
  | 'recording'
  | 'stopped'
  | 'error';

export type GpsSample = {
  timestamp: number;
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  speedMps: number | null;
};

export type GpsTelemetrySummary = {
  latestLocation: {
    latitude: number;
    longitude: number;
  } | null;
  validSpeedSampleCount: number;
  invalidSpeedSampleCount: number;
  maxRecordedSpeedMps: number | null;
  averageRecordedSpeedMps: number | null;
  largestSampleGapMs: number;
};

export type MotionRecordingStatus = 'idle' | 'recording' | 'unavailable' | 'error' | 'stopped';

export type MotionSample = {
  timestamp: number;
  x: number;
  y: number;
  z: number;
};

export type MotionTelemetrySummary = {
  averageMagnitude: number | null;
  invalidSampleCount: number;
  largestSampleGapMs: number;
  latestTimestamp: number | null;
  validSampleCount: number;
};

export type MotionStreamState = {
  status: MotionRecordingStatus;
  errorMessage: string | null;
  samples: MotionSample[];
  sampleCount: number;
  invalidSampleCount: number;
  latestSample: MotionSample | null;
  latestMagnitude: number | null;
  peakMagnitude: number;
  telemetrySummary: MotionTelemetrySummary;
};

export type ActiveSessionMotionState = {
  accelerometer: MotionStreamState;
  gyroscope: MotionStreamState;
  startedAtMs: number | null;
};

export type ActiveSessionGpsState = {
  status: GpsRecordingStatus;
  errorMessage: string | null;
  samples: GpsSample[];
  sampleCount: number;
  distanceMeters: number;
  latestSpeedMps: number | null;
  latestAccuracyMeters: number | null;
  elapsedSeconds: number;
  startedAtMs: number | null;
  telemetrySummary: GpsTelemetrySummary;
};

export type StartGpsRecordingResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export type StartMotionRecordingResult = {
  ok: true;
};
