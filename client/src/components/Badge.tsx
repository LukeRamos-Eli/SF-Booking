export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "role"
  | "neutral"
  | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-[#9CC17F] text-white",
  warning: "bg-[#F2A65A] text-white",
  danger: "bg-[#B23A3A] text-white",
  role: "bg-[#E7E2FB] text-[#6C5CE0]",
  neutral: "bg-[#52525B] text-white",
  outline: "bg-[#EEF0F3] text-[#8A93A0] border border-[#E5E9EF]",
};

export default function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-medium tracking-wide whitespace-nowrap ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

// Maps common backend status/role strings to a visual variant so pages
// don't need to repeat this switch logic.
export function statusVariant(status: string): BadgeVariant {
  switch (status.toLowerCase()) {
    case "approved":
    case "active":
    case "available":
      return "success";
    case "pending":
    case "partially booked":
      return "warning";
    case "rejected":
    case "cancelled":
    case "inactive":
    case "booked":
      return "danger";
    default:
      return "neutral";
  }
}

export function roleVariant(): BadgeVariant {
  return "role";
}
