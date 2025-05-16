import { NextApiRequest, NextApiResponse } from 'next';

import {
  submitPublicScore,
  submitPublicScores,
} from '../../../lib/supabaseQueries';
import { TournamentType } from '../../../types/supabase';

/**
 * API handler for score submissions.
 *
 * POST /api/scores/submit
 * Request body:
 * {
 *   team_id: string,
 *   tournament_type: "2-man" | "4-man",
 *   scores: [
 *     {
 *       hole_number: number,
 *       strokes: number,
 *       drive_player_id: string,
 *       mulligan_player_id?: string | null
 *     },
 *     ...
 *   ]
 * }
 *
 * OR for single score submission:
 * {
 *   team_id: string,
 *   tournament_type: "2-man" | "4-man",
 *   hole_number: number,
 *   strokes: number,
 *   drive_player_id: string,
 *   mulligan_player_id?: string | null
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res
      .status(405)
      .json({ success: false, error: 'Method not allowed' });
  }

  try {
    const {
      team_id,
      tournament_type,
      scores,
      hole_number,
      strokes,
      drive_player_id,
      mulligan_player_id,
    } = req.body;

    // Basic validation of required fields
    if (!team_id) {
      return res
        .status(400)
        .json({ success: false, error: 'Team ID is required' });
    }

    if (
      !tournament_type ||
      (tournament_type !== '2-man' && tournament_type !== '4-man')
    ) {
      return res.status(400).json({
        success: false,
        error: 'Valid tournament type is required (2-man or 4-man)',
      });
    }

    // Handle single score submission
    if (typeof hole_number === 'number') {
      // Quick validation for required fields
      if (!strokes || strokes <= 0) {
        return res
          .status(400)
          .json({ success: false, error: 'Valid strokes value is required' });
      }

      if (!drive_player_id) {
        return res
          .status(400)
          .json({ success: false, error: 'Drive player ID is required' });
      }

      const result = await submitPublicScore({
        team_id,
        tournament_type: tournament_type as TournamentType,
        hole_number,
        strokes,
        drive_player_id,
        mulligan_player_id: mulligan_player_id || null,
      });

      return res.status(result.success ? 200 : 400).json(result);
    }

    // Handle multiple scores submission
    if (!Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Scores array is required for bulk submission',
      });
    }

    // Format scores for bulk submission
    const formattedScores = scores.map((score) => ({
      team_id,
      tournament_type: tournament_type as TournamentType,
      hole_number: score.hole_number,
      strokes: score.strokes,
      drive_player_id: score.drive_player_id,
      mulligan_player_id: score.mulligan_player_id || null,
    }));

    const result = await submitPublicScores(formattedScores);

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Error handling score submission:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
