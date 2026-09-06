import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    <div
      id="kontakt"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-10"
    >
      <span className="font-mono text-xs font-medium uppercase tracking-widest text-terracotta">
        Formularz kontaktowy
      </span>
      <h2 className="mt-3 font-display text-3xl sm:text-4xl">ZOSTAW KONTAKT</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Wypełnij dane — doradca przygotuje ofertę i oddzwoni w ciągu 24h.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Imię i nazwisko *</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jan Kowalski"
            {...register("name")}
            aria-invalid={errors.name ? "true" : "false"}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon *</Label>
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+48 123 456 789"
              {...register("phone")}
              aria-invalid={errors.phone ? "true" : "false"}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="jan@example.com"
              {...register("email")}
              aria-invalid={errors.email ? "true" : "false"}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insuranceType">Rodzaj ubezpieczenia *</Label>
          <Select
            value={selectedType}
            onValueChange={(value) => setValue("insuranceType", value, { shouldValidate: true })}
          >
            <SelectTrigger id="insuranceType" aria-invalid={errors.insuranceType ? "true" : "false"}>
              <SelectValue placeholder="Wybierz rodzaj ubezpieczenia" />
            </SelectTrigger>
            <SelectContent>
              {insuranceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.insuranceType && (
            <p className="text-xs text-destructive">{errors.insuranceType.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Wiadomość</Label>
          <Textarea
            id="message"
            rows={4}
            placeholder="Napisz, czego potrzebujesz — np. wiek, liczba pracowników, wartość mieszkania..."
            {...register("message")}
            aria-invalid={errors.message ? "true" : "false"}
          />
          {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Wysyłając formularz, zgadzasz się na kontakt w sprawie oferty ubezpieczenia.
        </p>
      </form>
    </div>
  );
}
