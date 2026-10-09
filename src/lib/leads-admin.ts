import { supabase } from "@/integrations/supabase/client";
import type { Attribution } from "@/lib/attribution";

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  insuranceType: string;
  message: string | null;
  /** utm tags / referrer / blog post the visitor came from (null for older leads). */
  source: Attribution | null;
  createdAt: string;
};

/** All form leads, newest first. RLS only returns rows to allow-listed admins. */
export async function listLeads(): Promise<AdminLead[]> {
  const columns = "id, name, phone, email, insurance_type, message, created_at";
  let result = await supabase
    .from("leads")
    .select(`${columns}, source`)
    .order("created_at", { ascending: false });
  // "source" arrives with the 2026-10-09 security SQL — work without it until then.
  if (result.error?.code === "42703") {
    result = (await supabase
      .from("leads")
      .select(columns)
      .order("created_at", { ascending: false })) as typeof result;
  }

  const { data, error } = result;
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    insuranceType: row.insurance_type,
    message: row.message,
    source: (row.source ?? null) as Attribution | null,
    createdAt: row.created_at,
  }));
}

/** Permanently removes a lead — e.g. on a RODO erasure request. */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
