import type { ElementType, ReactNode } from "react";

type GlowCardProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children: ReactNode;
};

export default function GlowCard<T extends ElementType = "div">({
  as,
  className = "",
  children,
}: GlowCardProps<T>) {
  const Component = as || "div";
  return <Component className={`glow-card ${className}`.trim()}>{children}</Component>;
}
