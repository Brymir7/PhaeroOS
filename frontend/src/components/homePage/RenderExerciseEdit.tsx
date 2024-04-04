import { Box, Button, ButtonGroup, TextField, Typography } from "@mui/material";
import { useState, useEffect, useContext, useRef } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { buttonConfig } from "../../pages/QuickAddButtonsExercise";
import { ExerciseItem } from "../utils/exerciseInterfaces";

const RenderExerciseEdit = ({
  exercise,
  onChange,
  resetSelection,
}: {
  exercise: ExerciseItem;
  onChange: (exercise: ExerciseItem) => void;
  resetSelection?: () => void;
}) => {
  const [exerciseData, setexerciseData] = useState<ExerciseItem>({
    ...exercise,
  });
  const exerciseDataModified = useRef(false);
  const { mapKeys, mapExercises } = useContext(MapKeysContext);
  const [focusedField, setFocusedField] = useState<string>(""); // Field currently being edited
  const mapKeyToLabel = (key: string) => {
    switch (key) {
      case "duration":
        return mapKeys("Duration") + " in minutes";
      case "weight":
        return mapKeys("Weight") + " in kg";
      case "sets":
        return mapKeys("Sets");
      case "reps":
        return mapKeys("Reps");
      case "rest":
        return mapKeys("Rest");
      case "distance":
        return mapKeys("Distance");
      case "calories":
        return mapKeys("Calories burned");
      case "elevation":
        return mapKeys("Elevation");
      default:
        return key.replace(/_/g, " ").toUpperCase();
    }
  };
  useEffect(() => {
    setexerciseData({ ...exercise }); // Update form when exercise changes
  }, [exercise]);
  console.log(exerciseData)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setexerciseData((prevexerciseData) => ({
      ...prevexerciseData,
      [name]: value.startsWith("0") ? value.replace(/^0+/, "") : value,
    }));
    exerciseDataModified.current = true;
  };
  useEffect(() => {
    if (exerciseDataModified.current) {
      exerciseDataModified.current = false;
      onChange(exerciseData);
    }
  }, [exerciseData]);

  const handleButtonClick = (increment: number) => {
    if (increment === 0) {
      setexerciseData((prev) => ({ ...prev, [focusedField]: "0" }));
      return;
    }
    setexerciseData((prev) => ({
      ...prev,
      [focusedField]: (
        (parseFloat(prev[focusedField]?.toString() ?? "") || 0) + increment
      ).toString(),
    }));
    exerciseDataModified.current = true;
  };
  console.log(exerciseData)
  return (
    <Box component="div" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div className="flex justify-between">
        <Typography variant="h6">{mapExercises(exerciseData.name)}</Typography>
        {resetSelection && (
          <FontAwesomeIcon
            icon={faXmark}
            size="2x"
            onClick={() => resetSelection()}
          />
        )}
      </div>
      {Object.entries(exerciseData).map(
        ([key, value]) =>
          value !== undefined &&
          key !== "name" &&
          key !== "exercise_type" && (
            <TextField
              key={key}
              name={key}
              label={mapKeyToLabel(key)}
              value={value}
              onFocus={() => setFocusedField(key)}
              onChange={handleChange}
              type="number"
              inputProps={{ min: "0" }} // Assuming all numerical values should be positive
            />
          )
      )}
      {buttonConfig[focusedField] && (
        <ButtonGroup aria-label="outlined primary button group">
          {buttonConfig[focusedField].map((button) => (
            <Button
              key={button.label}
              color={button.value > 0 ? "primary" : "error"}
              onClick={() => handleButtonClick(button.value)}
              className="mx-1"
            >
              {button.label}
            </Button>
          ))}
        </ButtonGroup>
      )}
    </Box>
  );
};

export default RenderExerciseEdit;
