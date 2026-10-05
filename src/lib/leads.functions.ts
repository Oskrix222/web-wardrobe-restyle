import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Imię i nazwisko jest wymagane")
    .max(100, "Imię i nazwisko jest za długie"),
  email: z.string().trim().max(255, "Adres e-mail jest za długi").optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(9, "Podaj prawidłowy numer telefonu")
    .max(20, "Numer telefonu jest za długi"),
  insuranceType: z.string().min(1, "Wybierz rodzaj ubezpieczenia"),
  message: z.string().trim().max(1000, "Wiadomość jest za długa").optional(),
  consent: z.boolean().refine((value) => value, {
    message: "Zgoda na przetwarzanie danych jest wymagana",
  }),
  // Honeypot: hidden from people, bots tend to fill every field.
  website: z.string().optional(),
});

export { leadSchema };
export type LeadFormData = z.infer<typeof leadSchema>;

export const submitLead = createServerFn({ method: "POST" })
  .validator((data) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    // Bot filled the hidden field: pretend it worked, store and send nothing.
    if (data.website) return { success: true };

    const { createClient } = await import("@supabase/supabase-js");

    // VITE_* values are inlined at build time, so the server needs no runtime vars.
    const supabase = createClient<Database>(
      import.meta.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"]!,
      import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || process.env["SUPABASE_PUBLISHABLE_KEY"]!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const { error } = await supabase.from("leads").insert({
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      insurance_type: data.insuranceType,
      message: data.message || null,
    });

    if (error) {
      throw new Error("Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.");
    }

    const { notifyNewLead } = await import("./lead-notify");
    await notifyNewLead(data, new URL(getRequest().url).origin);

    return { success: true };
  });
