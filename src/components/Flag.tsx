import { flagUrl } from "@/data";

export function Flag({
  code,
  size = 48,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full ring-2 ring-white/15 shadow-lg ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={flagUrl(code, size > 60 ? 160 : 80)}
        alt={`Bandera ${code}`}
        width={size}
        height={size}
        loading="lazy"
        className="h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-b from-white/15 via-transparent to-black/30" />
    </div>
  );
}
