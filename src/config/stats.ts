// =============================================================
// Stat tiles. KEY_STATS appear in the hero and beside the contact form;
// ABOUT_STATS are the six tiles in "O nas". Edit here, every place follows.
// =============================================================
import {
  Banknote,
  Clock,
  HandHeart,
  HeartHandshake,
  Phone,
  Shield,
  Sparkles,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react";

import { STATS } from "@/config/business";

export type Stat = { value: string; label: string; icon: LucideIcon };

export const KEY_STATS: Stat[] = [
  { value: "100%", label: "pozytywnych opinii", icon: ThumbsUp },
  { value: "24h", label: "czas odpowiedzi", icon: Clock },
  { value: "100%", label: "wsparcia od zakupu po wypłatę", icon: HandHeart },
];

export const ABOUT_STATS: Stat[] = [
  { value: "100%", label: "Pozytywnych opinii", icon: HeartHandshake },
  { value: STATS.payouts, label: "Zrealizowanych wypłat", icon: Banknote },
  { value: "24h", label: "Na przygotowanie oferty", icon: Clock },
  { value: "100%", label: "Kontaktu w 24h", icon: Phone },
  { value: "100%", label: "Świeże oferty", icon: Sparkles },
  { value: "100%", label: "Ochrony w budżecie klienta", icon: Shield },
];
