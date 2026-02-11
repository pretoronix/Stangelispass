export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    name: string
                    is_admin: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    is_admin?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    is_admin?: boolean
                    created_at?: string
                }
            }
            beers: {
                Row: {
                    id: string
                    user_id: string
                    added_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    added_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    added_by?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
