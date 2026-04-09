import { cn } from "@/lib/utils";

type StatusBadgeVariant = "success" | "warning" | "neutral";

const variantClass: Record<StatusBadgeVariant, string> = {
  success: "bg-emerald-600 text-white",
  warning: "bg-orange-500 text-white",
  neutral: "bg-muted text-muted-foreground",
};

type Props = {
  children: React.ReactNode;
  variant: StatusBadgeVariant;
  className?: string;
};

export function StatusBadge({ children, variant, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantClass[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
