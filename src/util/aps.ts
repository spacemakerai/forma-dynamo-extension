import { Forma } from "forma-embedded-view-sdk/auto";

const DEFAULT_APS_BASE_URL = "https://developer.api.autodesk.com";

// New UK+4 regions and India staging use regional APS hosts for both Forma products.
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
  ["forma.stg.usa.autodesk.com", "https://api.aps.stg.usa.autodesk.com"],
  ["local.forma.stg.usa.autodesk.com", "https://api.aps.stg.usa.autodesk.com"],
]);

function getRegionalApsBaseUrl(): string | undefined {
  try {
    // Forma.origin may be any value at runtime; unparseable values use the default.
    const { protocol, hostname } = new URL(Forma.origin);
    return protocol === "https:" ? REGIONAL_APS_BASE_URLS.get(hostname) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Base URL for APS (Autodesk Platform Services) calls, derived from the Forma host.
 * Recognized UK+4 and stg.ind hosts, plus forma.stg.usa and its local host, use regional
 * APS hosts, which do not support WebSockets. Existing production origins
 * (app.autodeskforma.com, app.autodeskforma.eu, and forma.aus.autodesk.com) retain
 * developer.api.autodesk.com until a later production switch; unrecognized origins use it too.
 */
export function getApsBaseUrl(): string {
  return getRegionalApsBaseUrl() ?? DEFAULT_APS_BASE_URL;
}

/**
 * Region header for APS calls. A region header overrides hostname routing, so no header is
 * sent to regional hosts. Existing production and unrecognized origins retain the legacy
 * `X-Ads-Region: EMEA` header.
 */
export function getApsRegionHeaders(): Record<string, string> {
  return getRegionalApsBaseUrl() ? {} : { "X-Ads-Region": "EMEA" };
}
