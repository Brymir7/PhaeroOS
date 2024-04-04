import { ReactNode, useContext } from "react";
import { TutorialContext } from "../contexts/TutorialContext";

interface Props {
  children: ReactNode;
  step: number;
  extraClasses?: string;
  zIndex?: number;
}

const TutorialStep = ({ children, step, extraClasses, zIndex = 33 }: Props) => {
  const { currentTutorialStep } = useContext(TutorialContext);

  return (
    <div
      style={{ zIndex: currentTutorialStep === step ? zIndex : 0 }}
      className={`${
        currentTutorialStep === step && "relative"
      } ${extraClasses}`}
    >
      {children}
    </div>
  );
};

export default TutorialStep;
