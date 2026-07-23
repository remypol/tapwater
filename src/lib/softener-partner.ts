/**
 * Water softener quote routing.
 *
 * When an approved lead partner (for example Bark via Awin) is configured, visitors are
 * routed straight to that partner's quote form and we earn per qualified lead. The partner
 * has the installer network, so the "installers will contact you" promise is actually kept.
 *
 * When no partner is configured we fall back to the on-site lead form, which stores the
 * request but deliberately makes no callback promise: without a partner or an active row in
 * `installer_partners`, nobody follows those leads up.
 *
 * To switch over, set NEXT_PUBLIC_SOFTENER_PARTNER_URL to the approved affiliate deep link
 * (and optionally NEXT_PUBLIC_SOFTENER_PARTNER_NAME to the partner's display name).
 */
export const SOFTENER_PARTNER_URL = (
  process.env.NEXT_PUBLIC_SOFTENER_PARTNER_URL ?? ""
).trim();

export const SOFTENER_PARTNER_NAME = (
  process.env.NEXT_PUBLIC_SOFTENER_PARTNER_NAME ?? ""
).trim();

export const softenerPartnerEnabled = SOFTENER_PARTNER_URL.length > 0;
