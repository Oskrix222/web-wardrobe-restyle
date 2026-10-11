import { Phone } from "lucide-react";

import { CONTACT_PHONES, telHref } from "@/config/business";
import { cn } from "@/lib/utils";

type Contact = (typeof CONTACT_PHONES)[number];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

/** "Call Oskar" button: initials, name and number in one readable tap target. */
export function AgentCall({
  contact,
  size = "md",
  className,
}: {
  contact: Contact;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <a
      href={telHref(contact.phone)}
      className={cn("agent-call", `agent-call--${size}`, className)}
      aria-label={`Zadzwoń do ${contact.fullName}: ${contact.phone}`}
    >
      <span className="agent-call__avatar" aria-hidden="true">
        {initials(contact.fullName)}
      </span>
      <span className="agent-call__text">
        <span className="agent-call__name">{contact.fullName}</span>
        <span className="agent-call__phone">{contact.phone}</span>
      </span>
      <Phone className="agent-call__icon" aria-hidden="true" />
    </a>
  );
}
