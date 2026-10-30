import { useTranslations } from "next-intl";
import { WeekSection } from "@/components/WeekSection";
import type { WeekGroup } from "@/lib/releases/group-by-week";

/**
 * Page body: heading, then one section per week or the empty state.
 * @param props Week groups, ascending.
 * @returns Main landmark.
 */
export function ReleaseList({ groups }: { readonly groups: readonly WeekGroup[] }) {
  const t = useTranslations("Releases");

  return (
    <main>
      <h1>{t("heading")}</h1>
      {groups.length === 0 ? (
        <p>{t("empty")}</p>
      ) : (
        groups.map((group) => <WeekSection key={group.weekStart} group={group} />)
      )}
    </main>
  );
}
