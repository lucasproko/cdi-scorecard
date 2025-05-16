import { createClient } from '@supabase/supabase-js';

import { Database, TournamentType } from '../types/supabase';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Fetches tournament details for a specific tournament type
 * @param tournamentType The type of tournament (2-man or 4-man)
 */
export async function getTournamentDetails(tournamentType: TournamentType) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('type', tournamentType)
    .single();

  if (error) {
    console.error(
      `Error fetching tournament details for ${tournamentType}:`,
      error,
    );
    return null;
  }

  return data;
}

/**
 * Fetches all teams for a specific tournament type
 * @param tournamentType The type of tournament (2-man or 4-man)
 */
export async function getTeams(tournamentType: TournamentType) {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('tournament_type', tournamentType);

  if (error) {
    console.error(
      `Error fetching teams for tournament type ${tournamentType}:`,
      error,
    );
    return [];
  }

  return data;
}

/**
 * Fetches players for a specific team
 * @param teamId The ID of the team
 */
export async function getPlayersForTeam(teamId: string) {
  const { data, error } = await supabase
    .from('team_players')
    .select(
      `
      player_id,
      players(*)
    `,
    )
    .eq('team_id', teamId);

  if (error) {
    console.error(`Error fetching players for team ${teamId}:`, error);
    return [];
  }

  // Transform the response to be more usable
  return data.map((item) => item.players);
}

/**
 * Fetches all scores for the leaderboard for a specific tournament type
 * @param tournamentType The type of tournament (2-man or 4-man)
 */
export async function getScores(tournamentType: TournamentType) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      *,
      teams(*),
      drive_player:players!scores_drive_player_id_fkey(id, name),
      mulligan_player:players!scores_mulligan_player_id_fkey(id, name)
    `,
    )
    .eq('tournament_type', tournamentType)
    .order('team_id')
    .order('hole_number');

  if (error) {
    console.error(
      `Error fetching scores for tournament ${tournamentType}:`,
      error,
    );
    return [];
  }

  return data;
}

/**
 * Fetches all scores for a specific team
 * @param teamId The ID of the team
 */
export async function getTeamScores(teamId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      *,
      drive_player:players!scores_drive_player_id_fkey(id, name),
      mulligan_player:players!scores_mulligan_player_id_fkey(id, name)
    `,
    )
    .eq('team_id', teamId)
    .order('hole_number');

  if (error) {
    console.error(`Error fetching scores for team ${teamId}:`, error);
    return [];
  }

  return data;
}

/**
 * Counts the number of drives by each player for a specific team
 * @param teamId The ID of the team
 */
export async function getTeamDriveCounts(teamId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      drive_player_id,
      drive_player:players!scores_drive_player_id_fkey(id, name)
    `,
    )
    .eq('team_id', teamId);

  if (error) {
    console.error(`Error fetching drive counts for team ${teamId}:`, error);
    return [];
  }

  // Count drives by player
  const driveCounts: Record<
    string,
    { id: string; name: string; count: number }
  > = {};

  data.forEach((score) => {
    const playerId = score.drive_player_id;
    const playerName = score.drive_player.name;

    if (!driveCounts[playerId]) {
      driveCounts[playerId] = { id: playerId, name: playerName, count: 0 };
    }

    driveCounts[playerId].count += 1;
  });

  return Object.values(driveCounts);
}

/**
 * Counts the number of mulligans used by each player for a specific team
 * @param teamId The ID of the team
 * @param tournamentType The type of tournament to get default mulligan count
 */
export async function getTeamMulliganCounts(
  teamId: string,
  tournamentType: TournamentType,
) {
  // First get the tournament default mulligan count
  const tournament = await getTournamentDetails(tournamentType);
  const defaultMulligans = tournament?.default_mulligans || 0;

  // Get all players on the team
  const players = await getPlayersForTeam(teamId);

  // Get mulligans used from scores
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      mulligan_player_id,
      mulligan_player:players!scores_mulligan_player_id_fkey(id, name)
    `,
    )
    .eq('team_id', teamId)
    .not('mulligan_player_id', 'is', null);

  if (error) {
    console.error(`Error fetching mulligan counts for team ${teamId}:`, error);
    return [];
  }

  // Initialize mulligan counts with default values for all players
  const mulliganCounts: Record<
    string,
    { id: string; name: string; used: number; remaining: number }
  > = {};

  // Initialize with all players having full mulligans
  players.forEach((player) => {
    if (player) {
      mulliganCounts[player.id] = {
        id: player.id,
        name: player.name,
        used: 0,
        remaining: defaultMulligans,
      };
    }
  });

  // Count used mulligans
  data.forEach((score) => {
    if (score.mulligan_player_id && mulliganCounts[score.mulligan_player_id]) {
      mulliganCounts[score.mulligan_player_id].used += 1;
      mulliganCounts[score.mulligan_player_id].remaining -= 1;
    }
  });

  return Object.values(mulliganCounts);
}

