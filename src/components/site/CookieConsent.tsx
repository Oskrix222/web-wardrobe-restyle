import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  loadGoogleTags,
  onConsentReset,
  readConsent,
  saveConsent,
  trackingConfigured,
  type Consent,
} from "@/lib/analytics";

/**
 * Asks once for analytics/ads cookie consent and loads Google tags only after
 * "Akceptuję". Renders nothing when no Google tag is configured.
 */
export function CookieConsent() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!trackingConfigured) return;
    const stored = readConsent();
    if (stored === "granted") loadGoogleTags();
    if (stored === null) setOpen(true);
    return onConsentReset(() => setOpen(true));
  }, []);

  if (!open) return null;

  const choose = (value: Consent) => {
    saveConsent(value);
    setOpen(false);
  };

  return (
    <div className="cookie-consent" role="dialog" aria-live="polite" aria-label="Zgoda na cookies">
      <Cookie className="cookie-consent__icon" aria-hidden="true" />
      <p className="cookie-consent__text">
        Używamy plików cookies Google Analytics i Google Ads, żeby sprawdzać, co na stronie jest
        przydatne, i mierzyć skuteczność reklam. Włączymy je tylko za Twoją zgodą — szczegóły w{" "}
        <Link to="/polityka-prywatnosci">polityce prywatności</Link>.
      </p>
      <div className="cookie-consent__actions">
        <Button variant="outline" size="sm" onClick={() => choose("denied")}>
          Tylko niezbędne
        </Button>
        <Button size="sm" onClick={() => choose("granted")}>
          Akceptuję
        </Button>
      </div>
    </div>
  );
}
