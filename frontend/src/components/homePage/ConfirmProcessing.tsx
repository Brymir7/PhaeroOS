import { useContext, useEffect, useRef, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Dialog,
} from "@mui/material";
import { RenderSurvey } from "../utils/UserSurvey";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import WellbeingSlider from "../utils/WellbeingSlider";

export interface UserSurvey {
  [key: string]: [boolean, string];
}

type ConfirmProcessingProps = {
  onConfirm: (
    surveyData: UserSurvey,
    wellbeingScore: number,
    tags: number[]
  ) => void;
  onCancel: () => void;
};

function ConfirmProcessing({
  onConfirm,
  onCancel,
}: ConfirmProcessingProps): JSX.Element {
  const { mapKeys } = useContext(MapKeysContext);
  const [step, setStep] = useState<number>(0);
  const [userSleepSurvey, setUserSleepSurvey] = useState<UserSurvey>({
    // NOTE MAP THESE WITH MAPKEYS
    sleepQuestion1: [
      false,
      "Did it take you a long time to fall asleep? (>30min)",
    ],
    sleepQuestion2: [false, "Did you wake up during the night?"],
    sleepQuestion3: [false, "Did you still feel tired when you woke up?"],
    sleepQuestion4: [false, "Did you feel tired during the day?"],
    sleepQuestion5: [false, "Did you have a lack of energy during the day?"],
    // sleepQuestion6: [false, "Did you have a nap during the day?"],
    // Do you snore, Do you snooze the alarm.
  });
  /* NOTE that you cannot change the order of these cause they ll be used like this in the backend*/

  const [wellbeingScore, setWellbeingScore] = useState<number>(5);

  const handleSleepQuestionChange = (key: string, newValue: boolean) => {
    setUserSleepSurvey({
      ...userSleepSurvey,
      [key]: [newValue, userSleepSurvey[key][1]],
    });
  };

  const handleConfirm = () => {
    onConfirm(userSleepSurvey, wellbeingScore, []);
    onCancel();
  };

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Use useRef to store the debounce timer

  const handleSliderChange = (newValue: number) => {
    // Clear any existing timer to ensure only the last change is acted upon
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer
    debounceTimerRef.current = setTimeout(() => {
      setWellbeingScore(newValue);
    }, 500); // 500ms delay
  };

  // Cleanup logic: Clear the debounce timer when the component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []); // Empty array ensures this effect runs only on mount and unmount

  return (
    <Dialog
      open
      onClose={onCancel}
      fullWidth
      style={{ maxWidth: "500px", margin: "auto" }}
    >
      <div className="flex flex-col w-full px-2 py-2">
        <div
          className={`flex flex-col w-full border border-blue-500 rounded-md mb-1`}
        >
          <Accordion expanded={step === 0}>
            <AccordionSummary
              sx={{
                height: "48px", // Set your desired height
                minHeight: "48px", // Override the minimum height
                "& .MuiAccordionSummary-content": {
                  margin: "0px", // Adjust content margin to align vertically centered
                },
              }}
              style={{ padding: 0, pointerEvents: "none" }}
            >
              <p className="font-bold text-3xl my-2 mx-4 text-blue-400">
                <span
                  className={`text-green-500 mr-4 ${
                    step < 1 && "text-transparent"
                  } `}
                >
                  <FontAwesomeIcon icon={faCheck} />
                </span>
                Wellbeing
              </p>
            </AccordionSummary>

            <AccordionDetails>
              <div className="max-w-[350px] mx-auto">
                <p className="font-bold mb-3">
                  {mapKeys("How did you feel today?")}
                </p>
                <WellbeingSlider
                  value={wellbeingScore}
                  setValue={handleSliderChange}
                />
              </div>
              <div className="flex justify-end px-6 space-x-4 mt-8">
                <Button variant="outlined" onClick={() => onCancel()}>
                  {mapKeys("Back")}
                </Button>
                <Button variant="contained" onClick={() => setStep(1)}>
                  {mapKeys("Next")}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </div>
        <RenderSurvey
          expandedView={step === 1}
          survey={userSleepSurvey}
          title={mapKeys("Sleep")}
          hasViewed={step > 1}
          handleQuestionChange={handleSleepQuestionChange}
          handleNext={() => {
            handleConfirm();
          }}
          handlePrev={() => {
            setStep(0);
          }}
        />
      </div>
    </Dialog>
  );
}

export default ConfirmProcessing;
