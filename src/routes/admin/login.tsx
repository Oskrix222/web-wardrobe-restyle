import { useState } from "react";
import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAdminSession } from "@/hooks/useAdminSession";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Logowanie — Panel OSCare" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { isLoggedIn, loading } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && isLoggedIn) {
    return <Navigate to="/admin/statystyki" />;
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError("Nieprawidłowy e-mail lub hasło.");
      return;
    }

    toast.success("Zalogowano.");
    navigate({ to: "/admin/statystyki" });
  };

  return (
    <div className="admin-auth">
      <form className="admin-auth__card" onSubmit={onSubmit}>
        <span className="eyebrow">Panel OSCare</span>
        <h1 className="admin-auth__title">Zaloguj się</h1>

        <Field label="E-mail" htmlFor="admin-email">
          <Input
            id="admin-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Hasło" htmlFor="admin-password">
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        {error ? <p className="field__error">{error}</p> : null}

        <Button type="submit" block disabled={submitting}>
          {submitting ? "Logowanie..." : "Zaloguj się"}
        </Button>

        <p className="admin-auth__hint">
          Konta zakłada się w panelu Supabase (Authentication → Users → Add user) — nie ma tu
          samodzielnej rejestracji.
        </p>
      </form>
    </div>
  );
}
