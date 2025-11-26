import { useState, useEffect } from "react";
import Joyride, { Step, CallBackProps, STATUS } from "react-joyride";

const ONBOARDING_KEY = "predicthub_onboarding_complete";

interface OnboardingTutorialProps {
  run: boolean;
  onComplete: () => void;
}

const steps: Step[] = [
  {
    target: '[data-testid="button-wallet-connect"]',
    content: "Step 1: Connect your BNB wallet to get started and participate in prediction markets.",
    disableBeacon: true,
    placement: "bottom",
  },
  {
    target: '[data-testid="button-hero-ai-create"]',
    content: "Step 2: Enter any idea — AI turns it into a prediction market in seconds!",
    placement: "bottom",
  },
  {
    target: '[href="/leaderboard"]',
    content: "Step 3: Earn PredictPoints by winning predictions and climb the leaderboard!",
    placement: "bottom",
  },
];

export default function OnboardingTutorial({ run, onComplete }: OnboardingTutorialProps) {
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "#10b981",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
        },
        buttonNext: {
          backgroundColor: "#10b981",
          borderRadius: 6,
        },
        buttonBack: {
          color: "#6b7280",
        },
      }}
    />
  );
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem(ONBOARDING_KEY);
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_KEY);
}
