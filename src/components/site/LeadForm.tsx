import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { submitLead, leadSchema, type LeadFormData } from "@/lib/leads.functions";

export const insuranceOptions = [
  { value: "life", label: "Życie i zdrowie" },
  { value: "home", label: "Majątek — dom / mieszkanie" },
  { value: "travel", label: "Wakacje / turystyczne" },
  { value: "oc", label: "OC / AC — komunikacja" },
  { value: "business", label: "Grupowe dla firm" },
];

export function LeadForm({ preselected }: { preselected?: string | undefined }) {
  const sendLead = useServerFn(submitLead);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: "", email: "", phone: "", insuranceType: "", message: "" },
  });

  const selectedType = watch("insuranceType");

  useEffect(() => {
    if (preselected) setValue("insuranceType", preselected, { shouldValidate: true });
  }, [preselected, setValue]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      await sendLead({ data });
      toast.success("Zgłoszenie wysłane! Doradca odezwie się w ciągu 24h.");
      reset();
    } catch {
      toast.error("Nie udało się wysłać zgłoszenia. Spróbuj ponownie później.");
    }
  };

  return (
    <Box id="kontakt" panel shadow className="lead-form">
      <span className="eyebrow">Formularz kontaktowy</span>
      <h2 className="lead-form__title">ZOSTAW KONTAKT</h2>
      <p className="lead-form__intro">
        Wypełnij dane — doradca przygotuje ofertę i oddzwoni w ciągu 24h.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="lead-form__form" noValidate>
        <Field label="Imię i nazwisko *" htmlFor="name" error={errors.name?.message}>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jan Kowalski"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
        </Field>

        <div className="field__row">
          <Field label="Telefon *" htmlFor="phone" error={errors.phone?.message}>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+48 123 456 789"
              {...register("phone")}
              aria-invalid={errors.phone ? "true" : "false"}
            />
          </Field>
          <Field label="E-mail" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jan@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
          </Field>
        </div>

        <Field
          label="Rodzaj ubezpieczenia *"
          htmlFor="insuranceType"
          error={errors.insuranceType?.message}
        >
          <Select
            id="insuranceType"
            options={insuranceOptions}
            placeholder="Wybierz rodzaj ubezpieczenia"
            value={selectedType ?? ""}
            onChange={(event) =>
              setValue("insuranceType", event.target.value, { shouldValidate: true })
            }
            aria-invalid={errors.insuranceType ? "true" : "false"}
          />
        </Field>

        <Field label="Wiadomość" htmlFor="message" error={errors.message?.message}>
          <Textarea
            id="message"
            rows={4}
            placeholder="Napisz, czego potrzebujesz — np. wiek, liczba pracowników, wartość mieszkania..."
            {...register("message")}
            aria-invalid={errors.message ? "true" : "false"}
          />
        </Field>

        <Button type="submit" size="lg" block disabled={isSubmitting}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
        </Button>

        <p className="lead-form__consent">
          Wysyłając formularz, zgadzasz się na kontakt w sprawie oferty ubezpieczenia.
        </p>
      </form>
    </Box>
  );
}
