interface KshIconProps {
  className?: string;
}

export default function KshIcon({ className = 'text-xs' }: KshIconProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-bold leading-none tracking-tight ${className}`}
      aria-hidden
    >
      Ksh
    </span>
  );
}
