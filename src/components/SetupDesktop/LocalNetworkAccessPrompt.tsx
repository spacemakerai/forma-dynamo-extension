import { useEffect, useState } from "preact/hooks";
import { 
  checkLocalNetworkAccessPermission, 
  LocalNetworkAccessState,
  getChromeVersion 
} from "../../utils/localNetworkAccess";
import styles from "./LocalNetworkAccessPrompt.module.pcss";

export function LocalNetworkAccessPrompt() {
  const [permissionState, setPermissionState] = useState<LocalNetworkAccessState>('unsupported');
  const [chromeVersion, setChromeVersion] = useState<number | null>(null);

  useEffect(() => {
    const version = getChromeVersion();
    setChromeVersion(version);
    
    if (version && version >= 142) {
      checkLocalNetworkAccessPermission().then(setPermissionState);
    }
  }, []);

  // Don't show anything if not Chrome >= 142 or permission already granted
  if (!chromeVersion || chromeVersion < 142 || permissionState === 'granted' || permissionState === 'unsupported') {
    return null;
  }

  return (
    <div className={styles.Container}>
      <div className={styles.Icon}>ℹ️</div>
      <div className={styles.Content}>
        <div className={styles.Title}>
          Browser Permission Required
        </div>
        <div className={styles.Description}>
          {permissionState === 'prompt' && (
            <>
              Your browser will prompt you to allow access to devices on your local network when 
              connecting to Dynamo Desktop. This permission is required for the Desktop connection 
              to work. Please click <strong>"Allow"</strong> when the prompt appears.
            </>
          )}
          {permissionState === 'denied' && (
            <>
              Access to local network devices has been blocked. To use Desktop mode, please 
              allow this permission in your browser settings (click the lock icon in the address bar, 
              then enable "Access to devices on your local network").
            </>
          )}
        </div>
      </div>
    </div>
  );
}
