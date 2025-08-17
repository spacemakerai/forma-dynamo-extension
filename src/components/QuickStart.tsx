import { useCallback, useState } from "preact/compat";
import forum from "../assets/quickstart/forum.png";
import lucky from "../assets/quickstart/lucky.png";
import youtube from "../assets/quickstart/youtube.png";

const showQuickStart = localStorage.getItem("showQuickStart") !== "false";

export function QuickStart({ openSample }: { openSample: () => void }) {
  const [isOpen, setIsOpen] = useState(showQuickStart);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem("showQuickStart", "false");
  }, []);

  if (!isOpen) return null;

  return (
    <div
      style={{
        zIndex: 1000,
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          width: "100%",
          height: "100%",
          maxWidth: "400px",
          textAlign: "center",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-evenly",
        }}
      >
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "5px 10px",
            fontSize: "16px",
            borderRadius: "5px",
            border: "none",
            backgroundColor: "white",
            color: "black",
            cursor: "pointer",
          }}
          onClick={handleClose}
        >
          <weave-close />
        </button>

        <h2 style={{ margin: "0 0 10px 0", fontWeight: 700, fontSize: "12px" }}>Quick Start</h2>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
          }}
        >
          {[
            {
              src: lucky,
              alt: "Lucky",
              title: "I feel Lucky",
              onClick: () => {
                openSample();
                setIsOpen(false);
              },
            },
            {
              src: forum,
              alt: "Forum",
              onClick: () =>
                window.open(
                  "https://forum.dynamobim.com/t/dynamo-challenge-03-make-anything-with-dynamo-as-a-service-daas-in-forma/109225",
                  "_blank",
                  "noopener noreferrer",
                ),
              title: "Dynamo Forum Challenge",
            },
            {
              src: youtube,
              alt: "YouTube",
              onClick: () =>
                window.open(
                  "https://www.youtube.com/playlist?list=PLY-ggSrSwbZqlbQG1i45bpT8clCJp08wD",
                  "_blank",
                  "noopener noreferrer",
                ),
              title: "Learn how to write graphs",
            },
          ].map((item, index) => (
            <div
              key={index}
              style={{
                position: "relative",
                height: "120px",
                backgroundColor: "#333",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                cursor: "pointer",
                justifyContent: "center",
                alignItems: "center",
                transition: "transform 0.3s ease, background-color 0.3s ease",
              }}
              onMouseDown={() => {
                item.onClick();
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                const img = target.querySelector("img") as HTMLImageElement | null;
                const overlay = target.querySelector("div") as HTMLDivElement | null;
                if (img) img.style.transform = "scale(1.1)";
                if (overlay) overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLDivElement;
                const img = target.querySelector("img") as HTMLImageElement | null;
                const overlay = target.querySelector("div") as HTMLDivElement | null;
                if (img) img.style.transform = "scale(1)";
                if (overlay) overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
              }}
            >
              <img
                src={item.src}
                alt={item.alt}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.8,
                  transition: "transform 0.3s ease",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "0",
                  left: "0",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0, 0, 0, 0.5)",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "bold",
                  textAlign: "center",
                  transition: "background-color 0.3s ease",
                }}
              >
                {item.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
