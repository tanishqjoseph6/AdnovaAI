"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import PremiumUpgradeModal from "@/components/billing/PremiumUpgradeModal";
import {
  canAccessFeature,
  type FeatureId,
  type GatedFeatureId,
} from "@/lib/billing/features";
import type { PlanId, SubscriptionStatus } from "@/lib/billing/plans";
import { useCredits } from "@/hooks/useCredits";

type PlanFeaturesContextValue = {
  billingPlan: PlanId;
  effectivePlan: PlanId;
  subscriptionStatus: SubscriptionStatus;
  canAccess: (feature: FeatureId) => boolean;
  openUpgradeModal: (feature: GatedFeatureId) => void;
  closeUpgradeModal: () => void;
};

const PlanFeaturesContext = createContext<PlanFeaturesContextValue | null>(null);

export function PlanFeaturesProvider({ children }: { children: ReactNode }) {
  const { credits } = useCredits();
  const [upgradeFeature, setUpgradeFeature] = useState<GatedFeatureId | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);

  const billingPlan = credits?.billingPlan ?? "free";
  const subscriptionStatus =
    credits?.subscriptionStatus ?? ("inactive" as SubscriptionStatus);
  const effectivePlan = credits?.effectivePlan ?? "free";

  const canAccess = useCallback(
    (feature: FeatureId) =>
      canAccessFeature(billingPlan, subscriptionStatus, feature),
    [billingPlan, subscriptionStatus]
  );

  const openUpgradeModal = useCallback((feature: GatedFeatureId) => {
    setUpgradeFeature(feature);
    setModalOpen(true);
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setModalOpen(false);
    setUpgradeFeature(null);
  }, []);

  const value = useMemo(
    () => ({
      billingPlan,
      effectivePlan,
      subscriptionStatus,
      canAccess,
      openUpgradeModal,
      closeUpgradeModal,
    }),
    [
      billingPlan,
      effectivePlan,
      subscriptionStatus,
      canAccess,
      openUpgradeModal,
      closeUpgradeModal,
    ]
  );

  return (
    <PlanFeaturesContext.Provider value={value}>
      {children}
      <PremiumUpgradeModal
        open={modalOpen}
        feature={upgradeFeature}
        onClose={closeUpgradeModal}
      />
    </PlanFeaturesContext.Provider>
  );
}

export function usePlanFeatures() {
  const context = useContext(PlanFeaturesContext);
  if (!context) {
    throw new Error("usePlanFeatures must be used within PlanFeaturesProvider");
  }
  return context;
}
