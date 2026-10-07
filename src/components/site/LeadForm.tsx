import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Phone,
  Heart,
  Home,
  Plane,
  Users,
  CircleCheck,
  ShieldCheck,
  Clock,
  BadgeCheck,
} from "lucide-react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { Box } from "@/components/ui/Box";
import { Checkbox, Field, Input, Label, Textarea } from "@/components/ui/Field";
import { submitLead, leadSchema, type LeadFormData } from "@/lib/leads.functions";
import { trackLead } from "@/lib/analytics";

export const insuranceOptions = [
  { value: "life", label: "Życie i zdrowie", icon: Heart },
  { value: "home", label: "Majątek — dom / mieszkanie", icon: Home },
  { value: "travel", label: "Wakacje / turystyczne", icon: Plane },
  { value: "business", label: "Grupowe dla firm", icon: Users },
];

export function LeadForm({ preselected }: { preselected?: string | undefined }) {
  const sendLead = useServerFn(submitLead);
  // After a successful send the form is replaced by a thank-you panel.
  const [sentName, setSentName] = useState<string | null>(null);
  const thanksRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      insuranceType: "",
      message: "",
      consent: false,
      website: "",
    },
  });

  const selectedType = watch("insuranceType");

  useEffect(() => {
    if (sentName) thanksRef.current?.focus();
  }, [sentName]);

  useEffect(() => {
    if (preselected) setValue("insuranceType", preselected, { shouldValidate: true });
  }, [preselected, setValue]);

  const onSubmit = async (data: LeadFormData) => {
    try {
      await sendLead({ data });
      trackLead({ insurance_type: data.insuranceType });
      setSentName(data.name.split(" ")[0] ?? data.name);
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

      {sentName ? (
        <div ref={thanksRef} tabIndex={-1} className="lead-form__thanks" role="status">
          <CircleCheck className="lead-form__thanks-icon" aria-hidden="true" />
          <p className="lead-form__thanks-title">Dziękujemy, {sentName}!</p>
          <p className="lead-form__thanks-text">
            Zgłoszenie dotarło do nas. Doradca przygotuje propozycję i oddzwoni w ciągu 24h — zwykle
            dużo szybciej. Jeśli wolisz porozmawiać od razu, zadzwoń:
          </p>
          <div className="lead-form__calls">
            <ButtonLink href="tel:+48539075385" variant="outline" size="lg" block>
              <Phone className="btn__icon" aria-hidden="true" />
              +48 539 075 385
            </ButtonLink>
            <ButtonLink href="tel:+48123846894" variant="outline" size="lg" block>
              <Phone className="btn__icon" aria-hidden="true" />
              +48 123 846 894
            </ButtonLink>
          </div>
          <button type="button" className="lead-form__again" onClick={() => setSentName(null)}>
            Wyślij kolejne zgłoszenie
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="lead-form__form" noValidate>
          {/* Honeypot for spam bots — invisible and skipped by keyboard users. */}
          <div className="lead-form__trap" aria-hidden="true">
            <label htmlFor="website">Strona www</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </div>

          <Field label="Imię *" htmlFor="name" error={errors.name?.message}>
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
          </div>

          <Field
            label="Rodzaj ubezpieczenia *"
            htmlFor="insuranceType"
            error={errors.insuranceType?.message}
          >
            <div
              id="insuranceType"
              className="insurance-picker"
              role="radiogroup"
              aria-label="Rodzaj ubezpieczenia"
              aria-invalid={errors.insuranceType ? "true" : "false"}
            >
              {insuranceOptions.map(({ value, label, icon: Icon }) => (
                <label
                  key={value}
                  className={
                    selectedType === value
                      ? "insurance-picker__option is-selected"
                      : "insurance-picker__option"
                  }
                >
                  <input
                    type="radio"
                    name="insuranceType"
                    value={value}
                    checked={selectedType === value}
                    onChange={() => setValue("insuranceType", value, { shouldValidate: true })}
                    className="sr-only"
                  />
                  <Icon className="insurance-picker__icon" aria-hidden="true" />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="Wiadomość (opcjonalna)" htmlFor="message" error={errors.message?.message}>
            <Textarea
              id="message"
              rows={3}
              placeholder="Napisz, czego potrzebujesz — np. wiek, liczba pracowników, wartość mieszkania..."
              {...register("message")}
              aria-invalid={errors.message ? "true" : "false"}
            />
          </Field>

          <div className="checkbox-field">
            <Checkbox
              id="consent"
              {...register("consent")}
              aria-invalid={errors.consent ? "true" : "false"}
            />
            <Label htmlFor="consent" className="checkbox-field__label">
              Wyrażam zgodę na przetwarzanie moich danych osobowych przez OSCare w celu kontaktu i
              przygotowania oferty ubezpieczenia, zgodnie z{" "}
              <Link to="/polityka-prywatnosci">Polityką Prywatności</Link>. *
            </Label>
          </div>
          {errors.consent ? <p className="field__error">{errors.consent.message}</p> : null}

          <Button type="submit" size="lg" block disabled={isSubmitting}>
            {isSubmitting ? "Wysyłanie..." : "Wyślij zgłoszenie"}
          </Button>

          <ul className="lead-form__trust">
            <li>
              <BadgeCheck aria-hidden="true" />
              Bez zobowiązań
            </li>
            <li>
              <Clock aria-hidden="true" />
              Odpowiedź w 24h
            </li>
            <li>
              <ShieldCheck aria-hidden="true" />
              Dane chronione
            </li>
          </ul>

          <div className="lead-form__divider">
            <span>lub zadzwoń bezpośrednio</span>
          </div>

          <div className="lead-form__calls">
            <ButtonLink href="tel:+48539075385" variant="outline" size="lg" block>
              <Phone className="btn__icon" aria-hidden="true" />
              +48 539 075 385
            </ButtonLink>
            <ButtonLink href="tel:+48123846894" variant="outline" size="lg" block>
              <Phone className="btn__icon" aria-hidden="true" />
              +48 123 846 894
            </ButtonLink>
          </div>
        </form>
      )}
    </Box>
  );
}
