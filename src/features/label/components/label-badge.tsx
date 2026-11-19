import type { IssueLabelSummary } from "../types";

/**
 * A small chart-style badge. The swatch carries the label's color;
 * the text stays neutral so it remains readable in both themes.
 */
export function LabelBadge({ label }: { label: IssueLabelSummary }) {
  return (
    <span className="border-border text-muted-foreground inline-flex items-center gap-1 rounded-[2px] border px-1.5 py-0.5 text-[11px] leading-none font-medium tracking-wide whitespace-nowrap">
      <span
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: label.color }}
        aria-hidden
      />
      {label.name}
    </span>
  );
}
