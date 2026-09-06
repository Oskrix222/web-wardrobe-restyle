import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "outline" | "ghost" | "icon";
export type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children?: ReactNode;
};

function classes({ variant = "primary", size = "md", block = false }: BaseProps, extra?: string) {
  return cn(
    "btn",
    `btn--${variant}`,
    variant !== "icon" && `btn--${size}`,
    block && "btn--block",
    extra,
  );
}

export type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant, size, block, className, children, ...rest }: ButtonProps) {
  return (
    <button className={classes({ variant, size, block }, className)} {...rest}>
      {children}
    </button>
  );
}

export type ButtonLinkProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement>;

/** Same look as Button, rendered as a link. */
export function ButtonLink({ variant, size, block, className, children, ...rest }: ButtonLinkProps) {
  return (
    <a className={classes({ variant, size, block }, className)} {...rest}>
      {children}
    </a>
  );
}
