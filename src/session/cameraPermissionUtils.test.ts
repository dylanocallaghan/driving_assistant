import { describe, expect, it } from 'vitest';

import { deriveCameraPermissionState } from './cameraPermissionUtils';

describe('deriveCameraPermissionState', () => {
  it('returns not-requested when permission is still undetermined', () => {
    const state = deriveCameraPermissionState(
      {
        canAskAgain: true,
        granted: false,
        status: 'undetermined',
      },
      null,
    );

    expect(state.status).toBe('not-requested');
    expect(state.canRequestPermission).toBe(true);
  });

  it('returns granted when permission is granted', () => {
    const state = deriveCameraPermissionState(
      {
        canAskAgain: true,
        granted: true,
        status: 'granted',
      },
      null,
    );

    expect(state.status).toBe('granted');
    expect(state.isGranted).toBe(true);
  });

  it('returns denied-retryable when permission is denied but can be asked again', () => {
    const state = deriveCameraPermissionState(
      {
        canAskAgain: true,
        granted: false,
        status: 'denied',
      },
      null,
    );

    expect(state.status).toBe('denied-retryable');
    expect(state.canRequestPermission).toBe(true);
  });

  it('returns denied-blocked when permission is denied and cannot be asked again', () => {
    const state = deriveCameraPermissionState(
      {
        canAskAgain: false,
        granted: false,
        status: 'denied',
      },
      null,
    );

    expect(state.status).toBe('denied-blocked');
    expect(state.shouldOpenSettings).toBe(true);
  });

  it('returns error when permission lookup fails', () => {
    const state = deriveCameraPermissionState(null, 'boom');

    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('boom');
  });
});