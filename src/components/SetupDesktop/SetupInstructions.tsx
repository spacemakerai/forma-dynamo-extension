import { useState } from "preact/hooks";
import { InstallationMethod } from "./SetupWizard";
import styles from "./SetupInstructions.module.pcss";

type Props = {
  selectedSoftware: InstallationMethod;
  setSelectedSoftware: (software: InstallationMethod | null) => void;
};

export const SetupInstructions: React.FC<Props> = ({ selectedSoftware, setSelectedSoftware }) => {
  type Step = {
    title: string;
    description: string;
    animation: string;
  };

  const installationSteps: { [key in InstallationMethod]: Step[] } = {
    revit: [
      {
        title: "Launch Revit",
        description: "Make sure you have Revit 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/step-1.mp4",
      },
      {
        title: "Open Dynamo from Revit",
        description: "Make sure you have Revit 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/step-2.mp4",
      },
      {
        title: "Install FormaDynamo package",
        description:
          "Install the DynamoFormaBeta package from the Package Manager in Dynamo. Package versions 2.0 and higher support Dynamo for Revit 2025",
        animation: "src/assets/animations/step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/step-4.mp4",
      },
    ],
    civil3d: [
      {
        title: "Launch Civil 3D",
        description: "Make sure you have Civil 3D 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/step-1.mp4",
      },
      {
        title: "Open Dynamo from Civil 3D",
        description: "Make sure you have Civil 3D 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/step-2.mp4",
      },
      {
        title: "Install FormaDynamo package",
        description:
          "Install the DynamoFormaBeta package from the Package Manager in Dynamo. Package versions 2.0 and higher support Dynamo for Civil 3D 2025",
        animation: "src/assets/animations/step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/step-4.mp4",
      },
    ],
    dynamo: [
      {
        title: "Download Dynamo",
        description: "Download Dynamo 2.18.0 or higher",
        animation: "src/assets/animations/step-1.mp4",
      },
      {
        title: "Install Dynamo",
        description: "Follow the steps to install the software",
        animation: "src/assets/animations/step-2.mp4",
      },
      {
        title: "Install the DynamoFormaBeta package",
        description: "Type DynamoFormaBeta in the search field and install the package",
        animation: "src/assets/animations/step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/step-4.mp4",
      },
    ],
  };

  const steps = installationSteps[selectedSoftware];

  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className={styles.SetupInstructionsContainer}>
      <div className={styles.AnimationContainer}>
        <video
          className={styles.Animation}
          src={steps[currentStep].animation}
          autoPlay
          loop
          muted
        />
      </div>
      <div className={styles.StepTitle}>
        {currentStep + 1}. {steps[currentStep].title}
      </div>
      <div className={styles.StepDescription}>{steps[currentStep].description}</div>
      {currentStep === steps.length - 1 && (
        <div className={styles.StepDescription}>
          The app will automatically detect once a connection is established and redirect you to the
          home page
        </div>
      )}
      <div className={styles.ButtonContainer}>
        {currentStep === 0 ? (
          <weave-button onClick={() => setSelectedSoftware(null)}>Back</weave-button>
        ) : (
          <weave-button onClick={handlePrevious} disabled={currentStep === 0}>
            Previous
          </weave-button>
        )}
        {currentStep === steps.length - 1 ? (
          <weave-button variant="solid" onClick={() => setSelectedSoftware(null)}>
            Close
          </weave-button>
        ) : (
          <weave-button
            variant="solid"
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          >
            Next
          </weave-button>
        )}
      </div>
    </div>
  );
};
