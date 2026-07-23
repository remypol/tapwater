import Script from "next/script";

import { OUR_OWN_PARTNER_DOMAINS, skimlinksPublisherId } from "@/lib/skimlinks";

/**
 * Loads Skimlinks, with every domain we already earn on excluded.
 *
 * Renders nothing until NEXT_PUBLIC_SKIMLINKS_ID is set, so installing this is a
 * no-op until the id is filled in.
 *
 * The exclusion list has to exist before the script runs, which is why the config
 * goes in first with beforeInteractive while the script itself stays lazy. The
 * script reads settings from window.skimlinks_settings and falls back to bare
 * globals, so both are set — if the exclusions failed to arrive we would lose
 * bounties with nothing visibly broken.
 */
export function Skimlinks() {
  const publisherId = skimlinksPublisherId();
  if (!publisherId) return null;

  const exclude = JSON.stringify(OUR_OWN_PARTNER_DOMAINS);

  return (
    <>
      <Script id="skimlinks-config" strategy="beforeInteractive">
        {`window.skimlinks_exclude=${exclude};window.skimlinks_settings=Object.assign({},window.skimlinks_settings,{skimlinks_exclude:${exclude}});`}
      </Script>
      <Script
        id="skimlinks"
        src={`https://s.skimresources.com/js/${publisherId}.skimlinks.js`}
        strategy="lazyOnload"
      />
    </>
  );
}
