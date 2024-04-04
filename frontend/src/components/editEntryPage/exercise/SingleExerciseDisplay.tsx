import { useState, useRef, useEffect } from "react";
import { Box, Button, Grid, Paper, Typography, useTheme } from "@mui/material";
import ExerciseDisplay, { ExerciseDisplayProps } from "./ExerciseDisplay";
import { formatExercise } from "./mapExerciseSmartly";
import { MapKeyedButton } from "../../utils/Buttons";
import { Trash } from "iconsax-react";
interface WrappedExerciseDisplayProps extends ExerciseDisplayProps { }

const WrappedExerciseDisplay = ({
  exercise,
  deleteExercise,
  handleChange,
  mapKeyToLabel,
  duplicateExercise,
}: WrappedExerciseDisplayProps) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const displayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (expanded && displayRef.current) {
      displayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [expanded]);
  const theme = useTheme();
  return (
    <Paper style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
      <Box
        component="div"
        sx={{ display: "flex", flexDirection: "column" }}
        ref={displayRef}
      >
        {!expanded ? (
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
                {formatExercise(exercise)}
              </Typography>
              <Button onClick={() => deleteExercise(exercise)}>
                <Trash

                  style={{ cursor: "pointer" }}
                  size={theme.iconSize.large}
                  color={theme.palette.primary.error}
                /></Button>
            </Paper>
            <Grid container spacing={0} direction="row" sx={{ padding: 2 }}>
              <Grid item xs={12}>
                <MapKeyedButton
                  text="Open details"
                  onClick={() => setExpanded(true)}
                  minWidth="100%"
                />
              </Grid>
            </Grid>
          </>
        ) : (
          <Box component="div" p={2}>
            <ExerciseDisplay
              exercise={exercise}
              deleteExercise={deleteExercise}
              closeExerciseDisplay={() => setExpanded(false)}
              duplicateExercise={() => { setExpanded(false); duplicateExercise(exercise) }}
              handleChange={handleChange}
              mapKeyToLabel={mapKeyToLabel}
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WrappedExerciseDisplay;
