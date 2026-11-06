import { Forma } from "forma-embedded-view-sdk/auto";

const DEFAULT_APS_BASE_URL = "https://developer.api.autodesk.com";

// Region-aware APS endpoints for Forma regions that don't use developer.api.autodesk.com,
// keyed on the Forma host's hostname suffix (with or without the `local.` prefix).
// See https://github.com/spacemakerai/deploy-targets (adskDeveloperApiBaseUrl).
const REGIONAL_APS_BASE_URLS: { hostnameSuffix: string; apsBaseUrl: string }[] = [
  // India Staging (stg-ind), e.g. formadesign.stg.ind.autodesk.com.
  { hostnameSuffix: ".stg.ind.autodesk.com", apsBaseUrl: "https://api.aps.stg.ind.autodesk.com" },
];

function getRegionalApsBaseUrl(): string | undefined {
  try {
    const hostname = new URL(Forma.origin).hostname;
    return REGIONAL_APS_BASE_URLS.find(({ hostnameSuffix }) => hostname.endsWith(hostnameSuffix))
      ?.apsBaseUrl;
  } catch {
    return undefined;
  }
}

/**
 * Base URL for APS (Autodesk Platform Services) calls, derived from the Forma host.
 * All current regions use developer.api.autodesk.com.
 */
export function getApsBaseUrl(): string {
  return getRegionalApsBaseUrl() ?? DEFAULT_APS_BASE_URL;
}

/**
 * Region header for APS calls. Regional endpoints imply the region, and the header
 * would override it, so it is only sent to developer.api.autodesk.com.
 */
export function getApsRegionHeaders(): Record<string, string> {
  return getRegionalApsBaseUrl() ? {} : { "X-Ads-Region": "EMEA" };
}
