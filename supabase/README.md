# Golf Tournament Schema for Supabase

This directory contains the SQL migration files needed to set up the database schema for the golf tournament application.

## Schema Overview

The schema includes these tables:

- `players`: Stores information about individual players
- `tournaments`: Defines tournament types (2-man, 4-man) and course information
- `teams`: Teams participating in tournaments
- `team_players`: Join table connecting players to teams
- `scores`: Records scores for each team on each hole

## Row Level Security (RLS)

The schema includes RLS policies that:

- Allow public read access to all tables
- Allow anonymous/public insert for scores
- Restrict updates/deletes by default

## How to Apply the Schema

### Option 1: Using Supabase CLI

1. Install the Supabase CLI if you haven't already:

   ```
   npm install -g supabase
   ```

2. Link your project:

   ```
   supabase link --project-ref your-project-ref
   ```

3. Apply the migrations:
   ```
   supabase db push
   ```

### Option 2: Using Supabase Dashboard

1. Log in to the Supabase dashboard
2. Select your project
3. Go to the SQL Editor
4. Copy the contents of `migrations/20231121000000_golf_tournament_schema.sql`
5. Paste it into the SQL Editor and run it

## Sample Data

You may want to populate the database with sample data for testing:

```sql
-- Insert tournament types
INSERT INTO tournaments (type, name, default_mulligans, course_pars)
VALUES
  ('2-man', '2-Man Tournament', 2, '{"1":4,"2":3,"3":4,"4":5,"5":4,"6":3,"7":4,"8":5,"9":4,"10":4,"11":3,"12":4,"13":5,"14":4,"15":3,"16":4,"17":5,"18":4}'),
  ('4-man', '4-Man Tournament', 4, '{"1":4,"2":3,"3":4,"4":5,"5":4,"6":3,"7":4,"8":5,"9":4,"10":4,"11":3,"12":4,"13":5,"14":4,"15":3,"16":4,"17":5,"18":4}');

-- Then add players, teams, and other data as needed
```
