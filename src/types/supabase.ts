export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          type: string;
          name: string;
          default_mulligans: number;
          course_pars: Json;
        };
        Insert: {
          type: string;
          name: string;
          default_mulligans?: number;
          course_pars: Json;
        };
        Update: {
          type?: string;
          name?: string;
          default_mulligans?: number;
          course_pars?: Json;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          handicap: number;
          tournament_type: string;
        };
        Insert: {
          id?: string;
          name: string;
          handicap?: number;
          tournament_type: string;
        };
        Update: {
          id?: string;
          name?: string;
          handicap?: number;
          tournament_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_tournament_type_fkey';
            columns: ['tournament_type'];
            referencedRelation: 'tournaments';
            referencedColumns: ['type'];
          },
        ];
      };
      team_players: {
        Row: {
          id: string;
          team_id: string;
          player_id: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          player_id: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          player_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'team_players_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'team_players_player_id_fkey';
            columns: ['player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
        ];
      };
      scores: {
        Row: {
          id: string;
          team_id: string;
          hole_number: number;
          strokes: number;
          drive_player_id: string;
          mulligan_player_id: string | null;
          tournament_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          hole_number: number;
          strokes: number;
          drive_player_id: string;
          mulligan_player_id?: string | null;
          tournament_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          hole_number?: number;
          strokes?: number;
          drive_player_id?: string;
          mulligan_player_id?: string | null;
          tournament_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scores_team_id_fkey';
            columns: ['team_id'];
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scores_drive_player_id_fkey';
            columns: ['drive_player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scores_mulligan_player_id_fkey';
            columns: ['mulligan_player_id'];
            referencedRelation: 'players';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scores_tournament_type_fkey';
            columns: ['tournament_type'];
            referencedRelation: 'tournaments';
            referencedColumns: ['type'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type TournamentType = '2-man' | '4-man';
export type CoursePars = Record<string, number>; // Hole number to par mapping
