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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          cancellation_reason: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          scheduled_deletion_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          scheduled_deletion_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_2fa: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_used_at: string | null
          secret: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          secret?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_used_at?: string | null
          secret?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          accessed_route: string
          admin_id: string
          admin_type: Database["public"]["Enums"]["admin_type"] | null
          created_at: string | null
          id: string
          ip_address: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          accessed_route: string
          admin_id: string
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accessed_route?: string
          admin_id?: string
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_devices: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          id: string
          ip_address: string | null
          is_trusted: boolean | null
          last_login_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_login_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          id?: string
          ip_address?: string | null
          is_trusted?: boolean | null
          last_login_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      backup_files: {
        Row: {
          created_at: string
          created_by: string
          downloaded_at: string | null
          downloaded_count: number | null
          errors: Json | null
          expires_at: string | null
          file_path: string
          file_size: number
          filename: string
          id: string
          include_storage: boolean | null
          manifest: Json | null
          records_count: number
          status: string
          storage_files_count: number | null
          storage_size_bytes: number | null
          tables_count: number
        }
        Insert: {
          created_at?: string
          created_by: string
          downloaded_at?: string | null
          downloaded_count?: number | null
          errors?: Json | null
          expires_at?: string | null
          file_path: string
          file_size?: number
          filename: string
          id?: string
          include_storage?: boolean | null
          manifest?: Json | null
          records_count?: number
          status?: string
          storage_files_count?: number | null
          storage_size_bytes?: number | null
          tables_count?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          downloaded_at?: string | null
          downloaded_count?: number | null
          errors?: Json | null
          expires_at?: string | null
          file_path?: string
          file_size?: number
          filename?: string
          id?: string
          include_storage?: boolean | null
          manifest?: Json | null
          records_count?: number
          status?: string
          storage_files_count?: number | null
          storage_size_bytes?: number | null
          tables_count?: number
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          criteria: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean | null
          is_manual: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          criteria: string
          description: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_manual?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          criteria?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_manual?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_reconciliation: {
        Row: {
          bank_data: Json | null
          bank_received_amount: number | null
          bank_transaction_count: number | null
          created_at: string
          divergence_amount: number | null
          divergence_reason: string | null
          id: string
          reconciliation_date: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          stripe_data: Json | null
          stripe_expected_amount: number
          stripe_transaction_count: number
          updated_at: string
        }
        Insert: {
          bank_data?: Json | null
          bank_received_amount?: number | null
          bank_transaction_count?: number | null
          created_at?: string
          divergence_amount?: number | null
          divergence_reason?: string | null
          id?: string
          reconciliation_date: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          stripe_data?: Json | null
          stripe_expected_amount: number
          stripe_transaction_count: number
          updated_at?: string
        }
        Update: {
          bank_data?: Json | null
          bank_received_amount?: number | null
          bank_transaction_count?: number | null
          created_at?: string
          divergence_amount?: number | null
          divergence_reason?: string | null
          id?: string
          reconciliation_date?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          stripe_data?: Json | null
          stripe_expected_amount?: number
          stripe_transaction_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          name: string
          order_index: number | null
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          order_index?: number | null
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          order_index?: number | null
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_images: {
        Row: {
          alt_text: string | null
          created_at: string
          file_size: number | null
          height: number | null
          id: string
          mime_type: string | null
          post_id: string | null
          title: string | null
          uploaded_by: string
          url: string
          width: number | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id?: string | null
          title?: string | null
          uploaded_by: string
          url: string
          width?: number | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_size?: number | null
          height?: number | null
          id?: string
          mime_type?: string | null
          post_id?: string | null
          title?: string | null
          uploaded_by?: string
          url?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_images_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_post_versions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          post_id: string
          title: string
          version_number: number
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          post_id: string
          title: string
          version_number: number
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          post_id?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_versions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          canonical_url: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_alt: string | null
          featured_image_url: string | null
          focus_keyword: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          og_description: string | null
          og_image_url: string | null
          og_title: string | null
          published_at: string | null
          readability_score: number | null
          reading_time_minutes: number | null
          scheduled_at: string | null
          seo_score: number | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          twitter_description: string | null
          twitter_image_url: string | null
          twitter_title: string | null
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          canonical_url?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          readability_score?: number | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          seo_score?: number | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          canonical_url?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_alt?: string | null
          featured_image_url?: string | null
          focus_keyword?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          og_description?: string | null
          og_image_url?: string | null
          og_title?: string | null
          published_at?: string | null
          readability_score?: number | null
          reading_time_minutes?: number | null
          scheduled_at?: string | null
          seo_score?: number | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          twitter_description?: string | null
          twitter_image_url?: string | null
          twitter_title?: string | null
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      blog_snippets: {
        Row: {
          category: string | null
          content: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      creator_consent_records: {
        Row: {
          accepted_at: string
          consent_text: string
          consent_version: string
          created_at: string
          id: string
          ip_address: string | null
          project_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          consent_text: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          project_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          consent_text?: string
          consent_version?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          project_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_consent_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "creator_consent_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_payouts: {
        Row: {
          amount: number
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          project_id: string | null
          status: string | null
          stripe_payout_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          project_id?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          project_id?: string | null
          status?: string | null
          stripe_payout_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "creator_payouts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_scores: {
        Row: {
          accountability_points: number | null
          behavior_points: number | null
          created_at: string | null
          delivery_quality_points: number | null
          engagement_points: number | null
          id: string
          last_calculated_at: string | null
          level: number
          platform_time_points: number | null
          points: number
          reports_points: number | null
          success_history_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accountability_points?: number | null
          behavior_points?: number | null
          created_at?: string | null
          delivery_quality_points?: number | null
          engagement_points?: number | null
          id?: string
          last_calculated_at?: string | null
          level?: number
          platform_time_points?: number | null
          points?: number
          reports_points?: number | null
          success_history_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accountability_points?: number | null
          behavior_points?: number | null
          created_at?: string | null
          delivery_quality_points?: number | null
          engagement_points?: number | null
          id?: string
          last_calculated_at?: string | null
          level?: number
          platform_time_points?: number | null
          points?: number
          reports_points?: number | null
          success_history_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_processing_registry: {
        Row: {
          created_at: string | null
          data_categories: string[]
          data_subjects: string
          id: string
          international_transfers: boolean | null
          legal_basis: string
          operators: string[] | null
          processing_purpose: string
          retention_period: string
          security_measures: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data_categories: string[]
          data_subjects: string
          id?: string
          international_transfers?: boolean | null
          legal_basis: string
          operators?: string[] | null
          processing_purpose: string
          retention_period: string
          security_measures?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data_categories?: string[]
          data_subjects?: string
          id?: string
          international_transfers?: boolean | null
          legal_basis?: string
          operators?: string[] | null
          processing_purpose?: string
          retention_period?: string
          security_measures?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      financial_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          read_at: string | null
          read_by: string | null
          related_id: string | null
          related_type: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          related_id?: string | null
          related_type?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          read_by?: string | null
          related_id?: string | null
          related_type?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      financial_ledger: {
        Row: {
          contribution_id: string | null
          created_at: string
          creator_id: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          financial_status: string
          grace_period_ends_at: string | null
          gross_amount: number
          id: string
          is_deleted: boolean | null
          net_amount_creator: number
          net_amount_platform: number
          payment_method: string
          platform_fee_amount: number
          platform_fee_percentage: number
          project_id: string | null
          released_at: string | null
          stripe_fee_fixed: number
          stripe_fee_percentage: number
          stripe_fee_total: number
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          supporter_id: string
          token_amount: number
          withdrawal_id: string | null
        }
        Insert: {
          contribution_id?: string | null
          created_at?: string
          creator_id: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          financial_status?: string
          grace_period_ends_at?: string | null
          gross_amount: number
          id?: string
          is_deleted?: boolean | null
          net_amount_creator: number
          net_amount_platform: number
          payment_method: string
          platform_fee_amount: number
          platform_fee_percentage: number
          project_id?: string | null
          released_at?: string | null
          stripe_fee_fixed?: number
          stripe_fee_percentage?: number
          stripe_fee_total: number
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supporter_id: string
          token_amount: number
          withdrawal_id?: string | null
        }
        Update: {
          contribution_id?: string | null
          created_at?: string
          creator_id?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          financial_status?: string
          grace_period_ends_at?: string | null
          gross_amount?: number
          id?: string
          is_deleted?: boolean | null
          net_amount_creator?: number
          net_amount_platform?: number
          payment_method?: string
          platform_fee_amount?: number
          platform_fee_percentage?: number
          project_id?: string | null
          released_at?: string | null
          stripe_fee_fixed?: number
          stripe_fee_percentage?: number
          stripe_fee_total?: number
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          supporter_id?: string
          token_amount?: number
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_ledger_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "project_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "financial_ledger_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "admin_withdrawals_with_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_ledger_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      google_analytics_settings: {
        Row: {
          gtag_script: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          gtag_script?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          gtag_script?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ledger_audit_log: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          ledger_id: string
          new_data: Json | null
          performed_at: string
          performed_by: string
          previous_data: Json | null
          reason: string
          two_factor_verified: boolean
          user_agent: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          ledger_id: string
          new_data?: Json | null
          performed_at?: string
          performed_by: string
          previous_data?: Json | null
          reason: string
          two_factor_verified?: boolean
          user_agent?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          ledger_id?: string
          new_data?: Json | null
          performed_at?: string
          performed_by?: string
          previous_data?: Json | null
          reason?: string
          two_factor_verified?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      ledger_movements: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string
          description: string | null
          from_entity: string | null
          id: string
          ledger_id: string | null
          metadata: Json | null
          movement_type: string
          reference_id: string | null
          reference_type: string | null
          to_entity: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          from_entity?: string | null
          id?: string
          ledger_id?: string | null
          metadata?: Json | null
          movement_type: string
          reference_id?: string | null
          reference_type?: string | null
          to_entity?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string
          description?: string | null
          from_entity?: string | null
          id?: string
          ledger_id?: string | null
          metadata?: Json | null
          movement_type?: string
          reference_id?: string | null
          reference_type?: string | null
          to_entity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_movements_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
        ]
      }
      mailgun_sync_log: {
        Row: {
          action: string
          created_at: string | null
          email: string
          error_message: string | null
          full_name: string | null
          id: string
          list_id: string
          mailgun_response: Json | null
          status: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          email: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          list_id: string
          mailgun_response?: Json | null
          status: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          email?: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          list_id?: string
          mailgun_response?: Json | null
          status?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      moderator_permissions: {
        Row: {
          can_manage_users: boolean | null
          can_review_projects: boolean | null
          can_view_analytics: boolean | null
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_manage_users?: boolean | null
          can_review_projects?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_manage_users?: boolean | null
          can_review_projects?: boolean | null
          can_view_analytics?: boolean | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bairro: string | null
          celular: string
          cep: string | null
          cidade: string | null
          complemento: string | null
          cpf: string
          created_at: string
          data_nascimento: string
          email: string
          endereco: string | null
          estado: string | null
          has_completed_tour: boolean | null
          id: string
          is_identity_verified: boolean | null
          mailgun_list_ids: string[] | null
          mailgun_synced: boolean | null
          nome: string
          numero: string | null
          sobrenome: string
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_complete: boolean | null
          updated_at: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bairro?: string | null
          celular: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf: string
          created_at?: string
          data_nascimento: string
          email: string
          endereco?: string | null
          estado?: string | null
          has_completed_tour?: boolean | null
          id: string
          is_identity_verified?: boolean | null
          mailgun_list_ids?: string[] | null
          mailgun_synced?: boolean | null
          nome: string
          numero?: string | null
          sobrenome: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bairro?: string | null
          celular?: string
          cep?: string | null
          cidade?: string | null
          complemento?: string | null
          cpf?: string
          created_at?: string
          data_nascimento?: string
          email?: string
          endereco?: string | null
          estado?: string | null
          has_completed_tour?: boolean | null
          id?: string
          is_identity_verified?: boolean | null
          mailgun_list_ids?: string[] | null
          mailgun_synced?: boolean | null
          nome?: string
          numero?: string | null
          sobrenome?: string
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          updated_at?: string
          user_type?: string | null
        }
        Relationships: []
      }
      project_badges: {
        Row: {
          badge_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          project_id: string
        }
        Insert: {
          badge_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id: string
        }
        Update: {
          badge_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_badges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_badges_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          comment_type: string
          content: string
          created_at: string | null
          hidden_at: string | null
          hidden_by: string | null
          id: string
          is_hidden: boolean | null
          is_reported: boolean | null
          parent_comment_id: string | null
          project_id: string
          reported_at: string | null
          reported_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comment_type: string
          content: string
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean | null
          is_reported?: boolean | null
          parent_comment_id?: string | null
          project_id: string
          reported_at?: string | null
          reported_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comment_type?: string
          content?: string
          created_at?: string | null
          hidden_at?: string | null
          hidden_by?: string | null
          id?: string
          is_hidden?: boolean | null
          is_reported?: boolean | null
          parent_comment_id?: string | null
          project_id?: string
          reported_at?: string | null
          reported_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contributions: {
        Row: {
          amount: number
          created_at: string
          id: string
          project_id: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          project_id: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          project_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_contributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_gallery: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          order_index: number | null
          project_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          order_index?: number | null
          project_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_gallery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_gallery_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_featured: boolean
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_featured?: boolean
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_featured?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_rejection_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          project_id: string
          sender_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          project_id: string
          sender_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          project_id?: string
          sender_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_rejection_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_rejection_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_reports: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          project_id: string
          reason: string
          reported_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          project_id: string
          reason: string
          reported_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          project_id?: string
          reason?: string
          reported_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_reports_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_update_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          order_index: number
          update_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          order_index?: number
          update_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          order_index?: number
          update_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_update_images_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "project_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_update_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: Database["public"]["Enums"]["update_reaction_type"]
          update_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: Database["public"]["Enums"]["update_reaction_type"]
          update_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: Database["public"]["Enums"]["update_reaction_type"]
          update_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_update_reactions_update_id_fkey"
            columns: ["update_id"]
            isOneToOne: false
            referencedRelation: "project_updates"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_exclusive: boolean
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_exclusive?: boolean
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_exclusive?: boolean
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          accountability_approved: boolean | null
          accountability_images: string[] | null
          accountability_report: string | null
          accountability_submitted_at: string | null
          admin_fee_percentage: number | null
          admin_notes: string | null
          backers_count: number
          bairro: string | null
          can_create_new_project: boolean | null
          category: string
          cidade: string | null
          complemento: string | null
          created_at: string
          custom_goal: number | null
          deadline: string | null
          description: string
          description_edit_count: number | null
          description_edited_at: string | null
          endereco: string | null
          estado: string | null
          goal: number
          google_tag_id: string | null
          id: string
          meta_pixel_id: string | null
          numero: string | null
          pending_requirements: string | null
          platform_fee_percentage: number | null
          project_type: string
          raised_amount: number
          rejection_chat_active: boolean | null
          rejection_chat_closed_at: string | null
          rejection_chat_closed_by: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          short_id: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
          youtube_url: string
        }
        Insert: {
          accountability_approved?: boolean | null
          accountability_images?: string[] | null
          accountability_report?: string | null
          accountability_submitted_at?: string | null
          admin_fee_percentage?: number | null
          admin_notes?: string | null
          backers_count?: number
          bairro?: string | null
          can_create_new_project?: boolean | null
          category: string
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          custom_goal?: number | null
          deadline?: string | null
          description: string
          description_edit_count?: number | null
          description_edited_at?: string | null
          endereco?: string | null
          estado?: string | null
          goal: number
          google_tag_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          numero?: string | null
          pending_requirements?: string | null
          platform_fee_percentage?: number | null
          project_type?: string
          raised_amount?: number
          rejection_chat_active?: boolean | null
          rejection_chat_closed_at?: string | null
          rejection_chat_closed_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_id?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          youtube_url: string
        }
        Update: {
          accountability_approved?: boolean | null
          accountability_images?: string[] | null
          accountability_report?: string | null
          accountability_submitted_at?: string | null
          admin_fee_percentage?: number | null
          admin_notes?: string | null
          backers_count?: number
          bairro?: string | null
          can_create_new_project?: boolean | null
          category?: string
          cidade?: string | null
          complemento?: string | null
          created_at?: string
          custom_goal?: number | null
          deadline?: string | null
          description?: string
          description_edit_count?: number | null
          description_edited_at?: string | null
          endereco?: string | null
          estado?: string | null
          goal?: number
          google_tag_id?: string | null
          id?: string
          meta_pixel_id?: string | null
          numero?: string | null
          pending_requirements?: string | null
          platform_fee_percentage?: number | null
          project_type?: string
          raised_amount?: number
          rejection_chat_active?: boolean | null
          rejection_chat_closed_at?: string | null
          rejection_chat_closed_by?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_id?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          youtube_url?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          analyzed_at: string | null
          analyzed_by: string | null
          bank_account_agency: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_cpf_cnpj: string | null
          bank_name: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          payment_method: string | null
          proof_of_payment_url: string | null
          reason: string
          rejection_reason: string | null
          requested_at: string | null
          status: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          analyzed_at?: string | null
          analyzed_by?: string | null
          bank_account_agency?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_cpf_cnpj?: string | null
          bank_name?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          proof_of_payment_url?: string | null
          reason: string
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          analyzed_at?: string | null
          analyzed_by?: string | null
          bank_account_agency?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_cpf_cnpj?: string | null
          bank_name?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          payment_method?: string | null
          proof_of_payment_url?: string | null
          reason?: string
          rejection_reason?: string | null
          requested_at?: string | null
          status?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          contribution_id: string | null
          created_at: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          project_id: string | null
          reason: string
          requested_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          contribution_id?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          reason: string
          requested_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          contribution_id?: string | null
          created_at?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string | null
          reason?: string
          requested_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_contribution_id_fkey"
            columns: ["contribution_id"]
            isOneToOne: false
            referencedRelation: "project_contributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "refunds_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_fee_config: {
        Row: {
          additional_percentage: number | null
          description: string | null
          disabled_reason: string | null
          fixed_fee: number
          id: string
          is_enabled: boolean
          payment_method: string
          percentage_fee: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          additional_percentage?: number | null
          description?: string | null
          disabled_reason?: string | null
          fixed_fee: number
          id?: string
          is_enabled?: boolean
          payment_method: string
          percentage_fee: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          additional_percentage?: number | null
          description?: string | null
          disabled_reason?: string | null
          fixed_fee?: number
          id?: string
          is_enabled?: boolean
          payment_method?: string
          percentage_fee?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      stripe_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          creator_amount: number
          id: string
          platform_fee: number
          project_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          creator_amount: number
          id?: string
          platform_fee: number
          project_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          creator_amount?: number
          id?: string
          platform_fee?: number
          project_id?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "stripe_payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      support_conversations: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          description: string | null
          first_response_at: string | null
          id: string
          rated_at: string | null
          rating: number | null
          rating_comment: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          rated_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          description?: string | null
          first_response_at?: string | null
          id?: string
          rated_at?: string | null
          rating?: number | null
          rating_comment?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: string[] | null
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Insert: {
          attachments?: string[] | null
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          sender_type: string
        }
        Update: {
          attachments?: string[] | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "support_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      token_purchases: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          pagarme_transaction_id: string | null
          payment_method: string
          payment_type: string | null
          price: number
          reminder_sent: boolean | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pagarme_transaction_id?: string | null
          payment_method: string
          payment_type?: string | null
          price: number
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pagarme_transaction_id?: string | null
          payment_method?: string
          payment_type?: string | null
          price?: number
          reminder_sent?: boolean | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description: string
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      transfer_receipts: {
        Row: {
          account_info: string | null
          bank_name: string | null
          id: string
          ledger_id: string | null
          notes: string | null
          receipt_filename: string | null
          receipt_url: string
          transfer_amount: number
          transfer_date: string
          uploaded_at: string
          uploaded_by: string
          validated_at: string | null
          validated_by: string | null
          withdrawal_id: string
        }
        Insert: {
          account_info?: string | null
          bank_name?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          receipt_filename?: string | null
          receipt_url: string
          transfer_amount: number
          transfer_date: string
          uploaded_at?: string
          uploaded_by: string
          validated_at?: string | null
          validated_by?: string | null
          withdrawal_id: string
        }
        Update: {
          account_info?: string | null
          bank_name?: string | null
          id?: string
          ledger_id?: string | null
          notes?: string | null
          receipt_filename?: string | null
          receipt_url?: string
          transfer_amount?: number
          transfer_date?: string
          uploaded_at?: string
          uploaded_by?: string
          validated_at?: string | null
          validated_by?: string | null
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_receipts_ledger_id_fkey"
            columns: ["ledger_id"]
            isOneToOne: false
            referencedRelation: "financial_ledger"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_receipts_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "admin_withdrawals_with_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfer_receipts_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          granted_at: string | null
          granted_by: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_consent_preferences: {
        Row: {
          analytics_tracking: boolean | null
          created_at: string | null
          id: string
          marketing_emails: boolean | null
          new_projects_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analytics_tracking?: boolean | null
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          new_projects_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analytics_tracking?: boolean | null
          created_at?: string | null
          id?: string
          marketing_emails?: boolean | null
          new_projects_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_type: Database["public"]["Enums"]["admin_type"] | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          admin_type?: Database["public"]["Enums"]["admin_type"] | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawal_messages: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
          sender_type: string
          updated_at: string | null
          withdrawal_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
          sender_type: string
          updated_at?: string | null
          withdrawal_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string | null
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_messages_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "admin_withdrawals_with_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_messages_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used_at: string | null
          user_id: string
          withdrawal_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used_at?: string | null
          user_id: string
          withdrawal_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
          withdrawal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_verification_codes_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "admin_withdrawals_with_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_verification_codes_withdrawal_id_fkey"
            columns: ["withdrawal_id"]
            isOneToOne: false
            referencedRelation: "withdrawals"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          admin_fee: number
          bank_account: Json
          chat_active: boolean | null
          chat_closed_at: string | null
          chat_closed_by: string | null
          created_at: string
          id: string
          minimum_bypass: boolean | null
          net_amount: number
          pagarme_recipient_id: string | null
          pagarme_transfer_id: string | null
          paid_at: string | null
          payment_method: string | null
          pix_key: string | null
          pix_key_type: string | null
          project_id: string
          rejection_reason: string | null
          requested_amount: number
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          transfer_error: string | null
          transfer_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_fee: number
          bank_account: Json
          chat_active?: boolean | null
          chat_closed_at?: string | null
          chat_closed_by?: string | null
          created_at?: string
          id?: string
          minimum_bypass?: boolean | null
          net_amount: number
          pagarme_recipient_id?: string | null
          pagarme_transfer_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          project_id: string
          rejection_reason?: string | null
          requested_amount: number
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_error?: string | null
          transfer_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_fee?: number
          bank_account?: Json
          chat_active?: boolean | null
          chat_closed_at?: string | null
          chat_closed_by?: string | null
          created_at?: string
          id?: string
          minimum_bypass?: boolean | null
          net_amount?: number
          pagarme_recipient_id?: string | null
          pagarme_transfer_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          project_id?: string
          rejection_reason?: string | null
          requested_amount?: number
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          transfer_error?: string | null
          transfer_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "withdrawals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_withdrawals_with_messages: {
        Row: {
          admin_fee: number | null
          bank_account: Json | null
          chat_active: boolean | null
          chat_closed_at: string | null
          chat_closed_by: string | null
          created_at: string | null
          id: string | null
          message: string | null
          message_created_at: string | null
          message_id: string | null
          minimum_bypass: boolean | null
          net_amount: number | null
          pagarme_recipient_id: string | null
          pagarme_transfer_id: string | null
          paid_at: string | null
          payment_method: string | null
          pix_key: string | null
          pix_key_type: string | null
          project_id: string | null
          rejection_reason: string | null
          requested_amount: number | null
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_id: string | null
          sender_type: string | null
          status: string | null
          transfer_error: string | null
          transfer_status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "withdrawals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_financial_summary: {
        Row: {
          amount_in_grace: number | null
          amount_pending_transfer: number | null
          amount_released: number | null
          amount_transferred: number | null
          creator_id: string | null
          creator_name: string | null
          goal: number | null
          goal_reached: boolean | null
          in_grace_period: number | null
          next_release_date: string | null
          project_id: string | null
          project_title: string | null
          raised_amount: number | null
          released: number | null
          total_gross: number | null
          total_net_creator: number | null
          total_platform_fees: number | null
          total_stripe_fees: number | null
          transfer_completed: number | null
          withdrawal_pending: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_raizscore_level: { Args: { p_points: number }; Returns: number }
      calculate_stripe_fee: {
        Args: { p_amount: number; p_payment_method: string }
        Returns: {
          fee_fixed: number
          fee_percentage: number
          fee_total: number
          net_amount: number
        }[]
      }
      call_mailgun_sync: {
        Args: {
          p_email: string
          p_full_name: string
          p_user_id: string
          p_user_type: string
        }
        Returns: undefined
      }
      count_unread_withdrawal_messages: {
        Args: { p_recipient_type: string; p_withdrawal_id: string }
        Returns: number
      }
      create_financial_alert: {
        Args: {
          p_alert_type: string
          p_message: string
          p_metadata?: Json
          p_related_id?: string
          p_related_type?: string
          p_severity?: string
          p_title: string
        }
        Returns: string
      }
      create_ledger_entry: {
        Args: {
          p_contribution_id: string
          p_creator_id: string
          p_gross_amount: number
          p_payment_method: string
          p_platform_fee_percentage: number
          p_project_id: string
          p_stripe_payment_intent_id?: string
          p_stripe_session_id?: string
          p_supporter_id: string
          p_token_amount: number
        }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_access: {
        Args: {
          p_accessed_route: string
          p_admin_id: string
          p_ip_address?: string
          p_session_id?: string
          p_user_agent?: string
        }
        Returns: string
      }
      log_admin_action: {
        Args: {
          p_action: string
          p_admin_id: string
          p_details?: Json
          p_ip_address?: string
          p_target_id?: string
          p_target_type: string
          p_user_agent?: string
        }
        Returns: string
      }
      recalculate_user_raizscore: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      release_grace_period_funds: { Args: never; Returns: number }
      soft_delete_ledger_entry: {
        Args: {
          p_ledger_id: string
          p_reason: string
          p_two_factor_verified?: boolean
        }
        Returns: boolean
      }
      validate_cpf: { Args: { cpf: string }; Returns: boolean }
    }
    Enums: {
      admin_type: "master" | "financial" | "operational" | "support"
      app_role: "admin" | "user" | "moderator"
      update_reaction_type: "loved" | "congrats" | "inspiring" | "full_support"
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
      admin_type: ["master", "financial", "operational", "support"],
      app_role: ["admin", "user", "moderator"],
      update_reaction_type: ["loved", "congrats", "inspiring", "full_support"],
    },
  },
} as const
