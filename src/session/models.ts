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

export type MotionRecordingStatus = 'idle' | 'recording' | 'unavailable' | 'error' | 'stopped';

export type MotionSample = {
  timestamp: number;
  x: number;
  y: number;
  z: number;
};

export type MotionStreamState = {
  status: MotionRecordingStatus;
  errorMessage: string | null;
  samples: MotionSample[];
  sampleCount: number;
  latestSample: MotionSample | null;
  latestMagnitude: number | null;
  peakMagnitude: number;
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
