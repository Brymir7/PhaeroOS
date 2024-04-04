import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
  ListItemButton,
  ListItemText,
  List,
  Paper,
} from "@mui/material";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { useApi } from "../../modules/apiAxios";
import RenderExerciseEdit from "./RenderExerciseEdit";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  addExerciseToLocalStorage,
} from "../utils/ExerciseLocalStorage";
import { ExerciseItem, convertExerciseBackendToExerciseItem } from "../utils/exerciseInterfaces";

interface ExerciseDialogProps {
  open: boolean;
  onClose: () => void;
  onAddExercise: (exercise: {
    name: string;
    stats: { [key: string]: number };
  }) => void;
}
const ExerciseDialog: React.FC<ExerciseDialogProps> = ({
  open,
  onClose,
  onAddExercise,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResult, setSearchResult] = useState<ExerciseItem[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseItem | null>(
    null
  );
  const [exercisesList, setExercisesList] = useState<ExerciseItem[]>([]);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const api = useApi();
  const handleAddExercise = () => {
    if (selectedExercise) {
      addExerciseToLocalStorage(selectedExercise);
      onAddExercise({
        name: selectedExercise.name,
        stats: {
          duration: selectedExercise.duration || 0,
          weight: selectedExercise.weight || 0,
          sets: selectedExercise.sets || 0,
          reps: selectedExercise.reps || 0,
          rest: selectedExercise.rest || 0,
          distance: selectedExercise.distance || 0,
          calories: selectedExercise.calories || 0,
          elevation: selectedExercise.elevation || 0,
        },
      });
      onClose(); // Close the dialog after adding´
      setSearchTerm(""); // Reset search term
      setSelectedExercise(null); // Reset selected exercise
    }
  };
  const fetchExercises = () => {
    try {
      api.get(`/exercise/`).then((response) => {
        const exercises = response.data;
        const result: ExerciseItem[] = [];
        Object.values(exercises).forEach((exercise: any) => {
          result.push(convertExerciseBackendToExerciseItem(exercise));
        });
        setExercisesList(result);
        setSearchResult(result);
      });
    } catch (error) {
      handleAllErrors(error);
    }
  };
  useEffect(() => {
    if (open) {
      fetchExercises();
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm) {
      setSearchResult(
        exercisesList
          .map((exercise) => {
            return {
              name: mapExercises(exercise.name),
              exercise_type: exercise.exercise_type,
              duration: exercise.duration,
              weight: exercise.weight,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              distance: exercise.distance,
              calories: exercise.calories,
              elevation: exercise.elevation,
            };
          })
          .filter((exercise) =>
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    } else {
      setSearchResult([]);
    }
  }, [searchTerm]);

  const renderExercisesList = () => {
    return (
      <List sx={{ overflowY: "auto", maxHeight: "20vh" }}>
        {searchResult.map((exercise, index) => (
          <ListItemButton
            key={index}
            selected={selectedExercise === exercise}
            onClick={() => {
              setSelectedExercise(
                selectedExercise === exercise ? null : exercise
              );
              setSearchResult([]);
            }}
          >
            <ListItemText primary={mapExercises(exercise.name)} />
          </ListItemButton>
        ))}
      </List>
    );
  };
  const { mapKeys, mapExercises } = useContext(MapKeysContext);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mapKeys("Add Exercise")}</DialogTitle>
      <DialogContent sx={{ overflowY: "unset" }}>
        <TextField
          
          margin="dense"
          id="search-exercise"
          label={mapKeys("Search Exercise")}
          type="text"
          fullWidth
          variant="standard"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {renderExercisesList()}
      </DialogContent>
      {selectedExercise && (
        <Paper
          elevation={2}
          sx={{ padding: 5, paddingTop: 1, paddingBottom: 2 }}
        >
          <RenderExerciseEdit
            exercise={selectedExercise}
            onChange={(exercise: ExerciseItem) => setSelectedExercise(exercise)}
            resetSelection={() => setSelectedExercise(null)}
          />
        </Paper>
      )}
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddExercise} disabled={!selectedExercise}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExerciseDialog;
