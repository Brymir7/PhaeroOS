import React from "react";
import "./SpeakButton.css";

import {Microphone2} from "iconsax-react"
import { useTheme } from "@mui/material";
interface Props {
  isListening: boolean;
  isPaused: boolean;
  onSpeakButtonClick: () => void;
}

const SpeakButton: React.FC<Props> = ({
  isListening,
  onSpeakButtonClick,
  isPaused,
}) => {
  const handleSpeakButtonClick = () => {
    onSpeakButtonClick();
  };
    const theme = useTheme();
  return (
    <>
      <input
        type="checkbox"
        checked={isListening}
        readOnly={true}
        id="micButton"
        className="mic-checkbox pointer-events-none "
      />
      <label
        onClick={handleSpeakButtonClick}
        htmlFor="micButton"
        className={`mic-button cursor-pointer bg-white`}
      >
        <div className="mic relative">
          <div
            className={`mic-button-loader mic-button-loader-animation ${
              isPaused && "mic-button-loader-paused"
            }`}
          ></div>
          <div className="text-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ">
            
            <Microphone2 size={theme.iconSize.large} color={theme.palette.primary.main}/>
          </div>
          <div className="mic-base"></div>
        </div>
        <div className="button-message text-xl flex justify-center">
            <Microphone2 size={theme.iconSize.large} color={theme.palette.primary.main}/>
        </div>
      </label>
    </>
  );
};

export default SpeakButton;
