import { formatDayNumber, formatMonthShort } from "@/lib/format";
import type { IsoDate } from "@/lib/types/common";

/** Pastilla de fecha con el día como protagonista. */
export function DatePill({ iso }: { iso: IsoDate }) {
  return (
    <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 flex-col items-center justify-center gap-0.5 rounded-lg leading-none">
      <span className="text-[0.6rem] font-medium tracking-wide uppercase">
        {formatMonthShort(iso)}
      </span>
      <span className="font-heading text-sm font-semibold tabular-nums">
        {formatDayNumber(iso)}
      </span>
    </span>
  );
}
