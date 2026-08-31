import { useMemo } from 'react';

import { deriveDrivingEventDetectionState } from './eventDetectionState';
import type { DrivingEventDetectionSnapshot } from './eventModels';

export function useDrivingEventDetection(snapshot: DrivingEventDetectionSnapshot) {
  return useMemo(
    () => deriveDrivingEventDetectionState(snapshot),
    [snapshot],
  );
}