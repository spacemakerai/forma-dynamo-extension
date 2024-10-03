import { useState } from "preact/hooks";
import { InstallationMethod } from "./SetupWizard";
import styles from "./SetupInstructions.module.pcss";
import { useDynamoConnector } from "../../DynamoConnector";

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
        animation: "src/assets/animations/revit-step-1.mp4",
      },
      {
        title: "Open Dynamo from Revit",
        description: "Make sure you have Revit 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/revit-step-2.mp4",
      },
      {
        title: "Install FormaDynamo package",
        description:
          "Install the DynamoFormaBeta package from the Package Manager in Dynamo. Package versions 2.0 and higher support Dynamo for Revit 2025",
        animation: "src/assets/animations/revit-step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/revit-step-4.mp4",
      },
    ],
    civil3d: [
      {
        title: "Launch Civil 3D",
        description: "Make sure you have Civil 3D 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/civil3d-step-1.mp4",
      },
      {
        title: "Open Dynamo from Civil 3D",
        description: "Make sure you have Civil 3D 2024.1 or higher installed with Dynamo",
        animation: "src/assets/animations/civil3d-step-2.mp4",
      },
      {
        title: "Install FormaDynamo package",
        description:
          "Install the DynamoFormaBeta package from the Package Manager in Dynamo. Package versions 2.0 and higher support Dynamo for Civil 3D 2025",
        animation: "src/assets/animations/civil3d-step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/civil3d-step-4.mp4",
      },
    ],
    dynamo: [
      {
        title: "Step 1",
        description: "Description for step 1",
        animation: "src/assets/animations/dynamo-step-1.mp4",
      },
      {
        title: "Step 2",
        description: "Description for step 2",
        animation: "src/assets/animations/dynamo-step-2.mp4",
      },
      {
        title: "Step 3",
        description: "Description for step 3",
        animation: "src/assets/animations/dynamo-step-3.mp4",
      },
      {
        title: "You're all set",
        description: "You've now set up the connection and can use it in Forma",
        animation: "src/assets/animations/dynamo-step-4.mp4",
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

  const dynamoLocal = useDynamoConnector();

  const checkConnection = () => {
    console.log(dynamoLocal);
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
      <div className={styles.ButtonContainer}>
        {currentStep === 0 ? (
          <weave-button onClick={() => setSelectedSoftware(null)}>Back</weave-button>
        ) : (
          <weave-button onClick={handlePrevious} disabled={currentStep === 0}>
            Previous
          </weave-button>
        )}
        {currentStep === steps.length - 1 ? (
          <weave-button variant="solid" onClick={() => checkConnection()}>
            Finish
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
