const PALETTE = [
  "#8CB369", "#5B8CD6", "#D6875B", "#B25BD6", "#5BC0D6", "#D6B25B",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export default function Avatar({
  name,
  size = 40,
}: {
  name: string;
  size?: number;
}) {
  const initials =
    name
      .trim()
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div
      style={{ width: size, height: size, background: colorFor(name || "?") }}
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
    >
      <span style={{ fontSize: size * 0.38 }}>{initials}</span>
    </div>
  );
}
