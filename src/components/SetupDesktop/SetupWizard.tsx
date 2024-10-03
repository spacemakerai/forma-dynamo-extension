import { useState } from "preact/hooks";
import { SetupInstructions } from "./SetupInstructions";
import styles from "./SetupWizard.module.pcss";

export type InstallationMethod = "revit" | "civil3d" | "dynamo";

const installationMethodArray: InstallationMethod[] = ["revit", "civil3d", "dynamo"];
type InstallationMethodProps = {
  title: string;
  imagePath: string;
};

const installationMethods: Record<InstallationMethod, InstallationMethodProps> = {
  revit: { title: "Revit", imagePath: "src/assets/images/revit.png" },
  civil3d: { title: "Civil 3D", imagePath: "src/assets/images/civil3d.png" },
  dynamo: { title: "Dynamo Sandbox Package", imagePath: "src/assets/images/dynamo.png" },
};

export const SetupWizard = () => {
  const [selectedSoftware, setSelectedSoftware] = useState<InstallationMethod | null>(null);

  const openInstructions = (software: InstallationMethod) => {
    setSelectedSoftware(software);
  };

  return (
    <div className={styles.Container}>
      {selectedSoftware ? (
        <SetupInstructions
          selectedSoftware={selectedSoftware}
          setSelectedSoftware={setSelectedSoftware}
        />
      ) : (
        <>
          <b className={styles.Heading}>Install Dynamo using any of the following methods</b>
          {installationMethodArray.map((method) => (
            <div
              key={method}
              onClick={() => openInstructions(method)}
              className={styles.InstallationMethod}
            >
              <div className={styles.InstallationMethodImageContainer}>
                <img
                  src={installationMethods[method].imagePath}
                  alt=""
                  className={styles.InstallationMethodImage}
                />
              </div>
              <div className={styles.InstallationMethodTitle}>
                {installationMethods[method].title}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
