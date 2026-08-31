import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { CameraPermissionState } from '../session/cameraPermissionUtils';

type SessionSetupScreenProps = {
  cameraPermissionState: CameraPermissionState;
  isRefreshingCameraPermission: boolean;
  isStartingSession: boolean;
  onBack: () => void;
  onOpenCameraSettings: () => Promise<void>;
  onRequestCameraPermission: () => Promise<void>;
  onStartSession: () => Promise<void>;
  startErrorMessage: string | null;
};

type CheckKey = 'mounted' | 'stationary' | 'milestoneScope';

type CheckItem = {
  key: CheckKey;
  title: string;
  body: string;
};

const checkItems: CheckItem[] = [
  {
    key: 'mounted',
    title: 'Phone is mounted securely',
    body: 'Place the phone in a secure mount before driving. This setup flow should be completed while the vehicle is stationary.',
  },
  {
    key: 'stationary',
    title: 'I will not use the phone while moving',
    body: 'IrishDrive AI should not encourage interaction during motion. Start the drive only when you can leave the phone untouched.',
  },
  {
    key: 'milestoneScope',
    title: 'I understand GPS recording starts after permission is granted',
    body: 'This milestone records raw GPS plus accelerometer and gyroscope samples only. Camera, scoring, and AI coaching remain disabled.',
  },
];

export function SessionSetupScreen({
  cameraPermissionState,
  isRefreshingCameraPermission,
  isStartingSession,
  onBack,
  onOpenCameraSettings,
  onRequestCameraPermission,
  onStartSession,
  startErrorMessage,
}: SessionSetupScreenProps) {
  const [checks, setChecks] = useState<Record<CheckKey, boolean>>({
    mounted: false,
    stationary: false,
    milestoneScope: false,
  });

  const allChecksCompleted = useMemo(
    () => checkItems.every((checkItem) => checks[checkItem.key]),
    [checks],
  );

  const toggleCheck = (key: CheckKey) => {
    setChecks((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.contentContainer} style={styles.screen}>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Session Setup</Text>
        <Text style={styles.title}>Prepare your practice session</Text>
        <Text style={styles.body}>
          Milestone 4 adds the pre-drive flow and local session lifecycle only. The exact checklist remains TBD in documentation, so this screen covers current safety confirmations without introducing later-milestone permissions or assessment logic.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pre-drive checks</Text>
        <Text style={styles.sectionBody}>Complete each confirmation before starting a practice session.</Text>
      </View>

      <View style={styles.cameraCard}>
        <Text style={styles.cameraTitle}>Camera permission</Text>
        <Text style={styles.cameraBody}>{cameraPermissionState.title}</Text>
        <Text style={styles.cameraMeta}>{cameraPermissionState.body}</Text>
        {cameraPermissionState.errorMessage ? <Text style={styles.cameraError}>{cameraPermissionState.errorMessage}</Text> : null}
        <View style={styles.cameraActionsColumn}>
          {cameraPermissionState.canRequestPermission ? (
            <Pressable
              accessibilityRole="button"
              disabled={isRefreshingCameraPermission || isStartingSession}
              onPress={() => {
                void onRequestCameraPermission();
              }}
              style={[styles.cameraPrimaryButton, isRefreshingCameraPermission || isStartingSession ? styles.buttonDisabled : null]}
            >
              <Text style={styles.cameraPrimaryButtonText}>{isRefreshingCameraPermission ? 'Checking camera permission...' : 'Review camera permission'}</Text>
            </Pressable>
          ) : null}

          {cameraPermissionState.shouldOpenSettings ? (
            <Pressable
              accessibilityRole="button"
              disabled={isStartingSession}
              onPress={() => {
                void onOpenCameraSettings();
              }}
              style={[styles.cameraSecondaryButton, isStartingSession ? styles.buttonDisabled : null]}
            >
              <Text style={styles.cameraSecondaryButtonText}>Open camera settings</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.cardsColumn}>
        {checkItems.map((checkItem) => {
          const isChecked = checks[checkItem.key];

          return (
            <Pressable
              key={checkItem.key}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isChecked }}
              onPress={() => toggleCheck(checkItem.key)}
              style={[styles.checkCard, isChecked ? styles.checkCardSelected : null]}
            >
              <View style={styles.checkRow}>
                <View style={[styles.checkIndicator, isChecked ? styles.checkIndicatorSelected : null]}>
                  {isChecked ? <View style={styles.checkIndicatorDot} /> : null}
                </View>
                <View style={styles.checkCopy}>
                  <Text style={styles.checkTitle}>{checkItem.title}</Text>
                  <Text style={styles.checkBody}>{checkItem.body}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>What this session start does now</Text>
        <Text style={styles.summaryBody}>
          Requests foreground location permission, then starts local GPS, accelerometer, and gyroscope recording with timestamped samples.
        </Text>
        <Text style={styles.summaryBody}>
          Camera permission can be reviewed here for future capabilities. This build still does not record camera input, does not assess faults, and does not send data to backend services.
        </Text>
      </View>

      {startErrorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Unable to start GPS recording</Text>
          <Text style={styles.errorBody}>{startErrorMessage}</Text>
          <Text style={styles.errorBody}>You can retry after enabling location access.</Text>
        </View>
      ) : null}

      <View style={styles.actionsRow}>
        <Pressable accessibilityRole="button" disabled={isStartingSession} onPress={onBack} style={[styles.secondaryButton, isStartingSession ? styles.buttonDisabled : null]}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!allChecksCompleted || isStartingSession}
          onPress={() => {
            void onStartSession();
          }}
          style={[styles.primaryButton, !allChecksCompleted || isStartingSession ? styles.buttonDisabled : null]}
        >
          <Text style={styles.primaryButtonText}>{isStartingSession ? 'Starting session...' : 'Start practice session'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    gap: 18,
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#0f766e',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#334155',
  },
  section: {
    gap: 6,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  cardsColumn: {
    gap: 14,
  },
  cameraCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  cameraTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#9a3412',
  },
  cameraBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#7c2d12',
  },
  cameraMeta: {
    fontSize: 14,
    lineHeight: 21,
    color: '#9a3412',
  },
  cameraError: {
    fontSize: 13,
    lineHeight: 20,
    color: '#991b1b',
  },
  cameraActionsColumn: {
    gap: 10,
    marginTop: 2,
  },
  cameraPrimaryButton: {
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  cameraPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cameraSecondaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  cameraSecondaryButtonText: {
    color: '#9a3412',
    fontSize: 14,
    fontWeight: '700',
  },
  checkCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#dbe4ee',
  },
  checkCardSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIndicator: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#ffffff',
  },
  checkIndicatorSelected: {
    borderColor: '#0f766e',
  },
  checkIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#0f766e',
  },
  checkCopy: {
    flex: 1,
    gap: 4,
  },
  checkTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  checkBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
  },
  summaryCard: {
    backgroundColor: '#ecfeff',
    borderRadius: 20,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#a5f3fc',
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#155e75',
  },
  summaryBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#164e63',
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 20,
    padding: 18,
    gap: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#991b1b',
  },
  errorBody: {
    fontSize: 14,
    lineHeight: 21,
    color: '#7f1d1d',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
