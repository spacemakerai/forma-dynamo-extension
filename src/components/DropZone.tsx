import { useCallback, useState } from "preact/hooks";
import { Import } from "../assets/icons/Import";

export function DropZone<T>({
  filetypes,
  parse,
  onFileDropped,
}: {
  filetypes: string[];
  parse: (file: File) => Promise<T>;
  onFileDropped: (file: T) => void;
}) {
  const [error, setError] = useState<boolean>(false);

  const onClickDropZone = useCallback(() => {
    setError(false);
    const input = document.createElement("input");
    input.type = "file";
    input.accept = filetypes.join(",");
    input.onchange = async () => {
      try {
        if (!input.files) return;
        const [file] = Array.from(input.files);
        onFileDropped(await parse(file));
      } catch (e) {
        setError(true);
      }
    };
    input.click();
  }, [onFileDropped, filetypes, parse]);

  // TODO: we don't need to handle multiple files
  const onDrop = useCallback<JSX.DragEventHandler<HTMLDivElement>>(
    (event) => {
      event.preventDefault();
      setError(false);
      if (event.dataTransfer?.items) {
        // Use DataTransferItemList interface to access the file(s)
        [...(event.dataTransfer?.items || [])].forEach(async (item) => {
          // If dropped items aren't files, reject them
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (file) {
              try {
                onFileDropped(await parse(file));
              } catch (e) {
                setError(true);
              }
            }
          } else {
            setError(true);
          }
        });
      } else {
        // Use DataTransfer interface to access the file(s)
        [...(event.dataTransfer?.files || [])].forEach(async (file) => {
          try {
            onFileDropped(await parse(file));
          } catch (e) {
            setError(true);
          }
        });
      }
    },
    [onFileDropped, parse],
  );

  return (
    <div
      id="dropzone"
      style={{ zIndex: 2, cursor: "pointer", position: "relative", flexGrow: 1 }}
      onClick={onClickDropZone}
    >
      <div
        style={{
          display: "flex",
          padding: "16px",
          backgroundColor: "white",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          border: "1px dashed var(--border-base)",
          borderRadius: "4px",
        }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDragEnd={(e) => {
          e.preventDefault();
        }}
        onDrop={onDrop}
      >
        <Import />
        <b>Drag & Drop</b>
        {error && (
          <div
            style={{ cursor: "pointer" }}
            onClick={(e) => {
              e.stopPropagation();
              setError(false);
            }}
          >
            <span style={{ color: "red" }}>Error: Failed to parse file.</span>
            <span> x</span>
          </div>
        )}
        {!error && <>Files to import ({filetypes.join(", ")})</>}
      </div>
    </div>
  );
}
