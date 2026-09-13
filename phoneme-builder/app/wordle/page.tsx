import SiteShell from "@/app/components/site-shell";
import ActivityBuilder from "@/app/components/activity-builder";

export default function WordlePage() {
  return (
    <SiteShell>
      <ActivityBuilder type="WORDLE" />
    </SiteShell>
  );
}
