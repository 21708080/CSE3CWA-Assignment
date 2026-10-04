import SiteShell from "@/app/components/site-shell";
import ActivityBuilder from "@/app/components/activity-builder";

export default function WordSearchPage() {
  return (
    <SiteShell>
      <ActivityBuilder type="WORD_SEARCH" />
    </SiteShell>
  );
}
