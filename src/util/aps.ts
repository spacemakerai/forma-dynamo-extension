import { Forma } from "forma-embedded-view-sdk/auto";

const GLOBAL_APS_BASE_URL = "https://api.aps.autodesk.com";

// Forma regions with a dedicated APS endpoint: https://api.aps.<region>.autodesk.com.
// Adding a region here is the only change needed to route its Forma hosts regionally.
const APS_REGIONS = ["gbr", "can", "deu", "ind", "jpn", "stg.ind"];

// Forma host names that map to a region: [local.]{forma,formadesign}.<region>.autodesk.com.
// Matching is an exact lookup on the parsed hostname, never a suffix or substring match.
const REGIONAL_APS_BASE_URLS = new Map<string, string>(
  APS_REGIONS.flatMap((region) =>
    ["forma", "formadesign"].flatMap((product) =>
      [`${product}.${region}.autodesk.com`, `local.${product}.${region}.autodesk.com`].map(
        (hostname): [string, string] => [hostname, `https://api.aps.${region}.autodesk.com`],
      ),
    ),
  ),
);

function getRegionalApsBaseUrl(): string | undefined {
  try {
    // Forma.origin may be any value at runtime; anything unparseable falls back to global.
    const { protocol, hostname } = new URL(Forma.origin);
    return protocol === "https:" ? REGIONAL_APS_BASE_URLS.get(hostname) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Base URL for APS (Autodesk Platform Services) calls, derived from the Forma host.
 * Staging/dev origins (e.g. forma.stg.usa, formadesign.stg-usa, forma.test, forma.dev)
 * intentionally fall back to the global production host, for parity with the reviewed SDK
 * selector. No modern global staging host exists, so none is invented here.
 * Https Forma hosts of a known region (gbr, can, deu, ind, jpn, stg.ind) use that region's
 * https://api.aps.<region>.autodesk.com endpoint. Every other origin, including malformed
 * ones, uses the global https://api.aps.autodesk.com endpoint.
 */
export function getApsBaseUrl(): string {
  return getRegionalApsBaseUrl() ?? GLOBAL_APS_BASE_URL;
}

/**
 * Region header for APS calls. Regional endpoints imply the region and the header could
 * override it, so no header is sent to them. The global fallback keeps the legacy
 * `X-Ads-Region: EMEA` header. Header behavior for these modern api.aps hosts has not been
 * confirmed or verified; it is kept as it was previously.
 */
export function getApsRegionHeaders(): Record<string, string> {
  return getRegionalApsBaseUrl() ? {} : { "X-Ads-Region": "EMEA" };
}
