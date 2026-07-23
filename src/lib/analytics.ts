/**
 * Lightweight GA4 event tracking.
 * Only fires in production when gtag is available.
 */

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params?: EventParams) {
  if (typeof window === "undefined") return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (gtag) {
    gtag("event", name, params);
  }
}

// Pre-defined events for key conversions
export const events = {
  postcodeSearch: (district: string) => {
    trackEvent("postcode_search_submitted", { postcode_area: district });
    trackEvent("postcode_search", { district });
  },

  waterReportViewed: (postcodeArea: string, waterScoreBand: string) =>
    trackEvent("water_report_viewed", {
      postcode_area: postcodeArea,
      water_score_band: waterScoreBand,
    }),

  recommendationImpression: (params: EventParams) =>
    trackEvent("recommendation_impression", params),

  affiliateClick: (params: EventParams) =>
    trackEvent("affiliate_click", params),

  filterClick: (filterId: string, filterBrand: string) =>
    trackEvent("filter_click", { filter_id: filterId, filter_brand: filterBrand }),

  subscribeAttempt: (postcode: string) =>
    trackEvent("subscribe_attempt", { postcode }),

  subscribeSuccess: (postcode: string) =>
    trackEvent("subscribe_success", { postcode }),

  regionSelect: (regionId: string) =>
    trackEvent("region_select", { region_id: regionId }),

  softenerBannerView: (postcode: string) =>
    trackEvent("softener_banner_view", { postcode }),

  softenerBannerClick: (postcode: string) =>
    trackEvent("softener_banner_click", { postcode }),

  softenerFormView: (postcode: string, source: string) =>
    trackEvent("softener_form_view", { postcode, source }),

  softenerFormSubmit: (postcode: string, source: string) =>
    trackEvent("softener_form_submit", { postcode, source }),

  softenerFormError: (postcode: string, error: string) =>
    trackEvent("softener_form_error", { postcode, error }),

  softenerPartnerView: (postcode: string, source: string) =>
    trackEvent("softener_partner_view", { postcode, source }),

  softenerPartnerClick: (postcode: string, source: string) =>
    trackEvent("softener_partner_click", { postcode, source }),
};
