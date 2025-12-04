import { useState } from "preact/hooks";
import civil3dImage from "../../assets/images/civil3d.png";
import dynamoImage from "../../assets/images/dynamo.png";
import revitImage from "../../assets/images/revit.png";
import { LocalNetworkAccessPrompt } from "./LocalNetworkAccessPrompt";
import { SetupInstructions } from "./SetupInstructions";
import styles from "./SetupWizard.module.pcss";

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
          <LocalNetworkAccessPrompt />
          <div>
            <div className={styles.Heading}>
              Searching for a Dynamo instance with the DynamoFormaBeta package installed on your
              machine. You will be redirected automatically once a connection is established.
            </div>
            <div className={styles.Heading}>
              If Dynamo with the DynamoFormaBeta package is not installed, you can set it up using
              one of the following methods:
            </div>
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
