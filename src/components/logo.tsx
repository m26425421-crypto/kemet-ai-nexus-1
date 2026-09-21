import logoUrl from "/icon-512.png?url";
import { cn } from "@/lib/utils";

export function Logo({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <img
      src={logoUrl}
      alt="KEMET AI"
      width={size}
      height={size}
      className={cn("rounded-xl shadow-glow", className)}
    />
  );
}

export function LogoWordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Logo size={36} />
      <div className="flex flex-col leading-tight">
        <span className="text-lg font-bold tracking-wide text-gradient-gold">KEMET</span>
        <span className="-mt-1 text-[10px] font-semibold tracking-[0.3em] text-turquoise">
          AI
        </span>
      </div>
    </div>
  );
}