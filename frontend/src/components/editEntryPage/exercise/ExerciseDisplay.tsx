import React, { useContext, useState } from "react";
import {
  ListItem,
  TextField,
  Box,
  Divider,
  Typography,
  ButtonGroup,
  Button,
  Tooltip,
  Fab,
  Paper,
  useTheme,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faCopy,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { ExerciseItem } from "../../utils/exerciseInterfaces";
import { buttonConfig } from "../../../pages/QuickAddButtonsExercise";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { formatExercise } from "./mapExerciseSmartly";
import { Trash } from "iconsax-react";
export interface ExerciseDisplayProps {
  exercise: ExerciseItem;
  deleteExercise: (exercise: ExerciseItem) => void;
  duplicateExercise: (exercise: ExerciseItem) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    exerciseItemIndex: number
  ) => void;
  mapKeyToLabel: (key: string) => string;
  goToNext?: () => void;
  goBack?: () => void;
  closeExerciseDisplay?: () => void;
}
export const mapExerciseRegardlessOfRepetitionInList = (exercise: string) => {
  const { mapExercises } = useContext(MapKeysContext);
  const regex = /\s*(\d+)$/;
  const second_regex = /\s\((\d+)\)$/;
  const cleanedExercise = exercise
    .replace(regex, "")
    .replace(second_regex, "")
    .trim();
  return mapExercises(cleanedExercise);
};
const ExerciseDisplay = ({
  exercise,
  deleteExercise,
  duplicateExercise,
  closeExerciseDisplay,
  handleChange,
  mapKeyToLabel,
  goToNext,
  goBack,
}: ExerciseDisplayProps) => {
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const theme = useTheme();
  const handleButtonClick = (value: number) => {
    if (focusedField) {
      handleChange(
        {
          target: {
            name: focusedField,
            value: value === 0 ? 0 : (exercise[focusedField] as number) + value,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>,
        0
      );
    }
  };

  return (
    <Paper style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
      <div className="relative pb-10">
        {closeExerciseDisplay && (
          <Button
            color="primary"
            sx={{ marginX: "auto" }}
            onClick={closeExerciseDisplay}
          >
            <FontAwesomeIcon
              icon={faXmark}
              className="cursor-pointer"
              size="2xl"
            />
          </Button>
        )}

        {goBack && (
          <Tooltip color="primary" title={"Next"}>
            <Fab
              color="primary"
              onClick={() => {
                setFocusedField(null);
                goBack();
              }}
              sx={{ marginX: "auto", marginLeft: 5 }}
              size="small"
            >
              <FontAwesomeIcon
                icon={faArrowLeft}
                className="cursor-pointer"
                size="2xl"
              />
            </Fab>
          </Tooltip>
        )}
        {goToNext && (
          <Tooltip color="primary" title={"Next"}>
            <Fab
              color="primary"
              onClick={() => {
                setFocusedField(null);
                goToNext();
              }}
              sx={{ marginX: "auto", marginLeft: 5 }}
              size="small"
            >
              <FontAwesomeIcon
                icon={faArrowRight}
                className="cursor-pointer"
                size="2xl"
              />
            </Fab>
          </Tooltip>
        )}
        <Button color="error" sx={{ position: "absolute", right: 0 }} onClick={() => {
          deleteExercise(exercise);
        }}>
          <Trash className="ml-2" size={theme.iconSize.large} color={theme.palette.primary.error} />
        </Button>
      </div>
      <div className="flex justify-center gap-3">
        <Typography
          variant="h6"
          component="h2"
          sx={{ textAlign: "center", paddingBottom: 2 }}
        >
          {formatExercise(exercise)}
        </Typography>
        <Tooltip
          title="Duplicate"
          color="primary"
          onClick={() => duplicateExercise(exercise)}
        >
          <Fab color="primary" size="small">
            <FontAwesomeIcon icon={faCopy} size="2x" />
          </Fab>
        </Tooltip>
      </div>
      <ListItem key={exercise.name} sx={{ paddingLeft: "25px" }}>
        <Box component="div" className="flex justify-between mx-auto gap-10">
          {focusedField !== null && buttonConfig[focusedField] && (
            <ButtonGroup
              aria-label="outlined primary button group"
              orientation="vertical"
            >
              {buttonConfig[focusedField].map((button) => (
                <Button
                  key={button.label}
                  color={button.value > 0 ? "primary" : "error"}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleButtonClick(button.value);
                  }}
                  className="mx-1"
                >
                  {button.label}
                </Button>
              ))}
            </ButtonGroup>
          )}

          <Box component="div" className="flex gap-2 flex-col">
            {Object.entries(exercise).map(
              ([key, value], exerciseIndex) =>
                value !== undefined &&
                key !== "name" &&
                key !== "exercise_type" && (
                  <TextField
                    inputRef={(input) => {
                      if (focusedField === key && input) {
                        input.focus();
                      }
                    }}
                    key={key}
                    name={key}
                    label={mapKeyToLabel(key)}
                    value={value}
                    onChange={(e) =>
                      handleChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        exerciseIndex
                      )
                    }
                    onFocus={() => setFocusedField(key)}
                    onBlur={(e) => {
                      console.log(e);
                      if (
                        e.relatedTarget === null ||
                        e.relatedTarget.className.includes(
                          "MuiBottomNavigationAction-root"
                        )
                      ) {
                        setFocusedField(null);
                      } else {
                        e.preventDefault();
                      }
                    }}
                    type="number"
                    inputProps={{ min: "0" }}
                    style={{ maxWidth: "130px", marginLeft: "auto" }}
                  />
                )
            )}
          </Box>
        </Box>
      </ListItem>
      <Divider />
    </Paper>
  );
};
export default ExerciseDisplay;
