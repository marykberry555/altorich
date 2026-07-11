import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type AdminNoteRow = {
  id: string;
  member_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
};

export class AdminNotesService {
  constructor(private readonly supabase: Client) {}

  async listForMember(memberId: string): Promise<AdminNoteRow[]> {
    const { data, error } = await this.supabase
      .from("admin_notes")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const authorIds = [...new Set((data ?? []).map((n) => n.author_id))];
    const { data: authors } = await this.supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", authorIds.length ? authorIds : ["00000000-0000-0000-0000-000000000000"]);

    const authorMap = new Map((authors ?? []).map((a) => [a.id, a.full_name || a.username || "Admin"]));

    return (data ?? []).map((note) => ({
      ...note,
      author_name: authorMap.get(note.author_id)
    }));
  }

  async create(input: { memberId: string; authorId: string; body: string }) {
    const { data, error } = await this.supabase
      .from("admin_notes")
      .insert({
        member_id: input.memberId,
        author_id: input.authorId,
        body: input.body.trim()
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }
}
