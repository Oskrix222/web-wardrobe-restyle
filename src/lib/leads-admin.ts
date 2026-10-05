import { supabase } from "@/integrations/supabase/client";

export type AdminLead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  insuranceType: string;
  message: string | null;
  createdAt: string;
};

/** All form leads, newest first. RLS only returns rows to allow-listed admins. */
export async function listLeads(): Promise<AdminLead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, name, phone, email, insurance_type, message, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    insuranceType: row.insurance_type,
    message: row.message,
    createdAt: row.created_at,
  }));
}

/** Permanently removes a lead — e.g. on a RODO erasure request. */
export async function deleteLead(id: string): Promise<void> {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
