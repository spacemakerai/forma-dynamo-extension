import styles from "./GraphItem.module.pcss";
import Logo from "../../assets/Logo.png";
import { Arrow } from "../../icons/Arrow";
import { useCallback, useRef, useState } from "preact/hooks";
import { useClickOutside } from "./ClickOutside";

type Props = {
  name: string;
  graph: any;
  onOpen?: () => void;
  onRemove?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDownload?: () => void;
};

const GraphItem = ({ name, graph, onOpen, onRemove, onShare, onEdit, onDownload }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
  }>();
  const onClose = useCallback(() => {
    setMenuPosition(undefined);
  }, []);
  const ref = useRef<HTMLElement | null>(null);
  useClickOutside(ref, onClose);
  const hasActionItems = onRemove || onShare || onEdit || onDownload;
  const isExpandable =
    graph?.graph?.Description || graph?.graph?.Author || graph?.metadata?.publisher?.name;

  return (
    <div style={{ width: "100%" }} key={graph.Id}>
      <div
        className={[styles.GraphContainer, isExpandable ? styles.Expandable : ""].join(" ")}
        onClick={isExpandable ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className={styles.GraphInfo}>
          <div
            className={[
              styles.ArrowContainer,
              isExpanded && isExpandable ? styles.Expanded : "",
            ].join(" ")}
          >
            <Arrow />
          </div>
          <img className={styles.GraphIcon} src={Logo} />
          <div className={styles.GraphName}>{name}</div>
        </div>
        <div className={styles.GraphActions}>
          {onOpen && (
            <weave-button
              style={{ "--button-height": "20px", width: "50px" }}
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
            >
              Open
            </weave-button>
          )}
          {hasActionItems && (
            <div
              style={{
                height: "16px",
                width: "16px",
                transform: "rotate(90deg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={(e) => {
                e.stopPropagation();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                setMenuPosition({ left: rect.right - 85, top: rect.bottom + 5 });
              }}
            >
              <weave-tripple-dot />
            </div>
          )}
        </div>
      </div>
      <div
        className={[
          styles.GraphDetailsContainer,
          isExpanded ? styles.GraphDetailsExpanded : "",
        ].join(" ")}
      >
        <div className={styles.GraphDetails}>
          <div className={styles.GraphDescription}>{graph?.graph?.Description}</div>
          <div className={styles.GraphAuthor}>
            <b>Author:</b> {graph?.graph?.Author}
          </div>
          <div className={styles.GraphPublisher}>
            <b>Publisher:</b> {graph?.metadata?.publisher?.name}
          </div>
        </div>
      </div>
      {menuPosition && hasActionItems && (
        <forma-context-menu-container {...menuPosition}>
          <forma-context-menu ref={ref} style={{ "--menu-min-width": "80px" }}>
            {onRemove && (
              <forma-context-menu-item
                text="Remove"
                onClick={() => {
                  onRemove();
                }}
              />
            )}
            {onDownload && (
              <forma-context-menu-item
                text="Download"
                onClick={() => {
                  onDownload();
                }}
              />
            )}
            {onEdit && (
              <forma-context-menu-item
                text="Edit"
                onClick={() => {
                  onEdit();
                }}
              />
            )}
            {onShare && (
              <forma-context-menu-item
                text="Share"
                onClick={() => {
                  onShare();
                }}
              />
            )}
          </forma-context-menu>
        </forma-context-menu-container>
      )}
    </div>
  );
};

export default GraphItem;
