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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          contact_click_count: number
          content_html: string
          content_json: Json
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author?: string | null
          contact_click_count?: number
          content_html?: string
          content_json?: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author?: string | null
          contact_click_count?: number
          content_html?: string
          content_json?: Json
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      blog_post_daily_stats: {
        Row: {
          contact_clicks: number
          day: string
          post_id: string
          views: number
        }
        Insert: {
          contact_clicks?: number
          day?: string
          post_id: string
          views?: number
        }
        Update: {
          contact_clicks?: number
          day?: string
          post_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_post_daily_stats_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          consent_at: string
          created_at: string
          email: string | null
          id: string
          insurance_type: string
          message: string | null
          name: string
          phone: string
        }
        Insert: {
          consent_at?: string
          created_at?: string
          email?: string | null
          id?: string
          insurance_type: string
          message?: string | null
          name: string
          phone: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          email?: string | null
          id?: string
          insurance_type?: string
          message?: string | null
          name?: string
          phone?: string
        }
        Relationships: []
      }
      content_campaigns: {
        Row: {
          author: string | null
          created_at: string
          folder: string
          id: string
          keyword: string | null
          notes: string[]
          title: string
          week_start: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          folder: string
          id?: string
          keyword?: string | null
          notes?: string[]
          title: string
          week_start: string
        }
        Update: {
          author?: string | null
          created_at?: string
          folder?: string
          id?: string
          keyword?: string | null
          notes?: string[]
          title?: string
          week_start?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          attempts: number
          blog_post_id: string | null
          campaign_id: string
          caption: string
          caption_approved: boolean
          caption_facebook: string
          channels: string[]
          created_at: string
          details: Json
          first_comment: string
          id: string
          kind: string
          last_error: string | null
          locked_until: string | null
          media: Json
          media_approved: boolean
          position: number
          publish_state: Json
          published_at: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          blog_post_id?: string | null
          campaign_id: string
          caption?: string
          caption_approved?: boolean
          caption_facebook?: string
          channels?: string[]
          created_at?: string
          details?: Json
          first_comment?: string
          id?: string
          kind: string
          last_error?: string | null
          locked_until?: string | null
          media?: Json
          media_approved?: boolean
          position?: number
          publish_state?: Json
          published_at?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          blog_post_id?: string | null
          campaign_id?: string
          caption?: string
          caption_approved?: boolean
          caption_facebook?: string
          channels?: string[]
          created_at?: string
          details?: Json
          first_comment?: string
          id?: string
          kind?: string
          last_error?: string | null
          locked_until?: string | null
          media?: Json
          media_approved?: boolean
          position?: number
          publish_state?: Json
          published_at?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_truths: {
        Row: {
          active: boolean
          body: string
          category: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          category?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          category?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      content_uploads: {
        Row: {
          created_at: string
          file_name: string
          id: string
          note: string | null
          path: string
          size: number | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id?: string
          note?: string | null
          path: string
          size?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: string
          note?: string | null
          path?: string
          size?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_replies: {
        Row: {
          author: string | null
          comment: string | null
          comment_id: string
          created_at: string
          error: string | null
          item_id: string | null
          platform: string
          status: string
        }
        Insert: {
          author?: string | null
          comment?: string | null
          comment_id: string
          created_at?: string
          error?: string | null
          item_id?: string | null
          platform: string
          status?: string
        }
        Update: {
          author?: string | null
          comment?: string | null
          comment_id?: string
          created_at?: string
          error?: string | null
          item_id?: string | null
          platform?: string
          status?: string
        }
        Relationships: []
      }
      content_integrations: {
        Row: {
          data: Json
          provider: string
          updated_at: string
        }
        Insert: {
          data?: Json
          provider: string
          updated_at?: string
        }
        Update: {
          data?: Json
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_blog_admin: {
        Args: never
        Returns: boolean
      }
      increment_blog_post_view: {
        Args: { post_slug: string }
        Returns: undefined
      }
      increment_blog_post_contact_click: {
        Args: { post_slug: string }
        Returns: undefined
      }
      content_connection_status: {
        Args: never
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
