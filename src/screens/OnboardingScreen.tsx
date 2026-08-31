import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type OnboardingScreenProps = {
  isSaving: boolean;
  onComplete: () => Promise<void>;
};

type OnboardingStep = {
  eyebrow: string;
  title: string;
  body: string;
  points: string[];
};

const onboardingSteps: OnboardingStep[] = [
  {
    eyebrow: 'Welcome',
    title: 'IrishDrive AI supports practice, not official testing',
    body:
      'This app is a private coaching product for learner drivers. It does not reproduce RSA scoring and cannot guarantee a test outcome.',
    points: [
      'Use it to build consistent practice habits between lessons.',
      'Scores and assessments will remain proprietary IrishDrive coaching metrics.',
    ],
  },
  {
    eyebrow: 'Permissions',
    title: 'Permissions are requested only when later milestones need them',
    body:
      'Camera, GPS, and motion-sensor permissions are not requested during onboarding. You will see in-context explanations before any future permission prompt.',
    points: [
      'Camera analysis is not implemented in this milestone.',
      'GPS and sensor capture belong to later milestones and are not active yet.',
    ],
  },
  {
    eyebrow: 'Privacy & Safety',
    title: 'Safe use and data minimization come first',
    body:
      'Keep the phone mounted and avoid interacting with it while driving. IrishDrive AI will collect only the data needed for the feature being used.',
    points: [
      'This foundation milestone does not record trips or generate driving scores.',
      'Future data handling must stay aligned with the project documentation and privacy principles.',
    ],
  },
];

export function OnboardingScreen({ isSaving, onComplete }: OnboardingScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = onboardingSteps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === onboardingSteps.length - 1;

  const handleNext = async () => {
    if (!isLastStep) {
      setCurrentStepIndex((step) => step + 1);
      return;
    }

    await onComplete();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>{currentStep.eyebrow}</Text>
        <Text style={styles.title}>{currentStep.title}</Text>
        <Text style={styles.body}>{currentStep.body}</Text>
        <View style={styles.points}>
          {currentStep.points.map((point) => (
            <View key={point} style={styles.pointRow}>
              <View style={styles.pointMarker} />
              <Text style={styles.pointText}>{point}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.progressRow}>
          {onboardingSteps.map((step, index) => (
            <View
              key={step.title}
              style={[styles.progressDot, index === currentStepIndex ? styles.progressDotActive : null]}
            />
          ))}
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            accessibilityRole="button"
            disabled={isFirstStep || isSaving}
            onPress={() => setCurrentStepIndex((step) => Math.max(0, step - 1))}
            style={[styles.secondaryButton, isFirstStep || isSaving ? styles.buttonDisabled : null]}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isSaving}
            onPress={() => {
              void handleNext();
            }}
            style={[styles.primaryButton, isSaving ? styles.buttonDisabled : null]}
          >
            <Text style={styles.primaryButtonText}>{isLastStep ? 'Finish onboarding' : 'Continue'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  content: {
    gap: 14,
  },
  eyebrow: {
    fontSize: 14,
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
  points: {
    gap: 12,
    marginTop: 6,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  pointMarker: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#0f766e',
    marginTop: 8,
  },
  pointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  footer: {
    gap: 16,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
    alignSelf: 'center',
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#cbd5e1',
  },
  progressDotActive: {
    backgroundColor: '#0f766e',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#0f766e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
