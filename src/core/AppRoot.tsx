import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { HomeScreen } from '../screens/HomeScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { SessionActiveScreen } from '../screens/SessionActiveScreen';
import { SessionSetupScreen } from '../screens/SessionSetupScreen';
import { getOnboardingCompleted, setOnboardingCompleted } from '../storage/onboardingStorage';
import { ErrorBoundary } from './ErrorBoundary';

type AppScreen = 'home' | 'session-setup' | 'session-active';

type LocalDrivingSession = {
  id: string;
  startedAt: string;
};

export function AppRoot() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [activeSession, setActiveSession] = useState<LocalDrivingSession | null>(null);

  const loadOnboardingState = async () => {
    setHasError(false);
    setIsLoading(true);

    try {
      const completed = await getOnboardingCompleted();
      setHasCompletedOnboarding(completed);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOnboardingState();
  }, []);

  const handleCompleteOnboarding = async () => {
    setIsSaving(true);

    try {
      await setOnboardingCompleted(true);
      setHasCompletedOnboarding(true);
    } catch {
      setHasError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenSessionSetup = () => {
    setCurrentScreen('session-setup');
  };

  const handleCancelSessionSetup = () => {
    setCurrentScreen('home');
  };

  const handleStartSession = () => {
    const session: LocalDrivingSession = {
      id: `session-${Date.now()}`,
      startedAt: new Date().toISOString(),
    };

    setActiveSession(session);
    setCurrentScreen('session-active');
  };

  const handleStopSession = () => {
    setActiveSession(null);
    setCurrentScreen('home');
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        {isLoading ? <LoadingScreen /> : null}
        {!isLoading && hasError ? <OnboardingErrorScreen onRetry={loadOnboardingState} /> : null}
        {!isLoading && !hasError && !hasCompletedOnboarding ? (
          <OnboardingScreen isSaving={isSaving} onComplete={handleCompleteOnboarding} />
        ) : null}
        {!isLoading && !hasError && hasCompletedOnboarding && currentScreen === 'home' ? (
          <HomeScreen onStartSession={handleOpenSessionSetup} />
        ) : null}
        {!isLoading && !hasError && hasCompletedOnboarding && currentScreen === 'session-setup' ? (
          <SessionSetupScreen onBack={handleCancelSessionSetup} onStartSession={handleStartSession} />
        ) : null}
        {!isLoading && !hasError && hasCompletedOnboarding && currentScreen === 'session-active' && activeSession ? (
          <SessionActiveScreen session={activeSession} onStopSession={handleStopSession} />
        ) : null}
        <StatusBar style="dark" />
      </SafeAreaView>
    </ErrorBoundary>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.centeredContainer}>
      <ActivityIndicator color="#0f766e" size="large" />
      <Text style={styles.loadingText}>Preparing IrishDrive AI...</Text>
    </View>
  );
}

type OnboardingErrorScreenProps = {
  onRetry: () => void;
};

function OnboardingErrorScreen({ onRetry }: OnboardingErrorScreenProps) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.errorTitle}>Unable to load onboarding</Text>
      <Text style={styles.errorBody}>Please try again. No driving or scoring features have been started.</Text>
      <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 15,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 360,
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: '#0f766e',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
