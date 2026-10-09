import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import type { Database, Json } from "@/integrations/supabase/types";
import { ATTRIBUTION_KEYS } from "@/lib/attribution";

const INSURANCE_TYPES = ["life", "home", "travel", "business"] as const;
const noLinks = (value: string) => !/(https?:\/\/|www\.)/i.test(value);

const leadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Imię i nazwisko jest wymagane")
    .max(100, "Imię i nazwisko jest za długie")
    .refine(noLinks, "Podaj samo imię"),
  email: z
    .string()
    .trim()
    .max(255, "Adres e-mail jest za długi")
    .email("Podaj prawidłowy adres e-mail")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(9, "Podaj prawidłowy numer telefonu")
    .max(20, "Numer telefonu jest za długi")
    .regex(/^\+?[0-9 ().-]+$/, "Numer może zawierać tylko cyfry, spacje i +")
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 9 && digits <= 15;
    }, "Podaj prawidłowy numer telefonu"),
  // A plain string for the form (it starts empty), but only the four known values pass.
  insuranceType: z
    .string()
    .refine(
      (value) => (INSURANCE_TYPES as readonly string[]).includes(value),
      "Wybierz rodzaj ubezpieczenia",
    ),
  message: z.string().trim().max(1000, "Wiadomość jest za długa").optional(),
  consent: z.boolean().refine((value) => value, {
    message: "Zgoda na przetwarzanie danych jest wymagana",
  }),
  // Honeypot: hidden from people, bots tend to fill every field.
  website: z.string().max(200).optional(),
  // Where the visitor came from (src/lib/attribution.ts) — never shown to them.
  source: z.record(z.enum(ATTRIBUTION_KEYS), z.string().max(200)).optional(),
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

    // submit_lead() validates and rate-limits in the database (security migration,
    // 2026-10-09). Until that SQL has been run, fall back to the old direct insert.
    const { error } = await supabase.rpc("submit_lead", {
      p_name: data.name,
      p_phone: data.phone,
      p_email: data.email || null,
      p_insurance_type: data.insuranceType,
      p_message: data.message || null,
      p_source: (data.source ?? null) as Json,
    });

    if (error?.code === "PGRST202") {
      const insert = await supabase.from("leads").insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone,
        insurance_type: data.insuranceType,
        message: data.message || null,
      });
      if (insert.error) {
        throw new Error("Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.");
      }
    } else if (error) {
      if (/too many requests/i.test(error.message)) {
        throw new Error(
          "Wysłano już kilka zgłoszeń z tego numeru — oddzwonimy. Jeśli to pilne, zadzwoń do nas.",
        );
      }
      throw new Error("Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.");
    }

    const { notifyNewLead } = await import("./lead-notify");
    await notifyNewLead(data, new URL(getRequest().url).origin);

    return { success: true };
  });
