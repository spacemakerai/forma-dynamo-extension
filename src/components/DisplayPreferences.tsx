import { useState } from "preact/hooks";

export function DisplayPreferences({
  preferences,
  setPreferences,
}: {
  preferences: {
    sortNodes: boolean;
    hideCollectNodes: boolean;
  };
  setPreferences: (preferences: { sortNodes: boolean; hideCollectNodes: boolean }) => void;
}) {
  const [contextOpen, setContextOpen] = useState(false);

  return (
    <>
      <weave-tripple-dot style={{ cursor: "pointer" }} onClick={() => setContextOpen(true)} />
      {contextOpen && (
        <>
          <div
            onClick={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: "50px",
              right: "10px",
              marginTop: "8px",
              borderRadius: "5px",
              boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
              backgroundColor: "white",
              zIndex: 1000,
            }}
          >
            <div style={{ padding: "10px" }}>
              {/* Add your dropdown content here */}
              <h3>Display Preferences</h3>

              <div style={{ display: "flex", flexDirection: "row" }}>
                <weave-checkbox
                  checked={preferences.sortNodes}
                  onClick={() => {
                    setPreferences({ ...preferences, sortNodes: !preferences.sortNodes });
                  }}
                  showlabel={"true"}
                  label={"Sort nodes alphabetically"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "row" }}>
                <weave-checkbox
                  checked={preferences.hideCollectNodes}
                  onClick={() => {
                    setPreferences({
                      ...preferences,
                      hideCollectNodes: !preferences.hideCollectNodes,
                    });
                  }}
                  showlabel={"true"}
                  label={"Hide [...] nodes"}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "transparent",
              zIndex: 999,
            }}
            onClick={() => setContextOpen(false)}
          />
        </>
      )}
    </>
  );
}
