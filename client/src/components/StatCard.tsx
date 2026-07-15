export type StatTone = "purple" | "yellow" | "green" | "orange";

const TONE_CLASSES: Record<StatTone, string> = {
  purple: "bg-[#EAE6FD] text-[#7C6AE8]",
  yellow: "bg-[#FCF0D2] text-[#E0A62E]",
  green: "bg-[#DFF3DA] text-[#5EA855]",
  orange: "bg-[#FBE3D6] text-[#E27C4D]",
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "purple",
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  tone?: StatTone;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EEF0F3] p-6 flex items-start justify-between">
      <div>
        <p className="text-sm text-[#8A93A0] mb-3">{label}</p>
        <p className="text-3xl font-semibold text-[#1F2937]">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${TONE_CLASSES[tone]}`}>
        <span className="w-6 h-6 [&>svg]:w-6 [&>svg]:h-6">{icon}</span>
      </div>
    </div>
  );
}
