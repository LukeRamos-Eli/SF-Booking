export type BadgeColor = "success" | "warning" | "danger" | "role" | "neutral";
export type BadgeTone = "solid" | "soft";

const SOLID: Record<BadgeColor, string> = {
  success: "bg-[#1B4D3E] text-white",
  warning: "bg-[#F2A65A] text-white",
  danger: "bg-[#B23A3A] text-white",
  role: "bg-[#E7E2FB] text-[#6C5CE0]",
  neutral: "bg-[#52525B] text-white",
};

const SOFT: Record<BadgeColor, string> = {
  success: "bg-[#D1FAE5] text-[#047857]",
  warning: "bg-[#FEF3C7] text-[#B45309]",
  danger: "bg-[#FEE2E2] text-[#B91C1C]",
  role: "bg-[#EDE9FE] text-[#6D28D9]",
  neutral: "bg-[#F1F1F3] text-[#52525B]",
};

export default function Badge({
  children,
  color = "neutral",
  tone = "solid",
  className = "",
}: {
  children: React.ReactNode;
  color?: BadgeColor;
  tone?: BadgeTone;
  className?: string;
}) {
  const classes = tone === "soft" ? SOFT[color] : SOLID[color];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-3.5 py-1 text-xs font-medium tracking-wide whitespace-nowrap ${classes} ${className}`}
    >
      {children}
    </span>
  );
}

export function statusColor(status: string): BadgeColor {
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
    case "unavailable":
      return "danger";
    default:
      return "neutral";
  }
}