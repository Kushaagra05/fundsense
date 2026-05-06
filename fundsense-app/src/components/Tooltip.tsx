type TooltipProps = {
  term: string;
  explanation: string;
};

export default function Tooltip({ term, explanation }: TooltipProps) {
  return (
    <span className="relative inline-flex items-center group">
      <span className="text-slate-400 text-xs leading-none cursor-help">ⓘ</span>
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 hidden w-max max-w-[200px] rounded-xl bg-slate-800 px-3 py-2 text-xs text-white shadow-lg z-50 group-hover:block">
        {explanation}
      </span>
      <span className="sr-only">{term}</span>
    </span>
  );
}
