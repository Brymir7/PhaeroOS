import React, { useContext } from "react";
import { Button, Typography, styled, useTheme } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { MapKeysContext } from "../contexts/MapKeysContext";

interface Props {
  onClick: () => void;
  text: string | React.ReactNode;
  classes?: string;
}
export const ArrowButton: React.FC<Props> = ({ onClick, text, classes }) => {
  return (
    <Button
      variant="contained"
      endIcon={<FontAwesomeIcon icon={faArrowRight} />}
      onClick={onClick}
    >
      <span className={classes}>{text}</span>
    </Button>
  );
};
interface FancyButtonProps {
  onClick: () => void;
  text: string | React.ReactNode;
  active?: boolean;
}

export const DebthButton: React.FC<FancyButtonProps & { darkMode?: boolean }> = ({
  onClick,
  text,
  active = false,
  darkMode = false,
}) => {
  return (
    <button
      onClick={onClick}
      className="relative inline-block px-4 py-2 font-medium group cursor-pointer"
    >
      <span
        className={`absolute inset-0 w-full rounded-md h-full transition duration-200 ease-out transform ${active ? "" : "translate-x-1 translate-y-1"
          } ${darkMode ? "bg-white group-hover:-translate-x-0 group-hover:-translate-y-0" : "bg-black group-hover:-translate-x-0 group-hover:-translate-y-0"}`}
      />
      <span
        className={`absolute inset-0 w-full rounded-md h-full border-2 ${active ? "bg-secondary" : darkMode ? "bg-[#000] hover:bg-[#333]" : "bg-[#fff] hover:bg-[#e8e8e8]"
          } ${darkMode ? "border-white" : "border-black"}`}
      />
      <Typography className={`${darkMode && !active ? "text-white" : "text-black"} relative rounded-md`}>{text}</Typography>
    </button>
  );
};

interface ToggleButtonProps {
  active?: boolean;
  onClick?: () => void;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  active = false,
  onClick = () => { },
}) => {
  return (
    <label className="inline-flex relative items-center cursor-pointer select-none">
      <input
        type="checkbox"
        onClick={() => onClick()}
        readOnly={true}
        checked={active}
        className="sr-only peer"
      />
      <div
        className="w-11 h-6 
        bg-gray-600
        after:content-['']
        after:absolute 
        after:top-0.5
        after:left-[0.1rem]
        peer-checked:after:left-[1.4rem]
        after:bg-white
        after:border-gray-300
        after:-50
        after:border
        after:rounded-full
        after:h-5
        after:w-5
        after:transition-all
        peer-checked:bg-blue-600
        rounded-full"
      ></div>
    </label>
  );
};

export const FancyToggleButton: React.FC<ToggleButtonProps> = ({
  active = false,
  onClick = () => { },
}) => {
  return (
    <label className="inline-flex relative items-center cursor-pointer select-none">
      <input
        type="checkbox"
        onClick={() => onClick()}
        readOnly={true}
        checked={active}
        className="sr-only peer"
      />
      <div
        className="w-24 h-10 
        shadow-inner
        shadow-green-300
        peer-checked:shadow-green-400
        bg-green-100
        after:content-['']
        after:absolute 
        after:top-1
        after:left-[0.3rem]
        peer-checked:after:left-[3.6rem]
        after:bg-[#22c55e]
        after:-50
        after:rounded-full
        after:h-8
        after:w-8
        after:transition-all
        transition-colors
        duration-300
        peer-checked:bg-green-200
        rounded-full"
      ></div>
    </label>
  );
};
const CheckboxContainer = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${theme.palette.primary.main}`,
  width: '32px', // w-8
  height: '32px', // h-8
  borderRadius: '8px', // rounded-lg
  backgroundColor: theme.palette.background.paper,
}));
interface AnimatedCheckboxProps {
  isChecked: boolean;
  extraClasses?: string;
  xMark?: boolean;
}

export const AnimatedCheckbox = ({
  isChecked,
  extraClasses,
  xMark = false,
}: AnimatedCheckboxProps) => {
  const checkAnimationVariant = {
    unchecked: {
      pathLength: 0,
      strokeWidth: 0,
    },
    checked: {
      pathLength: 1,
      strokeWidth: 2,
    },
  };
  const theme = useTheme();
  return (
    <CheckboxContainer className={extraClasses}>
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {xMark ? (
          <svg
            fill="none"
            viewBox="0 0 24 24"
            id="cross"
            data-name="Flat Line"
            xmlns="http://www.w3.org/2000/svg"
            className="icon flat-line"
          >
            <motion.path
              id="primary"
              d="M19,19,5,5M19,5,5,19"
              fill="none"
              stroke={theme.palette.primary.main}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              variants={checkAnimationVariant}
              initial="unchecked"
              animate={isChecked ? "checked" : "unchecked"}
            ></motion.path>
          </svg>
        ) : (
          <motion.path
            d="M4 12.6111L8.92308 17.5L20 6.5"
            stroke={theme.palette.primary.main}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={checkAnimationVariant}
            initial="unchecked"
            animate={isChecked ? "checked" : "unchecked"}
          ></motion.path>
        )}
      </svg>
    </CheckboxContainer>
  );
};
interface MapKeyedButtonProps {
  onClick: () => void;
  text: string;
  classes?: string;
  variant?: 'text' | 'outlined' | 'contained';
  color?: 'inherit' | 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  minHeigth?: string;
  minWidth?: string;
  maxHeigth?: string;
  maxWidth?: string;
  icon?: IconDefinition;
  startIcon?: React.ReactNode;
  [key: string]: any;
}

export const MapKeyedButton: React.FC<MapKeyedButtonProps> = ({
  onClick,
  text,
  classes,
  variant = 'outlined',
  color = 'primary',
  minHeigth = '60px',
  maxHeigth = '60px',
  minWidth = '100px',
  maxWidth = '100px',
  startIcon,
  icon,
  ...props
}) => {
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Button
      onClick={onClick}
      variant={variant}
      color={color}
      className={classes}
      startIcon={startIcon}

      sx={{
        minHeight: minHeigth,
        minWidth: minWidth,
        maxHeight: maxHeigth,
        maxWidth: maxWidth,
      }}
      {...props}
      endIcon={icon ? <FontAwesomeIcon icon={icon} /> : null}
    >
      {mapKeys(text)}
    </Button>
  );
};
