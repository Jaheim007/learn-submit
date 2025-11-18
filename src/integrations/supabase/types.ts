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
      admins: {
        Row: {
          created_at: string | null
          full_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          created_at: string
          email: string
          experience_level: string
          first_name: string
          id: string
          last_name: string
          motivation: string
          phone: string
          program: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          experience_level: string
          first_name: string
          id?: string
          last_name: string
          motivation: string
          phone: string
          program: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          experience_level?: string
          first_name?: string
          id?: string
          last_name?: string
          motivation?: string
          phone?: string
          program?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          class_id: number | null
          created_at: string
          created_by: string
          id: string
          title: string | null
          type: string
          updated_at: string
        }
        Insert: {
          class_id?: number | null
          created_at?: string
          created_by: string
          id?: string
          title?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          class_id?: number | null
          created_at?: string
          created_by?: string
          id?: string
          title?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_conversations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      class_enrollments: {
        Row: {
          class_id: number
          created_at: string
          user_id: string
        }
        Insert: {
          class_id: number
          created_at?: string
          user_id: string
        }
        Update: {
          class_id?: number
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
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
          is_open_for_signup: boolean | null
          session_name: string | null
          signup_deadline: string | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_open_for_signup?: boolean | null
          session_name?: string | null
          signup_deadline?: string | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: number
          is_active?: boolean
          is_open_for_signup?: boolean | null
          session_name?: string | null
          signup_deadline?: string | null
          title?: string
        }
        Relationships: []
      }
      course_materials: {
        Row: {
          class_id: number
          course_group_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_type: string
          file_url: string
          id: string
          image_url: string | null
          title: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          class_id: number
          course_group_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_type: string
          file_url: string
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          class_id?: number
          course_group_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      efi_preinscriptions: {
        Row: {
          created_at: string
          email: string
          format_cours: string
          id: string
          logiciels_souhaites: string[]
          message: string | null
          nom: string
          telephone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          format_cours: string
          id?: string
          logiciels_souhaites: string[]
          message?: string | null
          nom: string
          telephone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          format_cours?: string
          id?: string
          logiciels_souhaites?: string[]
          message?: string | null
          nom?: string
          telephone?: string
          updated_at?: string
        }
        Relationships: []
      }
      end_of_training_forms: {
        Row: {
          additional_resources: string | null
          attendance_mode: string | null
          attended_all_sessions: boolean
          certificate_email: string
          certificate_name: string
          city: string | null
          cohort: string
          company_name: string | null
          company_sector: string | null
          completed_projects: string[] | null
          concrete_builds: string
          country: string | null
          created_at: string
          current_address: string
          current_occupation: string
          date_of_birth: string
          declaration_accepted: boolean
          education_level: string
          email: string
          full_name: string
          gender: string
          generated_income: boolean
          has_partners_clients: boolean
          id: string
          improvement_suggestions: string | null
          income_amount: string | null
          main_goal: string
          main_trainers: string[] | null
          most_useful_skill: string
          nationality: string
          overall_rating: number
          partners_clients_count: number | null
          phone: string
          plans_to_launch_company: boolean
          portfolio_link: string
          projected_income_12m: string | null
          projected_income_3m: string | null
          projected_income_6m: string | null
          recommendation_reason: string | null
          skill_needs_improvement: string
          submitted_all_projects: boolean
          trainer_ratings: Json | null
          updated_at: string
          vision_3_years: string
          wants_certificate: boolean
          would_recommend: boolean
        }
        Insert: {
          additional_resources?: string | null
          attendance_mode?: string | null
          attended_all_sessions: boolean
          certificate_email: string
          certificate_name: string
          city?: string | null
          cohort: string
          company_name?: string | null
          company_sector?: string | null
          completed_projects?: string[] | null
          concrete_builds: string
          country?: string | null
          created_at?: string
          current_address: string
          current_occupation: string
          date_of_birth: string
          declaration_accepted: boolean
          education_level: string
          email: string
          full_name: string
          gender: string
          generated_income: boolean
          has_partners_clients: boolean
          id?: string
          improvement_suggestions?: string | null
          income_amount?: string | null
          main_goal: string
          main_trainers?: string[] | null
          most_useful_skill: string
          nationality: string
          overall_rating: number
          partners_clients_count?: number | null
          phone: string
          plans_to_launch_company: boolean
          portfolio_link: string
          projected_income_12m?: string | null
          projected_income_3m?: string | null
          projected_income_6m?: string | null
          recommendation_reason?: string | null
          skill_needs_improvement: string
          submitted_all_projects: boolean
          trainer_ratings?: Json | null
          updated_at?: string
          vision_3_years: string
          wants_certificate: boolean
          would_recommend: boolean
        }
        Update: {
          additional_resources?: string | null
          attendance_mode?: string | null
          attended_all_sessions?: boolean
          certificate_email?: string
          certificate_name?: string
          city?: string | null
          cohort?: string
          company_name?: string | null
          company_sector?: string | null
          completed_projects?: string[] | null
          concrete_builds?: string
          country?: string | null
          created_at?: string
          current_address?: string
          current_occupation?: string
          date_of_birth?: string
          declaration_accepted?: boolean
          education_level?: string
          email?: string
          full_name?: string
          gender?: string
          generated_income?: boolean
          has_partners_clients?: boolean
          id?: string
          improvement_suggestions?: string | null
          income_amount?: string | null
          main_goal?: string
          main_trainers?: string[] | null
          most_useful_skill?: string
          nationality?: string
          overall_rating?: number
          partners_clients_count?: number | null
          phone?: string
          plans_to_launch_company?: boolean
          portfolio_link?: string
          projected_income_12m?: string | null
          projected_income_3m?: string | null
          projected_income_6m?: string | null
          recommendation_reason?: string | null
          skill_needs_improvement?: string
          submitted_all_projects?: boolean
          trainer_ratings?: Json | null
          updated_at?: string
          vision_3_years?: string
          wants_certificate?: boolean
          would_recommend?: boolean
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
      fcm_tokens: {
        Row: {
          created_at: string | null
          device_info: Json | null
          id: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_info?: Json | null
          id?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      formation_evaluation: {
        Row: {
          amelioration: string | null
          appreciation: string | null
          autres_besoins: string | null
          autres_sites: string | null
          besoins: string[]
          competences: string[]
          created_at: string
          date_naissance: string
          date_soumission: string
          email: string
          github: string
          id: string
          liens_ecommerce: string | null
          liens_mvp: string | null
          nom_complet: string
          note_assistant: number
          note_formateur: number
          note_globale: number
          participation_confirmee: boolean
          portfolio: string
          projets_preferes: string[]
          recommandation: boolean
          updated_at: string
          vague: string
          whatsapp: string
        }
        Insert: {
          amelioration?: string | null
          appreciation?: string | null
          autres_besoins?: string | null
          autres_sites?: string | null
          besoins?: string[]
          competences?: string[]
          created_at?: string
          date_naissance: string
          date_soumission?: string
          email: string
          github: string
          id?: string
          liens_ecommerce?: string | null
          liens_mvp?: string | null
          nom_complet: string
          note_assistant: number
          note_formateur: number
          note_globale: number
          participation_confirmee?: boolean
          portfolio: string
          projets_preferes?: string[]
          recommandation: boolean
          updated_at?: string
          vague: string
          whatsapp: string
        }
        Update: {
          amelioration?: string | null
          appreciation?: string | null
          autres_besoins?: string | null
          autres_sites?: string | null
          besoins?: string[]
          competences?: string[]
          created_at?: string
          date_naissance?: string
          date_soumission?: string
          email?: string
          github?: string
          id?: string
          liens_ecommerce?: string | null
          liens_mvp?: string | null
          nom_complet?: string
          note_assistant?: number
          note_formateur?: number
          note_globale?: number
          participation_confirmee?: boolean
          portfolio?: string
          projets_preferes?: string[]
          recommandation?: boolean
          updated_at?: string
          vague?: string
          whatsapp?: string
        }
        Relationships: []
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
      job_postings: {
        Row: {
          company_name: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_active: boolean
          job_type: string | null
          location: string | null
          posted_by: string
          title: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location?: string | null
          posted_by: string
          title: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          job_type?: string | null
          location?: string | null
          posted_by?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
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
          allow_resubmit: boolean | null
          code: string
          created_at: string
          deadline_at: string | null
          description: string | null
          due_at: string | null
          id: number
          image_url: string | null
          is_active: boolean
          max_resubmits: number | null
          title: string
        }
        Insert: {
          allow_resubmit?: boolean | null
          code: string
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          max_resubmits?: number | null
          title: string
        }
        Update: {
          allow_resubmit?: boolean | null
          code?: string
          created_at?: string
          deadline_at?: string | null
          description?: string | null
          due_at?: string | null
          id?: number
          image_url?: string | null
          is_active?: boolean
          max_resubmits?: number | null
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
      saved_docs: {
        Row: {
          content: string | null
          created_at: string | null
          format: string | null
          history_id: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          format?: string | null
          history_id?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          format?: string | null
          history_id?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sensitive_data_access_logs: {
        Row: {
          access_reason: string | null
          accessed_fields: string[] | null
          action: string
          created_at: string
          id: string
          ip_address: unknown
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_reason?: string | null
          accessed_fields?: string[] | null
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_reason?: string | null
          accessed_fields?: string[] | null
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session3: {
        Row: {
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          motivation: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          motivation: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          motivation?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      siteviraldomains: {
        Row: {
          created_at: string
          description_activite: string
          email: string
          id: string
          nom: string
          sous_domaine: string
          telephone: string
        }
        Insert: {
          created_at?: string
          description_activite: string
          email: string
          id?: string
          nom: string
          sous_domaine: string
          telephone: string
        }
        Update: {
          created_at?: string
          description_activite?: string
          email?: string
          id?: string
          nom?: string
          sous_domaine?: string
          telephone?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_profile: string | null
          id: string
          is_active: boolean
          phone: string | null
          primary_class_id: number | null
          status: string
          telegram: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_profile?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          primary_class_id?: number | null
          status?: string
          telegram?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_profile?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          primary_class_id?: number | null
          status?: string
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
          feedback: string | null
          file1_url: string | null
          file2_url: string | null
          file3_url: string | null
          grade: number | null
          id: number
          is_latest: boolean | null
          link1: string | null
          link2: string | null
          link3: string | null
          locked_at: string | null
          project_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at: string
          updated_at: string
          version: number | null
        }
        Insert: {
          class_id: number
          description?: string | null
          feedback?: string | null
          file1_url?: string | null
          file2_url?: string | null
          file3_url?: string | null
          grade?: number | null
          id?: number
          is_latest?: boolean | null
          link1?: string | null
          link2?: string | null
          link3?: string | null
          locked_at?: string | null
          project_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id: string
          submitted_at?: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          class_id?: number
          description?: string | null
          feedback?: string | null
          file1_url?: string | null
          file2_url?: string | null
          file3_url?: string | null
          grade?: number | null
          id?: number
          is_latest?: boolean | null
          link1?: string | null
          link2?: string | null
          link3?: string | null
          locked_at?: string | null
          project_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          student_id?: string
          submitted_at?: string
          updated_at?: string
          version?: number | null
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
      submito_organization_users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_owner: boolean | null
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_owner?: boolean | null
          organization_id: string
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_owner?: boolean | null
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submito_organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "submito_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      submito_organizations: {
        Row: {
          banner_url: string | null
          country: string | null
          created_at: string | null
          description: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          slug: string
          staff_size: string | null
          subdomain: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          banner_url?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          slug: string
          staff_size?: string | null
          subdomain?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          banner_url?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          slug?: string
          staff_size?: string | null
          subdomain?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
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
      supervisor_class_assignments: {
        Row: {
          class_id: number
          id: number
          supervisor_user_id: string
        }
        Insert: {
          class_id: number
          id?: number
          supervisor_user_id: string
        }
        Update: {
          class_id?: number
          id?: number
          supervisor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervisor_class_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      supervisors: {
        Row: {
          created_at: string | null
          full_name: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trash: {
        Row: {
          deleted_at: string | null
          expires_at: string | null
          id: string
          item_data: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          item_data: Json
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          expires_at?: string | null
          id?: string
          item_data?: Json
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      unified_registrations: {
        Row: {
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
          optional_fees_acknowledgment: boolean
          profession: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
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
          optional_fees_acknowledgment?: boolean
          profession?: string | null
          status: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
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
          optional_fees_acknowledgment?: boolean
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
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      vac25: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_full_training_form: {
        Args: { access_reason: string; form_id: string }
        Returns: {
          additional_resources: string | null
          attendance_mode: string | null
          attended_all_sessions: boolean
          certificate_email: string
          certificate_name: string
          city: string | null
          cohort: string
          company_name: string | null
          company_sector: string | null
          completed_projects: string[] | null
          concrete_builds: string
          country: string | null
          created_at: string
          current_address: string
          current_occupation: string
          date_of_birth: string
          declaration_accepted: boolean
          education_level: string
          email: string
          full_name: string
          gender: string
          generated_income: boolean
          has_partners_clients: boolean
          id: string
          improvement_suggestions: string | null
          income_amount: string | null
          main_goal: string
          main_trainers: string[] | null
          most_useful_skill: string
          nationality: string
          overall_rating: number
          partners_clients_count: number | null
          phone: string
          plans_to_launch_company: boolean
          portfolio_link: string
          projected_income_12m: string | null
          projected_income_3m: string | null
          projected_income_6m: string | null
          recommendation_reason: string | null
          skill_needs_improvement: string
          submitted_all_projects: boolean
          trainer_ratings: Json | null
          updated_at: string
          vision_3_years: string
          wants_certificate: boolean
          would_recommend: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "end_of_training_forms"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_masked_training_forms: {
        Args: never
        Returns: {
          additional_resources: string
          attendance_mode: string
          attended_all_sessions: boolean
          city_masked: string
          cohort: string
          concrete_builds: string
          country: string
          created_at: string
          current_occupation: string
          date_of_birth: string
          declaration_accepted: boolean
          education_level: string
          email_masked: string
          full_name_masked: string
          gender: string
          generated_income: boolean
          id: string
          improvement_suggestions: string
          main_goal: string
          most_useful_skill: string
          nationality: string
          overall_rating: number
          phone_masked: string
          plans_to_launch_company: boolean
          recommendation_reason: string
          skill_needs_improvement: string
          submitted_all_projects: boolean
          updated_at: string
          vision_3_years: string
          wants_certificate: boolean
          would_recommend: boolean
        }[]
      }
      get_training_forms_stats: {
        Args: { access_reason: string; date_from?: string; date_to?: string }
        Returns: Json
      }
      is_academy: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: { uid?: string }; Returns: boolean }
      is_supervisor: { Args: never; Returns: boolean }
      log_sensitive_data_access: {
        Args: {
          p_access_reason?: string
          p_accessed_fields?: string[]
          p_action: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      mask_sensitive_data: {
        Args: { mask_type?: string; original_value: string }
        Returns: string
      }
    }
    Enums: {
      submission_status:
        | "Reçu"
        | "En révision"
        | "Validé"
        | "Refusé"
        | "received"
        | "in_review"
        | "approved"
        | "rejected"
      user_role: "admin" | "user" | "supervisor" | "academy"
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
      submission_status: [
        "Reçu",
        "En révision",
        "Validé",
        "Refusé",
        "received",
        "in_review",
        "approved",
        "rejected",
      ],
      user_role: ["admin", "user", "supervisor", "academy"],
    },
  },
} as const
