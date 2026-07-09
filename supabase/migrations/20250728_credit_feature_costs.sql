-- ===========================================================================
-- AI credit costs per feature
-- ---------------------------------------------------------------------------
-- Sets the canonical credit cost for every AI operation and registers the
-- per-content-type feature ids used by single-item rewrites. Because
-- credit_transactions.feature_id has a FK to credit_feature_costs.feature_id,
-- every feature id referenced by the deduction RPC MUST exist here.
--
--   Caption            = 1
--   CTA                = 1
--   Hooks              = 2
--   UGC Script         = 3
--   Full ad generation = 7  (hooks + caption + CTA + UGC script)
--   Competitor Analyzer= 10
--   Landing Page Analyzer = 15
-- ===========================================================================

insert into public.credit_feature_costs (feature_id, cost, label, description)
values
  ('generate_ads',                  7,  'Ad Generation',          'Full ad: hooks, caption, CTA and UGC script'),
  ('hooks',                         2,  'Hooks',                  'Generate or rewrite ad hooks'),
  ('caption',                       1,  'Caption',                'Generate or rewrite an ad caption'),
  ('cta',                           1,  'CTA',                    'Generate or rewrite a call to action'),
  ('ugc_script',                    3,  'UGC Script',             'Generate or rewrite a UGC script'),
  ('generate_better_competitor_ad', 7,  'Better Competitor Ad',   'Generate an improved ad from a competitor analysis'),
  ('analyze_competitor_ad',         10, 'Competitor Analyzer',    'Analyze a competitor ad screenshot'),
  ('analyze_landing_page',          15, 'Landing Page Analyzer',  'AI audit of a landing page URL'),
  ('rewrite_content',               1,  'Content Rewrite',        'AI rewrite fallback for a single content item')
on conflict (feature_id) do update
  set cost = excluded.cost,
      label = excluded.label,
      description = excluded.description,
      updated_at = timezone('utc', now());
