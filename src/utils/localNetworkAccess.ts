/**
 * Utility functions for checking Chrome's Local Network Access (LNA) permission
 * Required for Chrome >= 142 when accessing localhost/local network resources
 */

/**
 * Get the Chrome major version from the user agent string
 * @returns Chrome major version number or null if not Chrome
 */
export function getChromeVersion(): number | null {
  const userAgent = navigator.userAgent;
  const chromeMatch = userAgent.match(/Chrome\/(\d+)/);

  if (chromeMatch && chromeMatch[1]) {
    return parseInt(chromeMatch[1], 10);
  }

  return null;
}

/**
 * Check if Chrome version is >= 142 where LNA permission is required
 */
export function requiresLocalNetworkAccessPermission(): boolean {
  const version = getChromeVersion();
  return version !== null && version >= 142;
}

export type LocalNetworkAccessState = "granted" | "denied" | "prompt" | "unsupported";

/**
 * Query the Local Network Access permission state
 * @returns Permission state or 'unsupported' if the API is not available
 */
export async function checkLocalNetworkAccessPermission(): Promise<LocalNetworkAccessState> {
  // Check if we're in Chrome >= 142
  if (!requiresLocalNetworkAccessPermission()) {
    return "unsupported";
  }

  // Check if the Permissions API is available
  if (!navigator.permissions || !navigator.permissions.query) {
    return "unsupported";
  }

  try {
    // Type assertion needed as TypeScript may not have this permission type yet
    const result = await navigator.permissions.query({
      name: "local-network-access" as PermissionName,
    });

    return result.state as LocalNetworkAccessState;
  } catch (error) {
    console.warn("Failed to query local-network-access permission:", error);
    return "unsupported";
  }
}

/**
 * Check if we should show a warning to the user about the LNA permission prompt
 */
export async function shouldShowLocalNetworkAccessWarning(): Promise<boolean> {
  if (!requiresLocalNetworkAccessPermission()) {
    return false;
  }

  const state = await checkLocalNetworkAccessPermission();

  // Show warning if permission hasn't been granted yet (prompt or denied state)
  return state === "prompt" || state === "denied";
}
