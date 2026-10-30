import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MIN_DATE, type ReleaseWindow } from "@/lib/releases/window";
import "./_WeekRangeForm.css";

/**
 * Date range picker: a GET form so the URL carries the range and works without JS.
 * @param props Current normalized range.
 * @returns Form with from/to inputs and a link back to today.
 */
export function WeekRangeForm({ range }: { readonly range: ReleaseWindow }) {
  const t = useTranslations("Nav");

  return (
    <form method="get" data-part="week-range">
      <p>
        <label htmlFor="range-from">{t("from")}</label>
        <input
          id="range-from"
          type="date"
          name="from"
          min={MIN_DATE}
          defaultValue={range.from}
          required
        />
      </p>
      <p>
        <label htmlFor="range-to">{t("to")}</label>
        <input id="range-to" type="date" name="to" min={MIN_DATE} defaultValue={range.to} />
      </p>
      <button type="submit">{t("show")}</button>
      <Link href="/">{t("today")}</Link>
    </form>
  );
}
