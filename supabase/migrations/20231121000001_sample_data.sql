-- Insert tournament types
INSERT INTO tournaments (type, name, default_mulligans, course_pars)
VALUES 
  ('2-man', '2-Man Tournament', 2, '{"1":4,"2":3,"3":4,"4":5,"5":4,"6":3,"7":4,"8":5,"9":4,"10":4,"11":3,"12":4,"13":5,"14":4,"15":3,"16":4,"17":5,"18":4}'),
  ('4-man', '4-Man Tournament', 4, '{"1":4,"2":3,"3":4,"4":5,"5":4,"6":3,"7":4,"8":5,"9":4,"10":4,"11":3,"12":4,"13":5,"14":4,"15":3,"16":4,"17":5,"18":4}');

-- Insert sample players
INSERT INTO players (id, name)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'John Smith'),
  ('22222222-2222-2222-2222-222222222222', 'Jane Doe'),
  ('33333333-3333-3333-3333-333333333333', 'Michael Johnson'),
  ('44444444-4444-4444-4444-444444444444', 'Sarah Williams');

-- Insert sample teams for 2-man tournament
INSERT INTO teams (id, name, handicap, tournament_type)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Team Alpha', 5.2, '2-man'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Team Beta', 8.7, '2-man');

-- Insert sample teams for 4-man tournament
INSERT INTO teams (id, name, handicap, tournament_type)
VALUES 
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Team Gamma', 12.5, '4-man');

-- Link players to teams
INSERT INTO team_players (team_id, player_id)
VALUES 
  -- Team Alpha (2-man)
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222'),
  
  -- Team Beta (2-man)
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '44444444-4444-4444-4444-444444444444'),
  
  -- Team Gamma (4-man) - Only 2 players added as examples
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333');

-- Insert sample scores for Team Alpha (2-man)
INSERT INTO scores (team_id, hole_number, strokes, drive_player_id, mulligan_player_id, tournament_type)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 4, '11111111-1111-1111-1111-111111111111', NULL, '2-man'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 2, 3, '22222222-2222-2222-2222-222222222222', NULL, '2-man'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, 5, '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '2-man');

-- Insert sample scores for Team Beta (2-man)
INSERT INTO scores (team_id, hole_number, strokes, drive_player_id, mulligan_player_id, tournament_type)
VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 1, 5, '33333333-3333-3333-3333-333333333333', NULL, '2-man'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 4, '44444444-4444-4444-4444-444444444444', NULL, '2-man'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3, 4, '33333333-3333-3333-3333-333333333333', '44444444-4444-4444-4444-444444444444', '2-man'); 