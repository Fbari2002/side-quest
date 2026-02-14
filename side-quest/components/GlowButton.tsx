import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type GlowButtonProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export default function GlowButton<T extends ElementType = "button">({
  as,
  className = "",
  children,
  ...props
}: GlowButtonProps<T>) {
  const Component = as || "button";

  return (
    <Component
      {...(props as Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">)}
      className={`glow-button inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(90deg,var(--warm),var(--accent-2),var(--accent))] px-4 py-3 font-semibold text-[#081019] transition duration-300 hover:brightness-105 hover:shadow-[0_0_26px_rgba(246,196,83,0.28)] disabled:cursor-not-allowed disabled:opacity-70 ${className}`.trim()}
    >
      <span className="relative z-10">{children}</span>
    </Component>
  );
}
