import React, { createContext, useContext, useEffect, useState } from "react";
import { useWindowWidth } from "../utils/CustomHooks";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogActions,
  Button,
  LinearProgress,
  Typography,
  Divider,
  Box,
} from "@mui/material";
import { MapKeysContext } from "./MapKeysContext";

interface TutorialContextType {
  currentTutorialStep: number;
  navbarOpen: boolean;
  startTutorial: () => void;
}

export const TutorialContext = createContext<TutorialContextType>({
  currentTutorialStep: -1,
  startTutorial: () => {},
  navbarOpen: false,
});

export const TutorialProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(() => {
  //   const storedStep = localStorage.getItem("currentTutorialStep");
  //   return storedStep && storedStep !== "NaN" ? parseInt(storedStep, 10) : 0; // Default to 1 if storedStep is null or undefined
  // });
  const [currentTutorialStep, setCurrentTutorialStep] = useState<number>(-1);
  const { mapKeys } = useContext(MapKeysContext);
  const navigate = useNavigate();
  const windowWidth = useWindowWidth();
  const stepCount = 5;

  const stepToPage: string[] = [
    "/home",
    "/home",
    windowWidth < 768 ? "/home/checklist" : "/home",
    windowWidth < 768 ? "/home/checklist" : "/home",
    "/home/feedback",
    "/home/notes",
    // "/home/statistics",
  ];

  const stepToText: JSX.Element[] = [
    <div className="space-y-1" key={0}>
      <p>{mapKeys("Here you can record or write your journal entries.")}</p>
      <p>
        {mapKeys(
          "Your recordings are transcribed into text. Additionally, you have the option to upload pictures of food or your handwritten notes, which will also be transformed into digital text. Press the plus (+) button for more, later!"
        )}
      </p>
    </div>,
    <div key={1}>
      <p>
        {mapKeys(
          "Once your entry has the right length you can press this button to extract the information about your day. This can only be done once a day."
        )}
      </p>
      <p>
        {mapKeys(
          "Initially, our system aims to understand the caloric content of the foods you consume. It will prompt you to input the calories, but you only have to do this once for accurate information! You will also be able to preemptively add your favourite foods or meals."
        )}
      </p>
    </div>,
    <div className="space-y-1" key={2}>
      <p>
        {mapKeys(
          "With your checklist you can explicitly track certain activities that you want to do. For example you could say that you want to go to the gym until tomorrow and then check it off when you have done it."
        )}
      </p>
    </div>,
    <div className="space-y-1" key={3}>
      <p>
        {mapKeys(
          "If you want to start doing something daily, our habit tracker can help you keep track of your progress. If you stay consistent you can see a cool graph of your daily activity."
        )}
      </p>
    </div>,
    <p key={5}>
      {mapKeys(
        "Here you can search through your previous entries and sort them by how well you felt on those days."
      )}
      <p key={5}>
        {mapKeys(
          "So you can judge for yourself what you did on those days and how it influenced your wellbeing."
        )}
      </p>
      <p key={5}>
        {mapKeys("This concludes the tutorial. If you want to see it again look into the settings under HELP!. Enjoy using the app!")}
      </p>
    </p>,
    // <p key={6}>{mapKeys("This is where you can see your statistics")}</p>,
  ];

  useEffect(() => {
    // Persist current step to localStorage or sessionStorage
    localStorage.setItem("currentTutorialStep", currentTutorialStep.toString());
  }, [currentTutorialStep]);

  useEffect(() => {
    if (currentTutorialStep >= 0) {
      if (stepToPage[currentTutorialStep] !== window.location.pathname) {
        navigate(stepToPage[currentTutorialStep]);
      }
    }
  }, [currentTutorialStep, window.location.pathname]);

  const updateWIndowLoacation = (newStep: number) => {
    if (newStep > 0) {
      if (stepToPage[newStep] !== window.location.pathname) {
        navigate(stepToPage[newStep]);
      }
    }
  };

  const goToNextStep = () => {
    if (currentTutorialStep < stepCount) {
      const newStep = currentTutorialStep + 1;
      updateWIndowLoacation(newStep);
      setCurrentTutorialStep(newStep);
    } else {
      navigate("/home");
      setCurrentTutorialStep(-1);
    }
  };

  const goToPreviousStep = () => {
    const newStep = currentTutorialStep - 1;
    if (newStep >= 0) {
      updateWIndowLoacation(newStep);
      setCurrentTutorialStep(newStep);
    }
  };

  return (
    <TutorialContext.Provider
      value={{
        currentTutorialStep,
        startTutorial: () => {
          setCurrentTutorialStep(0);
        },
        navbarOpen: [2, 3, 4, 5].includes(currentTutorialStep),
      }}
    >
      {currentTutorialStep >= 0 &&
        window.location.pathname.startsWith("/home") && (
          <div id="tutorial-overlay" />
        )}
      {children}
      <Dialog
        maxWidth="xs"
        hideBackdrop
        className="z-40 absolute right-0"
        open={currentTutorialStep >= 0}
      >
        <Typography sx={{ fontSize: "1.5rem", px: 2, py: 1 }}>
          {mapKeys("Getting Started")}
        </Typography>
        <Divider />
        <Box component="div"  sx={{ padding: 2, marginBottom: 2 }}>{stepToText[currentTutorialStep] as any}</Box>  
        <Divider />
        <DialogActions sx={{ py: 0.5, px: 2, gap: 2 }}>
          {currentTutorialStep === 0 ? (
            <Button color="error" onClick={() => setCurrentTutorialStep(-1)}>
              {mapKeys("Skip")}
            </Button>
          ) : (
            <Button onClick={goToPreviousStep}>{mapKeys("Back")}</Button>
          )}

          <Button variant="outlined" onClick={goToNextStep}>
            {mapKeys(currentTutorialStep === stepCount ? "Finish" : "Next")}
          </Button>
        </DialogActions>
        <LinearProgress
          variant="determinate"
          value={(currentTutorialStep * 100) / stepCount}
        />
      </Dialog>
    </TutorialContext.Provider>
  );
};
