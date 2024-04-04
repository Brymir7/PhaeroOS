import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useContext } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AnimatedCheckbox } from "./Buttons";

export interface UserSurvey {
  [key: string]: [boolean, string];
}
interface ConfirmSurveyProps {
  survey: UserSurvey;
  title: string;
  expandedView: boolean;
  handleQuestionChange: (key: string, value: boolean) => void;
  handlePrev: () => void;
  handleNext: () => void;
  hasViewed: boolean;
}

export const RenderSurvey = ({
  expandedView,
  survey,
  title,
  handleQuestionChange,
  handleNext,
  handlePrev,
  hasViewed,
}: ConfirmSurveyProps) => {
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <div
      className={`flex flex-col w-full border border-blue-500 rounded-md mb-1`}
    >
      <Accordion expanded={expandedView}>
        <AccordionSummary
          sx={{
            // height: "48px", // Set your desired height
            // minHeight: "48px", // Override the minimum height
            "& .MuiAccordionSummary-content": {
              margin: "0px", // Adjust content margin to align vertically centered
            },
          }}
          style={{ padding: 0, pointerEvents: "none" }}
        >
          <p className="font-bold text-3xl mx-4 text-blue-400">
            <span
              className={`text-green-500 mr-4 ${
                !hasViewed && "text-transparent"
              } `}
            >
              <FontAwesomeIcon icon={faCheck} />
            </span>

            {title}
          </p>
        </AccordionSummary>

        <AccordionDetails sx={{ px: 0, pt: 0 }}>
          <List sx={{ p: 0 }}>
            {Object.entries(survey).map(([key, [value, text]], index) => (
              <ListItemButton
                sx={{ py: 2.5 }}
                key={index}
                onClick={() => handleQuestionChange(key, !value)}
              >
                <ListItemIcon sx={{ p: 0 }}>
                  <AnimatedCheckbox xMark isChecked={value} />
                </ListItemIcon>
                <ListItemText
                  primary={mapKeys(text)}
                  primaryTypographyProps={{
                    sx: { fontSize: "14px", textTransform: "none", pl: 1 },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
          <div className="flex justify-end px-6 space-x-4 mt-2">
            <Button variant="outlined" onClick={handlePrev}>
              {mapKeys("Back")}
            </Button>
            <Button variant="contained" onClick={handleNext}>
              {mapKeys("Process")}
            </Button>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};
