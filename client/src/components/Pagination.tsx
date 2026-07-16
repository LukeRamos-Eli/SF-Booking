export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#F3F5F8]">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#374151] border border-[#E5E9EF] hover:bg-[#F3F5F8] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>

      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition ${
              p === page ? "bg-[#1B4D3E] text-white" : "text-[#6B7280] hover:bg-[#F3F5F8]"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3.5 py-1.5 rounded-lg text-sm font-medium text-[#374151] border border-[#E5E9EF] hover:bg-[#F3F5F8] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}