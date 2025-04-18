-- Create players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL
);

-- Create tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  type TEXT PRIMARY KEY CHECK (type IN ('2-man', '4-man')),
  name TEXT NOT NULL,
  default_mulligans INTEGER NOT NULL DEFAULT 0,
  course_pars JSONB NOT NULL
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  handicap NUMERIC(5,1) NOT NULL DEFAULT 0,
  tournament_type TEXT NOT NULL REFERENCES tournaments(type) ON DELETE CASCADE
);

-- Create team_players join table
CREATE TABLE IF NOT EXISTS team_players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE (team_id, player_id)
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  hole_number INTEGER NOT NULL CHECK (hole_number BETWEEN 1 AND 18),
  strokes INTEGER NOT NULL CHECK (strokes > 0),
  drive_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  mulligan_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  tournament_type TEXT NOT NULL REFERENCES tournaments(type) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, hole_number, tournament_type)
);

-- Row Level Security Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Allow public read access for players" ON players FOR SELECT USING (true);
CREATE POLICY "Allow public read access for tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "Allow public read access for teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow public read access for team_players" ON team_players FOR SELECT USING (true);
CREATE POLICY "Allow public read access for scores" ON scores FOR SELECT USING (true);

-- Allow anonymous/public insert for scores
CREATE POLICY "Allow public insert for scores" ON scores FOR INSERT WITH CHECK (true);

-- Optional: Add some indexes for performance
CREATE INDEX idx_team_players_team_id ON team_players (team_id);
CREATE INDEX idx_team_players_player_id ON team_players (player_id);
CREATE INDEX idx_scores_team_id ON scores (team_id);
CREATE INDEX idx_scores_tournament_type ON scores (tournament_type);
CREATE INDEX idx_teams_tournament_type ON teams (tournament_type); 