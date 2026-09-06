import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BoxProps = HTMLAttributes<HTMLElement> & {
  /** Which HTML tag to render (div by default). */
  as?: ElementType;
  /** Larger padding and radius — used for the big panels. */
  panel?: boolean;
  interactive?: boolean;
  shadow?: boolean;
  children?: ReactNode;
};

/** Reusable bordered box used for cards, panels and list items. */
export function Box({
  as: Tag = "div",
  panel = false,
  interactive = false,
  shadow = false,
  className,
  children,
  ...rest
}: BoxProps) {
  return (
    <Tag
      className={cn(
        "box",
        panel && "box--panel",
        interactive && "box--interactive",
        shadow && "box--shadow",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** Small rounded label with an icon, used above the hero headline. */
export function Pill({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) {
  return (
    <div className="pill">
      <Icon className="pill__icon" aria-hidden="true" />
      <span className="pill__text">{children}</span>
    </div>
  );
}

/** Circular tinted background for an icon. */
export function IconCircle({
  icon: Icon,
  size = "lg",
}: {
  icon: ElementType;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span className={cn("icon-circle", size === "sm" && "icon-circle--sm", size === "md" && "icon-circle--md")}>
      <Icon aria-hidden="true" />
    </span>
  );
}
