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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          id: number
          metadata: Json
          target_id: string | null
          target_table: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          target_id?: string | null
          target_table: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          id?: never
          metadata?: Json
          target_id?: string | null
          target_table?: string
        }
        Relationships: []
      }
      brain_challenge_answer_keys: {
        Row: {
          correct_option_ids: string[]
          question_id: string
        }
        Insert: {
          correct_option_ids: string[]
          question_id: string
        }
        Update: {
          correct_option_ids?: string[]
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_challenge_answer_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "brain_challenge_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_challenge_attempt_answers: {
        Row: {
          attempt_id: string
          awarded_points: number
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option_ids: string[]
        }
        Insert: {
          attempt_id: string
          awarded_points?: number
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_option_ids?: string[]
        }
        Update: {
          attempt_id?: string
          awarded_points?: number
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "brain_challenge_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "brain_challenge_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_challenge_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "brain_challenge_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_challenge_attempts: {
        Row: {
          attempt_number: number
          challenge_id: string
          created_at: string
          elapsed_seconds: number | null
          id: string
          max_score: number | null
          percentage: number | null
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          attempt_number: number
          challenge_id: string
          created_at?: string
          elapsed_seconds?: number | null
          id?: string
          max_score?: number | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          attempt_number?: number
          challenge_id?: string
          created_at?: string
          elapsed_seconds?: number | null
          id?: string
          max_score?: number | null
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brain_challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "brain_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_challenge_questions: {
        Row: {
          challenge_id: string
          created_at: string
          explanation: string
          id: string
          options: Json
          points: number
          prompt: string
          sort_order: number
        }
        Insert: {
          challenge_id: string
          created_at?: string
          explanation?: string
          id?: string
          options: Json
          points?: number
          prompt: string
          sort_order: number
        }
        Update: {
          challenge_id?: string
          created_at?: string
          explanation?: string
          id?: string
          options?: Json
          points?: number
          prompt?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "brain_challenge_questions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "brain_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_challenges: {
        Row: {
          category: string
          created_at: string
          difficulty: string
          duration_seconds: number
          id: string
          instructions: string
          is_published: boolean
          max_attempts: number | null
          slug: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          difficulty?: string
          duration_seconds: number
          id?: string
          instructions?: string
          is_published?: boolean
          max_attempts?: number | null
          slug: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          difficulty?: string
          duration_seconds?: number
          id?: string
          instructions?: string
          is_published?: boolean
          max_attempts?: number | null
          slug?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      course_sections: {
        Row: {
          course_version_id: string
          created_at: string
          description: string
          id: string
          sort_order: number
          title: string
        }
        Insert: {
          course_version_id: string
          created_at?: string
          description?: string
          id?: string
          sort_order: number
          title: string
        }
        Update: {
          course_version_id?: string
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sections_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_versions: {
        Row: {
          change_summary: string
          course_id: string
          created_at: string
          created_by: string | null
          description: string
          duration_minutes: number
          id: string
          outcomes: string[]
          prerequisites: string[]
          review_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          subtitle: string
          target_audience: string[]
          title: string
          version_number: number
        }
        Insert: {
          change_summary?: string
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          outcomes?: string[]
          prerequisites?: string[]
          review_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          subtitle?: string
          target_audience?: string[]
          title: string
          version_number: number
        }
        Update: {
          change_summary?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          duration_minutes?: number
          id?: string
          outcomes?: string[]
          prerequisites?: string[]
          review_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          subtitle?: string
          target_audience?: string[]
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_versions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          id: string
          language_code: string
          level: Database["public"]["Enums"]["course_level"]
          price_minor: number
          published_at: string | null
          published_version_id: string | null
          slug: string
          status: Database["public"]["Enums"]["course_status"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          language_code?: string
          level?: Database["public"]["Enums"]["course_level"]
          price_minor?: number
          published_at?: string | null
          published_version_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          language_code?: string
          level?: Database["public"]["Enums"]["course_level"]
          price_minor?: number
          published_at?: string | null
          published_version_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courses_published_version_fk"
            columns: ["published_version_id", "id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id", "course_id"]
          },
        ]
      }
      enrollments: {
        Row: {
          amount_minor: number
          completed_at: string | null
          course_id: string
          course_version_id: string
          currency: string
          enrolled_at: string
          id: string
          payment_id: string | null
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          amount_minor: number
          completed_at?: string | null
          course_id: string
          course_version_id: string
          currency: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          amount_minor?: number
          completed_at?: string | null
          course_id?: string
          course_version_id?: string
          currency?: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_version_id_course_id_fkey"
            columns: ["course_version_id", "course_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id", "course_id"]
          },
          {
            foreignKeyName: "enrollments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_library_progress: {
        Row: {
          completed_at: string
          created_at: string
          learning_path_slug: string
          lesson_number: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          learning_path_slug: string
          lesson_number: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          learning_path_slug?: string
          lesson_number?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          is_completed: boolean
          last_position_seconds: number
          lesson_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number
          lesson_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          is_completed?: boolean
          last_position_seconds?: number
          lesson_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          body_markdown: string
          created_at: string
          duration_seconds: number
          id: string
          is_preview: boolean
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          media_provider: string | null
          media_reference: string | null
          section_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          is_preview?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          media_provider?: string | null
          media_reference?: string | null
          section_id: string
          sort_order: number
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          is_preview?: boolean
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          media_provider?: string | null
          media_reference?: string | null
          section_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "course_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          event_key: string
          event_type: string
          failure_code: string | null
          id: string
          payload_sha256: string
          processed_at: string | null
          processing_status: string
          provider: string
          provider_reference: string | null
          received_at: string
        }
        Insert: {
          event_key: string
          event_type: string
          failure_code?: string | null
          id?: string
          payload_sha256: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_reference?: string | null
          received_at?: string
        }
        Update: {
          event_key?: string
          event_type?: string
          failure_code?: string | null
          id?: string
          payload_sha256?: string
          processed_at?: string | null
          processing_status?: string
          provider?: string
          provider_reference?: string | null
          received_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_minor: number
          course_id: string
          course_version_id: string
          created_at: string
          currency: string
          expires_at: string
          id: string
          provider: string
          provider_channel: string | null
          provider_paid_at: string | null
          provider_reference: string
          provider_transaction_id: number | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount_minor: number
          course_id: string
          course_version_id: string
          created_at?: string
          currency: string
          expires_at?: string
          id?: string
          provider?: string
          provider_channel?: string | null
          provider_paid_at?: string | null
          provider_reference: string
          provider_transaction_id?: number | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount_minor?: number
          course_id?: string
          course_version_id?: string
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          provider?: string
          provider_channel?: string | null
          provider_paid_at?: string | null
          provider_reference?: string
          provider_transaction_id?: number | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_course_version_course_fk"
            columns: ["course_version_id", "course_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id", "course_id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          display_name: string
          id: string
          locale: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          display_name?: string
          id?: string
          locale?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_answer_keys: {
        Row: {
          correct_option_ids: string[]
          question_id: string
          updated_at: string
        }
        Insert: {
          correct_option_ids: string[]
          question_id: string
          updated_at?: string
        }
        Update: {
          correct_option_ids?: string[]
          question_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answer_keys_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: true
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempt_answers: {
        Row: {
          attempt_id: string
          awarded_points: number | null
          created_at: string
          feedback: string | null
          id: string
          question_id: string
          quiz_id: string
          response: Json
        }
        Insert: {
          attempt_id: string
          awarded_points?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          question_id: string
          quiz_id: string
          response: Json
        }
        Update: {
          attempt_id?: string
          awarded_points?: number | null
          created_at?: string
          feedback?: string | null
          id?: string
          question_id?: string
          quiz_id?: string
          response?: Json
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_attempt_quiz_fk"
            columns: ["attempt_id", "quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id", "quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempt_answers_question_quiz_fk"
            columns: ["question_id", "quiz_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id", "quiz_id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          attempt_number: number
          course_version_id: string
          created_at: string
          enrollment_id: string
          graded_at: string | null
          id: string
          max_score: number | null
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_number: number
          course_version_id: string
          created_at?: string
          enrollment_id: string
          graded_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          course_version_id?: string
          created_at?: string
          enrollment_id?: string
          graded_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_enrollment_user_fk"
            columns: ["enrollment_id", "user_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id", "user_id"]
          },
          {
            foreignKeyName: "quiz_attempts_enrollment_version_fk"
            columns: ["enrollment_id", "course_version_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id", "course_version_id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_version_fk"
            columns: ["quiz_id", "course_version_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id", "course_version_id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          created_at: string
          id: string
          options: Json
          points: number
          prompt: string
          question_type: string
          quiz_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          options: Json
          points?: number
          prompt: string
          question_type: string
          quiz_id: string
          sort_order: number
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          points?: number
          prompt?: string
          question_type?: string
          quiz_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_version_id: string
          created_at: string
          created_by: string | null
          id: string
          instructions: string
          is_published: boolean
          locked_at: string | null
          max_attempts: number | null
          pass_mark: number
          time_limit_seconds: number | null
          title: string
          updated_at: string
        }
        Insert: {
          course_version_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string
          is_published?: boolean
          locked_at?: string | null
          max_attempts?: number | null
          pass_mark?: number
          time_limit_seconds?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          course_version_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          instructions?: string
          is_published?: boolean
          locked_at?: string | null
          max_attempts?: number | null
          pass_mark?: number
          time_limit_seconds?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_version_id_fkey"
            columns: ["course_version_id"]
            isOneToOne: false
            referencedRelation: "course_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fulfill_verified_paystack_payment: {
        Args: {
          p_provider_channel: string
          p_provider_paid_at: string
          p_reference: string
          p_transaction_id: number
          p_verified_amount: number
          p_verified_currency: string
        }
        Returns: string
      }
      start_brain_challenge_attempt: {
        Args: { p_challenge_id: string; p_user_id: string }
        Returns: string
      }
      start_quiz_attempt: {
        Args: { p_enrollment_id: string; p_quiz_id: string; p_user_id: string }
        Returns: string
      }
      submit_brain_challenge_attempt: {
        Args: { p_answers: Json; p_attempt_id: string; p_user_id: string }
        Returns: Json
      }
      submit_quiz_attempt: {
        Args: {
          p_answers: Json
          p_attempt_id: string
          p_max_score: number
          p_score: number
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "content_manager" | "support"
      course_level: "beginner" | "intermediate" | "advanced" | "all_levels"
      course_status: "draft" | "in_review" | "published" | "archived"
      enrollment_status: "active" | "completed" | "cancelled" | "refunded"
      lesson_type: "text" | "video" | "audio" | "external"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "content_manager", "support"],
      course_level: ["beginner", "intermediate", "advanced", "all_levels"],
      course_status: ["draft", "in_review", "published", "archived"],
      enrollment_status: ["active", "completed", "cancelled", "refunded"],
      lesson_type: ["text", "video", "audio", "external"],
    },
  },
} as const