/**
 * Gets comprehensive leaderboard data for a tournament
 * @param tournamentType The type of tournament (2-man or 4-man)
 */
export async function getLeaderboard(tournamentType: TournamentType) {
  try {
    // Get tournament info (including pars)
    const tournament = await getTournamentDetails(tournamentType);
    if (!tournament) {
      console.error(`Tournament not found: ${tournamentType}`);
      return { tournament: null, leaderboard: [] };
    }

    // Get all teams for this tournament
    const teams = await getTeams(tournamentType);

    // Get all scores for this tournament
    const allScores = await getScores(tournamentType);

    // Process leaderboard data
    const leaderboard = await Promise.all(
      teams.map(async (team) => {
        // Filter scores for this team
        const teamScores = allScores.filter(
          (score) => score.team_id === team.id,
        );

        // Calculate total strokes
        const totalStrokes = teamScores.reduce(
          (sum, score) => sum + score.strokes,
          0,
        );

        // Calculate scores relative to par
        let relativeToPar = 0;
        const coursePars = tournament.course_pars as Record<string, number>;

        teamScores.forEach((score) => {
          const holePar = coursePars[score.hole_number.toString()];
          if (holePar) {
            relativeToPar += score.strokes - holePar;
          }
        });

        // Calculate holes completed
        const holesCompleted = new Set(
          teamScores.map((score) => score.hole_number),
        ).size;

        // Get total remaining mulligans
        const mulliganCounts = await getTeamMulliganCounts(
          team.id,
          tournamentType,
        );
        const totalRemainingMulligans = mulliganCounts.reduce(
          (sum, player) => sum + player.remaining,
          0,
        );

        // Get drive counts
        const driveCounts = await getTeamDriveCounts(team.id);

        // Calculate net score
        const netRelativeToPar = relativeToPar - team.handicap;

        return {
          team,
          totalStrokes,
          relativeToPar,
          netRelativeToPar,
          holesCompleted,
          totalRemainingMulligans,
          mulliganCounts,
          driveCounts,
          scores: teamScores,
        };
      }),
    );

    // Sort by net relative to par (lowest first)
    leaderboard.sort((a, b) => a.netRelativeToPar - b.netRelativeToPar);

    return {
      tournament,
      leaderboard,
    };
  } catch (error) {
    console.error(`Error generating leaderboard for ${tournamentType}:`, error);
    return { tournament: null, leaderboard: [] };
  }
}

/**
 * Validates that a player belongs to a specific team
 * @param playerId The ID of the player
 * @param teamId The ID of the team
 * @returns True if the player belongs to the team, false otherwise
 */
export async function isPlayerOnTeam(
  playerId: string,
  teamId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('team_players')
    .select('*')
    .eq('team_id', teamId)
    .eq('player_id', playerId);

  if (error) {
    console.error(
      `Error validating player ${playerId} on team ${teamId}:`,
      error,
    );
    return false;
  }

  return data.length > 0;
}

/**
 * Validates that a team belongs to a specific tournament type
 * @param teamId The ID of the team
 * @param tournamentType The type of tournament
 * @returns True if the team belongs to the tournament, false otherwise
 */
export async function isTeamInTournament(
  teamId: string,
  tournamentType: TournamentType,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .eq('tournament_type', tournamentType);

  if (error) {
    console.error(
      `Error validating team ${teamId} in tournament ${tournamentType}:`,
      error,
    );
    return false;
  }

  return data.length > 0;
}

/**
 * Submits a single score for public score submission
 */
