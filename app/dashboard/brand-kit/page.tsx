import BrandKitPageClient from "@/components/brand-kit/BrandKitPageClient";
import FeatureGate from "@/components/billing/FeatureGate";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { getBrandKitForUser } from "@/lib/brand-kit/server";
import { createClient } from "@/lib/supabase/server";

export default async function BrandKitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const brandKit = user ? await getBrandKitForUser(supabase, user.id) : null;

  return (
    <DashboardShell
      title="Brand Kit"
      subtitle="Save your brand identity once and let every future ad follow it"
    >
      <FeatureGate feature="brand_kit">
        <BrandKitPageClient initialBrandKit={brandKit} />
      </FeatureGate>
    </DashboardShell>
  );
}
