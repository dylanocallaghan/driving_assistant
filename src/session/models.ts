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
