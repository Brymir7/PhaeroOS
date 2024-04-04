import React, { useContext, useEffect, useState } from "react";
import "./FeedbackButton.css";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { SkyTooltip } from "../utils/Tooltips";

interface Props {
  giveFeedback: () => void;
  daysLeft: number;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  surveyCompleted: boolean;
}

const FeedbackButton: React.FC<Props> = ({
  daysLeft,
  giveFeedback,
  isLoading,
  setIsLoading,
  surveyCompleted,
}) => {
  const [isReady, setIsReady] = React.useState<boolean>(false);
  const { mapKeys } = useContext(MapKeysContext);

  const handleClick = () => {
    if (isReady) {
      setIsReady(false);
      setIsLoading(true);
      giveFeedback();
    }
  };

  // check if feedback is ready
  useEffect(() => {
    if (daysLeft <= 0 && surveyCompleted) {
      setIsReady(true);
    } else {
      setIsReady(false);
    }
  }, [daysLeft, surveyCompleted]);

  // loading animation
  const sleep = (delay: number) =>
    new Promise((resolve) => setTimeout(resolve, delay));

  const interval = 100;
  const animationDuration = 1000;

  const animateBox = async (item: HTMLElement, delay: number) => {
    setTimeout(async () => {
      item.style.animation = "loading_anim 1s ease-in-out";
      await sleep(animationDuration);
      item.style.animation = "";
    }, delay);
  };

  const loading = () => {
    const box = document.querySelectorAll<HTMLElement>(".loader-box");
    box.forEach((item, index) => {
      animateBox(item, index * interval);
    });
  };

  useEffect(() => {
    if (isLoading) {
      loading();
      const animationInterval = setInterval(
        loading,
        animationDuration + interval * 7
      );
      const tooltipInterval = setInterval(() => {
        setIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % loadingTips.length;
          setCurrentTip(mapKeys(loadingTips[nextIndex]));

          // Check if the end of the array is reached
          if (nextIndex === loadingTips.length - 1) {
            clearInterval(tooltipInterval); // Clear the interval
          }

          return nextIndex;
        });
      }, 5000);

      return () => {
        clearInterval(animationInterval);
        clearInterval(tooltipInterval);
      };
    }
  }, [isLoading]);

  const loadingTips = [
    "Processing notes",
    "Reading",
    "Calculating corelations",
    "Extracting food data",
    "Looking for patterns",
    "Calculating activity level",
    "Crunching the numbers",
    "Processing notes again",
    "Writings feedback",
    "Taking a break",
    "Going for a walk",
    "Back to work",
    "Cooking",
    "Writings feedback",
    "Cleaning up",
    "Calculating space time",
    "Waiting",
    "Installing updates",
    "Don't turn off your pc",
    "Writings feedback",
    "almost done",
    "finishing up",
    "finishing up.",
    "finishing up..",
    "finishing up...",
  ];
  const [currentTip, setCurrentTip] = useState(loadingTips[0]);
  const [, setIndex] = useState(0);

  return (
    <SkyTooltip title={currentTip} open={isLoading} placement="top">
      <div
        className={`sparkle-button shadow-md rounded-full transition-transform duration-150 ${
          isReady ? "scale-100" : "pointer-events-none scale-95"
        } `}
      >
        <button
          className={`feedback-button w-fit h-24 rounded-full feedback-button-light`}
          onClick={handleClick}
        >
          {isReady ? <span className="spark"></span> : ""}
          <span className="backdrop"></span>
          {isLoading ? (
            <div className={`loading-body loading-colors-light`}>
              <div className="loader-box">
                <span className="loader-txt">L</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">o</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">a</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">d</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">i</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">n</span>
              </div>
              <div className="loader-box">
                <span className="loader-txt">g</span>
              </div>
            </div>
          ) : (
            <>
              <svg
                className="sparkle"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z"
                  fill="black"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z"
                  fill="black"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z"
                  fill="black"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={`text-dark`}>
                {daysLeft > 0 ? (
                  <p>
                    {daysLeft}
                    {" " + mapKeys("days left")}
                  </p>
                ) : (
                  mapKeys("Feedback")
                )}
              </span>
            </>
          )}
        </button>
      </div>
    </SkyTooltip>
  );
};

export default FeedbackButton;
