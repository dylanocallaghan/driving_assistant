import { useCallback, useEffect, useRef, useState } from 'react';
import { Accelerometer, Gyroscope } from 'expo-sensors';

import type {
  ActiveSessionMotionState,
  MotionStreamState,
  StartMotionRecordingResult,
} from './models';
import {
  canStartMotionRecording,
  initialMotionTelemetrySummary,
  magnitudeFromMotionSample,
  summarizeMotionSamples,
  toMotionSample,
} from './motionUtils';

const MOTION_UPDATE_INTERVAL_MS = 250;

const initialStreamState: MotionStreamState = {
  status: 'idle',
  errorMessage: null,
  samples: [],
  sampleCount: 0,
  invalidSampleCount: 0,
  latestSample: null,
  latestMagnitude: null,
  peakMagnitude: 0,
  telemetrySummary: initialMotionTelemetrySummary,
};

const initialMotionState: ActiveSessionMotionState = {
  accelerometer: initialStreamState,
  gyroscope: initialStreamState,
  startedAtMs: null,
};

type SensorSubscription = ReturnType<typeof Accelerometer.addListener>;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Motion sensor data unavailable.';
}

export function useMotionSessionRecorder() {
  const [motionState, setMotionState] = useState<ActiveSessionMotionState>(initialMotionState);

  const accelerometerSubscriptionRef = useRef<SensorSubscription | null>(null);
  const gyroscopeSubscriptionRef = useRef<SensorSubscription | null>(null);

  const clearSubscriptions = useCallback(() => {
    if (accelerometerSubscriptionRef.current) {
      accelerometerSubscriptionRef.current.remove();
      accelerometerSubscriptionRef.current = null;
    }

    if (gyroscopeSubscriptionRef.current) {
      gyroscopeSubscriptionRef.current.remove();
      gyroscopeSubscriptionRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(() => {
    clearSubscriptions();

    setMotionState((previousState) => ({
      ...previousState,
      startedAtMs: previousState.startedAtMs,
      accelerometer: {
        ...previousState.accelerometer,
        status: previousState.accelerometer.status === 'recording' ? 'stopped' : previousState.accelerometer.status,
      },
      gyroscope: {
        ...previousState.gyroscope,
        status: previousState.gyroscope.status === 'recording' ? 'stopped' : previousState.gyroscope.status,
      },
    }));
  }, [clearSubscriptions]);

  const startRecording = useCallback(async (): Promise<StartMotionRecordingResult> => {
    if (
      !canStartMotionRecording(
        accelerometerSubscriptionRef.current !== null,
        gyroscopeSubscriptionRef.current !== null,
      )
    ) {
      return { ok: true };
    }

    const startedAtMs = Date.now();

    setMotionState({
      accelerometer: {
        ...initialStreamState,
        status: 'recording',
      },
      gyroscope: {
        ...initialStreamState,
        status: 'recording',
      },
      startedAtMs,
    });

    Accelerometer.setUpdateInterval(MOTION_UPDATE_INTERVAL_MS);
    Gyroscope.setUpdateInterval(MOTION_UPDATE_INTERVAL_MS);

    try {
      const accelerometerAvailable = await Accelerometer.isAvailableAsync();

      if (!accelerometerAvailable) {
        setMotionState((previousState) => ({
          ...previousState,
          accelerometer: {
            ...previousState.accelerometer,
            status: 'unavailable',
            errorMessage: 'Accelerometer unavailable on this device.',
          },
        }));
      } else {
        accelerometerSubscriptionRef.current = Accelerometer.addListener((reading) => {
          const sample = toMotionSample(reading);

          setMotionState((previousState) => {
            if (!sample) {
              const invalidSampleCount = previousState.accelerometer.invalidSampleCount + 1;

              return {
                ...previousState,
                accelerometer: {
                  ...previousState.accelerometer,
                  status: 'recording',
                  errorMessage: null,
                  invalidSampleCount,
                  telemetrySummary: summarizeMotionSamples(previousState.accelerometer.samples, invalidSampleCount),
                },
              };
            }

            const nextSamples = [...previousState.accelerometer.samples, sample];
            const magnitude = magnitudeFromMotionSample(sample);

            return {
              ...previousState,
              accelerometer: {
                ...previousState.accelerometer,
                status: 'recording',
                errorMessage: null,
                samples: nextSamples,
                sampleCount: nextSamples.length,
                latestSample: sample,
                latestMagnitude: magnitude,
                peakMagnitude: Math.max(previousState.accelerometer.peakMagnitude, magnitude),
                telemetrySummary: summarizeMotionSamples(nextSamples, previousState.accelerometer.invalidSampleCount),
              },
            };
          });
        });
      }
    } catch (error) {
      setMotionState((previousState) => ({
        ...previousState,
        accelerometer: {
          ...previousState.accelerometer,
          status: 'error',
          errorMessage: `Accelerometer error: ${toErrorMessage(error)}`,
        },
      }));
    }

    try {
      const gyroscopeAvailable = await Gyroscope.isAvailableAsync();

      if (!gyroscopeAvailable) {
        setMotionState((previousState) => ({
          ...previousState,
          gyroscope: {
            ...previousState.gyroscope,
            status: 'unavailable',
            errorMessage: 'Gyroscope unavailable on this device.',
          },
        }));
      } else {
        gyroscopeSubscriptionRef.current = Gyroscope.addListener((reading) => {
          const sample = toMotionSample(reading);

          setMotionState((previousState) => {
            if (!sample) {
              const invalidSampleCount = previousState.gyroscope.invalidSampleCount + 1;

              return {
                ...previousState,
                gyroscope: {
                  ...previousState.gyroscope,
                  status: 'recording',
                  errorMessage: null,
                  invalidSampleCount,
                  telemetrySummary: summarizeMotionSamples(previousState.gyroscope.samples, invalidSampleCount),
                },
              };
            }

            const nextSamples = [...previousState.gyroscope.samples, sample];
            const magnitude = magnitudeFromMotionSample(sample);

            return {
              ...previousState,
              gyroscope: {
                ...previousState.gyroscope,
                status: 'recording',
                errorMessage: null,
                samples: nextSamples,
                sampleCount: nextSamples.length,
                latestSample: sample,
                latestMagnitude: magnitude,
                peakMagnitude: Math.max(previousState.gyroscope.peakMagnitude, magnitude),
                telemetrySummary: summarizeMotionSamples(nextSamples, previousState.gyroscope.invalidSampleCount),
              },
            };
          });
        });
      }
    } catch (error) {
      setMotionState((previousState) => ({
        ...previousState,
        gyroscope: {
          ...previousState.gyroscope,
          status: 'error',
          errorMessage: `Gyroscope error: ${toErrorMessage(error)}`,
        },
      }));
    }

    return { ok: true };
  }, []);

  useEffect(() => {
    return () => {
      clearSubscriptions();
    };
  }, [clearSubscriptions]);

  return {
    motionState,
    startRecording,
    stopRecording,
  };
}
