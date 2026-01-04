export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean | null
          nama: string
          role: Database["public"]["Enums"]["admin_role"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean | null
          nama: string
          role?: Database["public"]["Enums"]["admin_role"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean | null
          nama?: string
          role?: Database["public"]["Enums"]["admin_role"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jenis_surat: {
        Row: {
          created_at: string
          deskripsi: string | null
          id: string
          is_active: boolean | null
          kode: string
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          kode: string
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deskripsi?: string | null
          id?: string
          is_active?: boolean | null
          kode?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      mahasiswa: {
        Row: {
          created_at: string
          email: string
          id: string
          nama: string
          nim: string
          no_hp: string
          program_studi: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nama: string
          nim: string
          no_hp: string
          program_studi: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nama?: string
          nim?: string
          no_hp?: string
          program_studi?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pengajuan_surat: {
        Row: {
          catatan_admin: string | null
          created_at: string
          diajukan_at: string
          diproses_at: string | null
          disetujui_at: string | null
          file_surat_url: string | null
          id: string
          jenis_surat_id: string
          keperluan: string
          mahasiswa_id: string
          nomor_pengajuan: string
          processed_by: string | null
          selesai_at: string | null
          status: Database["public"]["Enums"]["status_pengajuan"] | null
          updated_at: string
        }
        Insert: {
          catatan_admin?: string | null
          created_at?: string
          diajukan_at?: string
          diproses_at?: string | null
          disetujui_at?: string | null
          file_surat_url?: string | null
          id?: string
          jenis_surat_id: string
          keperluan: string
          mahasiswa_id: string
          nomor_pengajuan?: string
          processed_by?: string | null
          selesai_at?: string | null
          status?: Database["public"]["Enums"]["status_pengajuan"] | null
          updated_at?: string
        }
        Update: {
          catatan_admin?: string | null
          created_at?: string
          diajukan_at?: string
          diproses_at?: string | null
          disetujui_at?: string | null
          file_surat_url?: string | null
          id?: string
          jenis_surat_id?: string
          keperluan?: string
          mahasiswa_id?: string
          nomor_pengajuan?: string
          processed_by?: string | null
          selesai_at?: string | null
          status?: Database["public"]["Enums"]["status_pengajuan"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengajuan_surat_jenis_surat_id_fkey"
            columns: ["jenis_surat_id"]
            isOneToOne: false
            referencedRelation: "jenis_surat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_surat_mahasiswa_id_fkey"
            columns: ["mahasiswa_id"]
            isOneToOne: false
            referencedRelation: "mahasiswa"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pengajuan_surat_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      admin_role: "super_admin" | "admin"
      status_pengajuan: "DIAJUKAN" | "DISETUJUI" | "DIPROSES" | "SELESAI"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role: ["super_admin", "admin"],
      status_pengajuan: ["DIAJUKAN", "DISETUJUI", "DIPROSES", "SELESAI"],
    },
  },
} as const
