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
      ad_watch_daily: {
        Row: {
          count: number
          day: string
          section: string
          user_id: string
        }
        Insert: {
          count?: number
          day?: string
          section: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          section?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
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
      credit_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          metadata: Json | null
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          metadata?: Json | null
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      generated_images: {
        Row: {
          cost: number
          created_at: string
          id: string
          image_data: string
          prompt: string
          quality: string
          user_id: string
        }
        Insert: {
          cost?: number
          created_at?: string
          id?: string
          image_data: string
          prompt: string
          quality: string
          user_id: string
        }
        Update: {
          cost?: number
          created_at?: string
          id?: string
          image_data?: string
          prompt?: string
          quality?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_favorites: {
        Row: {
          created_at: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_follows: {
        Row: {
          created_at: string
          follower_id: string
          seller_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          seller_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          seller_id?: string
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          amount_credits: number
          buyer_id: string
          commission_credits: number
          created_at: string
          id: string
          product_id: string
          seller_credits: number
          seller_id: string
          status: string
        }
        Insert: {
          amount_credits: number
          buyer_id: string
          commission_credits: number
          created_at?: string
          id?: string
          product_id: string
          seller_credits: number
          seller_id: string
          status?: string
        }
        Update: {
          amount_credits?: number
          buyer_id?: string
          commission_credits?: number
          created_at?: string
          id?: string
          product_id?: string
          seller_credits?: number
          seller_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category: string
          cover_url: string | null
          created_at: string
          demo_url: string | null
          description: string
          file_url: string | null
          gallery: Json
          id: string
          keywords: string[]
          price_credits: number
          product_type: string
          rating_avg: number
          rating_count: number
          sales_count: number
          seller_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string
          file_url?: string | null
          gallery?: Json
          id?: string
          keywords?: string[]
          price_credits: number
          product_type: string
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          seller_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_url?: string | null
          created_at?: string
          demo_url?: string | null
          description?: string
          file_url?: string | null
          gallery?: Json
          id?: string
          keywords?: string[]
          price_credits?: number
          product_type?: string
          rating_avg?: number
          rating_count?: number
          sales_count?: number
          seller_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banned: boolean
          created_at: string
          credits: number
          email: string | null
          full_name: string | null
          id: string
          last_daily_bonus_at: string | null
          locale: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id: string
          last_daily_bonus_at?: string | null
          locale?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banned?: boolean
          created_at?: string
          credits?: number
          email?: string | null
          full_name?: string | null
          id?: string
          last_daily_bonus_at?: string | null
          locale?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      seller_balances: {
        Row: {
          available_credits: number
          lifetime_credits: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_credits?: number
          lifetime_credits?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_credits?: number
          lifetime_credits?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seller_payouts: {
        Row: {
          admin_note: string | null
          amount_credits: number
          created_at: string
          details: Json
          id: string
          method: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount_credits: number
          created_at?: string
          details?: Json
          id?: string
          method: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount_credits?: number
          created_at?: string
          details?: Json
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          banned: boolean
          created_at: string
          credits: number
          email: string
          full_name: string
          id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          roles: string[]
        }[]
      }
      admin_mp_pending_payouts: {
        Args: never
        Returns: {
          amount_credits: number
          created_at: string
          details: Json
          id: string
          method: string
          status: string
          user_id: string
        }[]
      }
      admin_mp_pending_products: {
        Args: never
        Returns: {
          category: string
          cover_url: string
          created_at: string
          description: string
          id: string
          price_credits: number
          seller_id: string
          title: string
        }[]
      }
      admin_mp_set_payout: {
        Args: { _id: string; _note?: string; _status: string }
        Returns: undefined
      }
      admin_mp_set_status: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      admin_set_banned: {
        Args: { _banned: boolean; _user_id: string }
        Returns: undefined
      }
      admin_set_credits: {
        Args: { _credits: number; _user_id: string }
        Returns: undefined
      }
      admin_set_plan: {
        Args: {
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _user_id: string
        }
        Returns: undefined
      }
      admin_set_setting: {
        Args: { _key: string; _value: Json }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      claim_daily_bonus: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mp_purchase: { Args: { _product_id: string }; Returns: Json }
      mp_request_payout: {
        Args: { _amount: number; _details: Json; _method: string }
        Returns: string
      }
      record_ad_watch: {
        Args: { _count?: number; _section: string }
        Returns: number
      }
      refund_credits: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: number
      }
      spend_credits: {
        Args: { _amount: number; _metadata?: Json; _reason: string }
        Returns: number
      }
      spend_or_watch_ad: {
        Args: { _cost: number; _reason: string; _section: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "user" | "admin" | "developer"
      subscription_plan: "free" | "plus" | "pro" | "ultra"
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
      app_role: ["user", "admin", "developer"],
      subscription_plan: ["free", "plus", "pro", "ultra"],
    },
  },
} as const
