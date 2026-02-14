type SparkleProps = {
  className?: string;
};

export default function Sparkle({ className = "" }: SparkleProps) {
  return (
    <span
      aria-hidden="true"
      className={`sparkle-pulse inline-flex h-5 w-5 items-center justify-center text-[var(--warm)] drop-shadow-[0_0_8px_rgba(246,196,83,0.45)] ${className}`.trim()}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2.5 14 8l5.5 2-5.5 2-2 5.5-2-5.5-5.5-2L10 8l2-5.5Z" />
      </svg>
    </span>
  );
}