export async function submitPublicScore(scoreData: {
  team_id: string;
  hole_number: number;
  strokes: number;
  drive_player_id: string;
  mulligan_player_id?: string | null;
  tournament_type: TournamentType;
}) {
  try {
    // First verify that the team exists and is part of the tournament
    const teamExists = await isTeamInTournament(
      scoreData.team_id,
      scoreData.tournament_type,
    );
    if (!teamExists) {
      return {
        success: false,
        error: `Team not found in the ${scoreData.tournament_type} tournament`,
      };
    }

    // Verify that the driver is on the team
    const driverOnTeam = await isPlayerOnTeam(
      scoreData.drive_player_id,
      scoreData.team_id,
    );
    if (!driverOnTeam) {
      return {
        success: false,
        error: 'Drive player not found on this team',
      };
    }

    // Verify that the mulligan player is on the team, if provided
    if (scoreData.mulligan_player_id) {
      const mulliganOnTeam = await isPlayerOnTeam(
        scoreData.mulligan_player_id,
        scoreData.team_id,
      );
      if (!mulliganOnTeam) {
        return {
          success: false,
          error: 'Mulligan player not found on this team',
        };
      }
    }

    // Use upsert to handle both insert and update with a single operation
    try {
      // Try with mulligan first if provided
      const { data, error } = await supabase
        .from('scores')
        .upsert(
          {
            team_id: scoreData.team_id,
            hole_number: scoreData.hole_number,
            strokes: scoreData.strokes,
            drive_player_id: scoreData.drive_player_id,
            mulligan_player_id: scoreData.mulligan_player_id,
            tournament_type: scoreData.tournament_type,
            // Add created_at timestamp to ensure we have this field populated
            created_at: new Date().toISOString(),
          },
          {
            // This is the critical part - we're telling Supabase which columns form the unique constraint
            onConflict: 'team_id,hole_number,tournament_type',
          },
        )
        .select('id')
        .single();

      if (error) {
        // Check for RLS policy error specifically with mulligans
        if (error.message.includes('row-level security policy')) {
          console.error('Error submitting score:', error);

          // Try again without the mulligan to see if that's the issue
          if (scoreData.mulligan_player_id) {
            const { data: retryData, error: retryError } = await supabase
              .from('scores')
              .upsert(
                {
                  team_id: scoreData.team_id,
                  hole_number: scoreData.hole_number,
                  strokes: scoreData.strokes,
                  drive_player_id: scoreData.drive_player_id,
                  mulligan_player_id: null, // Remove mulligan
                  tournament_type: scoreData.tournament_type,
                  created_at: new Date().toISOString(),
                },
                {
                  onConflict: 'team_id,hole_number,tournament_type',
                },
              )
              .select('id')
              .single();

            if (retryError) {
              // Still have an error, return the original error
              return {
                success: false,
                error: error.message,
              };
            } else {
              // Successfully saved without the mulligan
              return {
                success: false,
                error:
                  'Mulligan could not be saved due to permissions. Score saved without mulligan.',
                data: retryData,
              };
            }
          }

          return {
            success: false,
            error: error.message,
          };
        }

        console.error('Error upserting score:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Error in score submission:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error during score submission',
      };
    }
  } catch (error) {
    console.error('Error in submitPublicScore:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Submit multiple scores at once for a team
 * @param scoresData Array of score data objects
 */
export async function submitPublicScores(
  scoresData: Array<{
    team_id: string;
    hole_number: number;
    strokes: number;
    drive_player_id: string;
    mulligan_player_id?: string | null;
    tournament_type: TournamentType;
  }>,
) {
  // All scores should be for the same team and tournament
  if (scoresData.length === 0) {
    return {
      success: false,
      error: 'No scores provided',
    };
  }

  const teamId = scoresData[0].team_id;
  const tournamentType = scoresData[0].tournament_type;

  // Check if any scores have different team or tournament
  const invalidData = scoresData.some(
    (score) =>
      score.team_id !== teamId || score.tournament_type !== tournamentType,
  );

  if (invalidData) {
    return {
      success: false,
      error: 'All scores must be for the same team and tournament',
    };
  }

  try {
    // Validate that the team belongs to the tournament
    const teamInTournament = await isTeamInTournament(teamId, tournamentType);

    if (!teamInTournament) {
      throw new Error(
        `Team ${teamId} does not belong to tournament ${tournamentType}`,
      );
    }

    // Get all players on this team
    const teamPlayersData = await supabase
      .from('team_players')
      .select('player_id')
      .eq('team_id', teamId);

    if (teamPlayersData.error) {
      throw new Error(
        `Error validating team players: ${teamPlayersData.error.message}`,
      );
    }

    const teamPlayerIds = new Set(
      teamPlayersData.data.map((tp) => tp.player_id),
    );

    // Validate that all players in the scores belong to the team
    for (const score of scoresData) {
      if (!teamPlayerIds.has(score.drive_player_id)) {
        throw new Error(
          `Drive player ${score.drive_player_id} does not belong to team ${teamId}`,
        );
      }

      if (
        score.mulligan_player_id &&
        !teamPlayerIds.has(score.mulligan_player_id)
      ) {
        throw new Error(
          `Mulligan player ${score.mulligan_player_id} does not belong to team ${teamId}`,
        );
      }

      // Validate hole number and strokes
      if (score.hole_number < 1 || score.hole_number > 18) {
        throw new Error(`Invalid hole number: ${score.hole_number}`);
      }

      if (score.strokes <= 0) {
        throw new Error(
          `Invalid strokes for hole ${score.hole_number}: ${score.strokes}`,
        );
      }
    }

    // Add timestamps to all scores
    const scoresToInsert = scoresData.map((score) => ({
      ...score,
      created_at: new Date().toISOString(),
    }));

    // All validations passed, insert or update the scores in bulk
    const { data, error } = await supabase
      .from('scores')
      .upsert(scoresToInsert, {
        onConflict: 'team_id,hole_number,tournament_type',
      });

    if (error) {
      console.error('Error submitting scores:', error);
      throw new Error(`Failed to save scores: ${error.message}`);
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: 'An unknown error occurred',
    };
  }
}
