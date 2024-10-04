import { useState } from "preact/hooks";
import { SetupInstructions } from "./SetupInstructions";
import styles from "./SetupWizard.module.pcss";
import revitImage from "../../assets/images/revit.png";
import civil3dImage from "../../assets/images/civil3d.png";
import dynamoImage from "../../assets/images/dynamo.png";

export type InstallationMethod = "revit" | "civil3d" | "dynamo";

const installationMethodArray: InstallationMethod[] = ["revit", "civil3d", "dynamo"];
type InstallationMethodProps = {
  title: string;
  imagePath: string;
};

const installationMethods: Record<InstallationMethod, InstallationMethodProps> = {
  revit: { title: "Revit", imagePath: revitImage },
  civil3d: { title: "Civil 3D", imagePath: civil3dImage },
  dynamo: { title: "Dynamo Sandbox", imagePath: dynamoImage },
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
          <div className={styles.Heading}>
            Set up the DynamoFormaBeta package using one of the following methods:
          </div>
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
