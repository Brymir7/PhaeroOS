import { Typography, Box, Grid, Button, Paper } from "@mui/material";
import {
  ExerciseItem,
  MultipleExerciseItem,
} from "../../utils/exerciseInterfaces";
import ExerciseDisplay, { ExerciseDisplayProps } from "./ExerciseDisplay";
import { useContext, useEffect, useRef, useState } from "react";
import { MapKeysContext } from "../../contexts/MapKeysContext";
interface MultipleExerciseDisplayProps extends ExerciseDisplayProps {
  multipleExerciseItem: MultipleExerciseItem;
}
const MultipleExerciseDisplay = ({
  multipleExerciseItem,
  deleteExercise,
  handleChange,
  mapKeyToLabel,
  duplicateExercise,
}: MultipleExerciseDisplayProps) => {
  const [expanded, setExpanded] = useState<number | null>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const handleExpandClick = (index: number) => {
    setExpanded(expanded === index ? null : index);
  };
  const gridSize = Math.max(12 / multipleExerciseItem.exercises.length, 4);
  useEffect(() => {
    if (expanded !== null && displayRef.current) {
      const handleScroll = () => {
        const dimensions = displayRef.current?.getBoundingClientRect(); // Add null check
        if (dimensions) {
          displayRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      };

      handleScroll();
    }
  }, [expanded]);
  const { mapExercises } = useContext(MapKeysContext);
  const mapExerciseRegardlessOfRepetitionInList = (exercise: any) => {
    const regex = /\s*(\d+)$/;
    const second_regex = /\s\((\d+)\)$/;
    const matches = exercise.match(regex);
    const second_matches = exercise.match(second_regex);
    const number = matches ? matches[1] : second_matches ? second_matches[1] : null;
    const cleanedExercise = exercise.replace(regex, "").replace(second_regex, "").trim()
    return mapExercises(cleanedExercise) + (number ? ` ${number}` : "");
  };
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Paper style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
      <Box component="div" sx={{ display: "flex", flexDirection: "column" }}>
        {expanded === null ? (
          <>
            <Paper
              className="flex justify-between p-2"
              style={{ border: "1px solid #fff" }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{ textAlign: "center" }}
              >
                {mapExerciseRegardlessOfRepetitionInList(
                  multipleExerciseItem.exercise_name
                )}
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => setExpanded(0)}
                sx={{ textAlign: "center" }}
              >
                {mapKeys("Open details")}
              </Button>
            </Paper>
            <Grid container spacing={0} direction="row" sx={{ padding: 2 }}>
              {multipleExerciseItem.exercises.map((_, idx) => {
                return (
                  <Grid item xs={gridSize} key={idx}>
                    <div key={idx} onClick={() => handleExpandClick(idx)}>
                      <Paper
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "4px",
                        }}
                      >
                        <Typography
                          variant="h6"
                          component="h2"
                          sx={{ textAlign: "center" }}
                        >
                          {"Block " + (idx + 1)}
                        </Typography>
                      </Paper>
                    </div>
                  </Grid>
                );
              })}
            </Grid>
          </>
        ) : (
          <Box component="div" p={2} ref={displayRef}>
            <ExerciseDisplay
              exercise={multipleExerciseItem.exercises[expanded]}
              deleteExercise={(exercise: ExerciseItem) => {
                deleteExercise(exercise);
                setExpanded(null);
              }}
              closeExerciseDisplay={() => setExpanded(null)}
              duplicateExercise={() => {
                const createdCopyOfCurrentExpanded =
                  multipleExerciseItem.exercises[expanded];
                createdCopyOfCurrentExpanded.name =
                  multipleExerciseItem.exercise_name; // overwrite as it otherwise might have a multiple at the end thats illeagl for adding (7) ex
                duplicateExercise(createdCopyOfCurrentExpanded);
              }}
              goBack={
                expanded === 0 ? undefined : () => setExpanded(expanded - 1)
              }
              goToNext={
                expanded === multipleExerciseItem.exercises.length - 1
                  ? undefined
                  : () => setExpanded(expanded + 1)
              }
              handleChange={
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                (e: React.ChangeEvent<HTMLInputElement>, _: number) => {
                  handleChange(e, expanded);
                }
              }
              mapKeyToLabel={mapKeyToLabel}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default MultipleExerciseDisplay;
