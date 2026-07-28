import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ThumbnailPageClient from "@/components/thumbnail/ThumbnailPageClient";

export default function ThumbnailPage() {
  return (
    <DashboardShell
      title="AI Thumbnails"
      subtitle="Generate HD YouTube, Instagram, Reel, product, and advertisement thumbnails"
    >
      <FeatureGate feature="thumbnail_generator">
        <ThumbnailPageClient />
      </FeatureGate>
    </DashboardShell>
  );
}
