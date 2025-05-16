import { useState } from 'react';

import { TournamentType } from '../types/supabase';

interface ScoreData {
  hole_number: number;
  strokes: number;
  drive_player_id: string;
  mulligan_player_id?: string | null;
}

interface ScoreSubmissionParams {
  team_id: string;
  tournament_type: TournamentType;
  scores: ScoreData[];
}

interface SingleScoreSubmissionParams {
  team_id: string;
  tournament_type: TournamentType;
  hole_number: number;
  strokes: number;
  drive_player_id: string;
  mulligan_player_id?: string | null;
}

interface SubmissionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Hook for submitting scores to the API
 */
export function useScoreSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pendingSubmissions, setPendingSubmissions] = useState<
    Record<string, boolean>
  >({});

  /**
   * Submit multiple scores at once
   */
  const submitScores = async (
    params: ScoreSubmissionParams,
  ): Promise<SubmissionResponse> => {
    // Prevent duplicate submissions
    if (isSubmitting) {
      return { success: false, error: 'Submission already in progress' };
    }

    setIsSubmitting(true);
    setError(null);
    // Don't reset success state immediately to avoid UI flicker

    try {
      const response = await fetch('/api/scores/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Failed to submit scores';
        setError(errorMessage);
        setIsSuccess(false);
        return { success: false, error: errorMessage };
      }

      setIsSuccess(true);
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsSuccess(false);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Submit a single score with real-time updates
   */
  const submitSingleScore = async (
    params: SingleScoreSubmissionParams,
  ): Promise<SubmissionResponse> => {
    // Create a unique key for this submission to track it
    const submissionKey = `${params.team_id}-${params.hole_number}`;

    // Check if this exact submission is already in progress
    if (pendingSubmissions[submissionKey]) {
      return { success: false, error: 'This score is already being saved' };
    }

    setIsSubmitting(true);
    setPendingSubmissions((prev) => ({ ...prev, [submissionKey]: true }));

    // Clear any previous errors but don't reset success state
    if (error) setError(null);

    try {
      const response = await fetch('/api/scores/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || 'Failed to submit score';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Show success state but don't clear it right away
      setIsSuccess(true);

      // Set a timeout to clear success state after 3 seconds
      // This prevents flicker while still providing feedback
      if (!isSuccess) {
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }

      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      // Update submission states
      setIsSubmitting(false);
      setPendingSubmissions((prev) => {
        const updated = { ...prev };
        delete updated[submissionKey];
        return updated;
      });
    }
  };

  return {
    submitScores,
    submitSingleScore,
    isSubmitting,
    error,
    isSuccess,
    clearError: () => setError(null),
    resetSuccess: () => setIsSuccess(false),
  };
}
