import { Forma } from "forma-embedded-view-sdk/auto";

const GLOBAL_APS_BASE_URL = "https://api.aps.autodesk.com";

// Regions whose [local.]{forma,formadesign} hosts map to api.aps.<region>.autodesk.com.
// Other regional Forma hosts are listed explicitly below.
const APS_REGIONS = ["gbr", "can", "deu", "ind", "jpn", "stg.ind"];

// Matching is an exact lookup on the parsed hostname, never a suffix or substring match.
const REGIONAL_APS_BASE_URLS = new Map<string, string>([
  ...APS_REGIONS.flatMap((region) =>
    ["forma", "formadesign"].flatMap((product) =>
      [`${product}.${region}.autodesk.com`, `local.${product}.${region}.autodesk.com`].map(
        (hostname): [string, string] => [hostname, `https://api.aps.${region}.autodesk.com`],
      ),
    ),
  ),
  ["app.autodeskforma.com", "https://api.aps.usa.autodesk.com"],
  ["local.autodeskforma.com", "https://api.aps.usa.autodesk.com"],
  ["app.autodeskforma.eu", "https://api.aps.irl.autodesk.com"],
  ["local.autodeskforma.eu", "https://api.aps.irl.autodesk.com"],
  ["forma.aus.autodesk.com", "https://api.aps.aus.autodesk.com"],
  ["local.forma.aus.autodesk.com", "https://api.aps.aus.autodesk.com"],
  ["forma.stg.usa.autodesk.com", "https://api.aps.stg.usa.autodesk.com"],
  ["local.forma.stg.usa.autodesk.com", "https://api.aps.stg.usa.autodesk.com"],
]);

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
 * Regional systems must use their regional APS hosts; forma.stg.usa maps to api.aps.stg.usa.
 * Regional modern APS hosts do not support WebSockets.
 * The global https://api.aps.autodesk.com endpoint is only the code fallback for origins
 * that are not recognized regional Forma hosts, including malformed origins and unrecognized
 * staging/dev origins such as formadesign.stg-usa, forma.test, and forma.dev.
 */
export function getApsBaseUrl(): string {
  return getRegionalApsBaseUrl() ?? GLOBAL_APS_BASE_URL;
}

/**
 * Region header for APS calls. A region header overrides hostname routing, so no header is
 * sent to regional hosts. The global fallback keeps the legacy `X-Ads-Region: EMEA` header;
 * that fallback behavior was preserved without change or verification.
 */
export function getApsRegionHeaders(): Record<string, string> {
  return getRegionalApsBaseUrl() ? {} : { "X-Ads-Region": "EMEA" };
}
