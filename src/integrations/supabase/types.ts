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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      class_instructors: {
        Row: {
          class_id: number
          created_at: string
          id: number
          instructor_id: string
        }
        Insert: {
          class_id: number
          created_at?: string
          id?: number
          instructor_id: string
        }
        Update: {
          class_id?: number
          created_at?: string
          id?: number
          instructor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_instructors_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_instructors_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "instructors"
            referencedColumns: ["id"]
          },
        ]
      }
      class_projects: {
        Row: {
          class_id: number
          created_at: string
          id: number
          project_id: number
        }
        Insert: {
          class_id: number
          created_at?: string
          id?: number
          project_id: number
        }
        Update: {
          class_id?: number
          created_at?: string
          id?: number
          project_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_projects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: number
          is_active: boolean
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          class_id: number
          created_at: string
          id: number
          student_id: string
        }
        Insert: {
          class_id: number
          created_at?: string
          id?: number
          student_id: string
        }
        Update: {
          class_id?: number
          created_at?: string
          id?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      formation_inscriptions: {
        Row: {
          age: string | null
          created_at: string
          email: string
          experience: string
          first_name: string
          id: string
          last_name: string
          motivation: string
          payment_plan: string
          phone: string
          situation: string
          updated_at: string
          urgency: string
        }
        Insert: {
          age?: string | null
          created_at?: string
          email: string
          experience: string
          first_name: string
          id?: string
          last_name: string
          motivation: string
          payment_plan?: string
          phone: string
          situation: string
          updated_at?: string
          urgency: string
        }
        Update: {
          age?: string | null
          created_at?: string
          email?: string
          experience?: string
          first_name?: string
          id?: string
          last_name?: string
          motivation?: string
          payment_plan?: string
          phone?: string
          situation?: string
          updated_at?: string
          urgency?: string
        }
        Relationships: []
      }
      formation_reservations: {
        Row: {
          created_at: string
          email: string
          id: string
          nom: string
          telephone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          nom: string
          telephone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          nom?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      hacker_formation_inscriptions: {
        Row: {
          conditions_acceptees: boolean
          created_at: string
          email: string
          id: string
          mode_paiement: string
          motivation: string
          niveau_informatique: string
          nom: string
          notes_admin: string | null
          prenom: string
          statut: string
          telephone: string
          updated_at: string
        }
        Insert: {
          conditions_acceptees?: boolean
          created_at?: string
          email: string
          id?: string
          mode_paiement: string
          motivation: string
          niveau_informatique: string
          nom: string
          notes_admin?: string | null
          prenom: string
          statut?: string
          telephone: string
          updated_at?: string
        }
        Update: {
          conditions_acceptees?: boolean
          created_at?: string
          email?: string
          id?: string
          mode_paiement?: string
          motivation?: string
          niveau_informatique?: string
          nom?: string
          notes_admin?: string | null
          prenom?: string
          statut?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      instructors: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      program_registrations_vac25: {
        Row: {
          accept_terms: boolean
          child_age: number
          child_level: string | null
          child_name: string
          created_at: string
          id: string
          motivation: string | null
          newsletter: boolean | null
          notes: string | null
          parent_email: string | null
          parent_name: string
          parent_phone: string
          payment_method: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          accept_terms?: boolean
          child_age: number
          child_level?: string | null
          child_name: string
          created_at?: string
          id?: string
          motivation?: string | null
          newsletter?: boolean | null
          notes?: string | null
          parent_email?: string | null
          parent_name: string
          parent_phone: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          accept_terms?: boolean
          child_age?: number
          child_level?: string | null
          child_name?: string
          created_at?: string
          id?: string
          motivation?: string | null
          newsletter?: boolean | null
          notes?: string | null
          parent_email?: string | null
          parent_name?: string
          parent_phone?: string
          payment_method?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          code: string
          created_at: string
          description: string | null
          due_at: string | null
          id: number
          is_active: boolean
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: number
          is_active?: boolean
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: number
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_index: number
          selected_answer: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_index: number
          selected_answer: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_index?: number
          selected_answer?: string
          session_id?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          attendance_type: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          motivation: string | null
          phone: string
          profession: string
          updated_at: string
        }
        Insert: {
          attendance_type: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          motivation?: string | null
          phone: string
          profession: string
          updated_at?: string
        }
        Update: {
          attendance_type?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          motivation?: string | null
          phone?: string
          profession?: string
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          github_profile: string | null
          id: string
          phone: string | null
          primary_class_id: number | null
          telegram: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_profile?: string | null
          id?: string
          phone?: string | null
          primary_class_id?: number | null
          telegram?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_profile?: string | null
          id?: string
          phone?: string | null
          primary_class_id?: number | null
          telegram?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_primary_class_id_fkey"
            columns: ["primary_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          class_id: number
          description: string | null
          file1_url: string | null
          file2_url: string | null
          file3_url: string | null
          id: number
          link1: string | null
          link2: string | null
          link3: string | null
          project_id: number
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          class_id: number
          description?: string | null
          file1_url?: string | null
          file2_url?: string | null
          file3_url?: string | null
          id?: number
          link1?: string | null
          link2?: string | null
          link3?: string | null
          project_id: number
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          class_id?: number
          description?: string | null
          file1_url?: string | null
          file2_url?: string | null
          file3_url?: string | null
          id?: number
          link1?: string | null
          link2?: string | null
          link3?: string | null
          project_id?: number
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      subsidy_applications: {
        Row: {
          admin_notes: string | null
          city: string | null
          country: string
          created_at: string
          email: string
          experience: string | null
          financial_situation: string
          first_name: string
          id: string
          last_name: string
          motivation: string
          phone: string
          profession: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          admin_notes?: string | null
          city?: string | null
          country: string
          created_at?: string
          email: string
          experience?: string | null
          financial_situation: string
          first_name: string
          id?: string
          last_name: string
          motivation: string
          phone: string
          profession?: string | null
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          admin_notes?: string | null
          city?: string | null
          country?: string
          created_at?: string
          email?: string
          experience?: string | null
          financial_situation?: string
          first_name?: string
          id?: string
          last_name?: string
          motivation?: string
          phone?: string
          profession?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      submission_status: "Reçu" | "En révision" | "Validé" | "Refusé"
      user_role: "admin" | "user"
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
      submission_status: ["Reçu", "En révision", "Validé", "Refusé"],
      user_role: ["admin", "user"],
    },
  },
} as const
