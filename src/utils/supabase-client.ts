import { createClient } from '@supabase/supabase-js';

import { Database, InsertTables, TournamentType } from '../types/supabase';

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

/**
 * Fetch all tournaments
 */
export async function getTournaments() {
  const { data, error } = await supabase.from('tournaments').select('*');

  if (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }

  return data;
}

/**
 * Fetch a specific tournament by type
 */
export async function getTournament(type: TournamentType) {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .eq('type', type)
    .single();

  if (error) {
    console.error(`Error fetching tournament with type ${type}:`, error);
    return null;
  }

  return data;
}

/**
 * Fetch all teams for a specific tournament type
 */
export async function getTeams(tournamentType: TournamentType) {
  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_players(
        player_id,
        players(*)
      )
    `,
    )
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
 * Fetch a specific team by ID
 */
export async function getTeam(teamId: string) {
  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_players(
        player_id,
        players(*)
      )
    `,
    )
    .eq('id', teamId)
    .single();

  if (error) {
    console.error(`Error fetching team with ID ${teamId}:`, error);
    return null;
  }

  return data;
}

/**
 * Create a new player
 */
export async function createPlayer(player: InsertTables<'players'>) {
  const { data, error } = await supabase
    .from('players')
    .insert(player)
    .select()
    .single();

  if (error) {
    console.error('Error creating player:', error);
    return null;
  }

  return data;
}

/**
 * Create a new team
 */
export async function createTeam(
  team: InsertTables<'teams'>,
  playerIds: string[],
) {
  // Start a transaction by using the rpc method
  const { data: newTeam, error: teamError } = await supabase
    .from('teams')
    .insert(team)
    .select()
    .single();

  if (teamError) {
    console.error('Error creating team:', teamError);
    return null;
  }

  // Add players to the team
  const teamPlayers = playerIds.map((playerId) => ({
    team_id: newTeam.id,
    player_id: playerId,
  }));

  const { error: playersError } = await supabase
    .from('team_players')
    .insert(teamPlayers);

  if (playersError) {
    console.error('Error adding players to team:', playersError);
    // Ideally we would roll back the team creation here in a real transaction
    return null;
  }

  return newTeam;
}

/**
 * Submit a score
 */
export async function submitScore(score: InsertTables<'scores'>) {
  const { data, error } = await supabase
    .from('scores')
    .upsert(score, { onConflict: 'team_id,hole_number,tournament_type' })
    .select()
    .single();

  if (error) {
    console.error('Error submitting score:', error);
    return null;
  }

  return data;
}

/**
 * Get scores for a team
 */
export async function getTeamScores(teamId: string) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      *,
      teams(*),
      drive_player:players!scores_drive_player_id_fkey(*),
      mulligan_player:players!scores_mulligan_player_id_fkey(*)
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
 * Get all scores for a tournament type
 */
export async function getTournamentScores(tournamentType: TournamentType) {
  const { data, error } = await supabase
    .from('scores')
    .select(
      `
      *,
      teams(*),
      drive_player:players!scores_drive_player_id_fkey(*),
      mulligan_player:players!scores_mulligan_player_id_fkey(*)
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
