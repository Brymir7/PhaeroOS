import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Divider,
  Input,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
} from "@mui/material";
import { ExerciseItem } from "../../utils/exerciseInterfaces";
import { getExerciseFromLocalStorage } from "../../utils/ExerciseLocalStorage";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";

interface Props {
  onAddExercise: (exercise: ExerciseItem) => void;
  exerciseList: ExerciseItem[];
}

function SearchExercises({ onAddExercise, exerciseList }: Props) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchList, setSearchList] = useState<string[]>([]);
  const { mapKeys, mapExercises } = useContext(MapKeysContext);

  const formatExerciseName = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const handleAddExercise = (item: string) => {
    setSearchList([]);
    setSearchTerm("");
    const exerciseCached = getExerciseFromLocalStorage(item);
    if (exerciseCached !== null) {
      onAddExercise({
        name: item,
        exercise_type: exerciseCached.exercise_type,
        duration: exerciseCached.duration,
        weight: exerciseCached.weight,
        sets: exerciseCached.sets,
        reps: exerciseCached.reps,
        rest: exerciseCached.rest,
        distance: exerciseCached.distance,
        calories: exerciseCached.calories,
        elevation: exerciseCached.elevation,
        reps_in_reserve: exerciseCached.reps_in_reserve,
      });
      return;
    }
    const exerciseListItem = exerciseList.find(
      (exercise) => exercise.name === item
    );
    if (exerciseListItem) {
      onAddExercise({
        name: item,
        exercise_type: exerciseListItem.exercise_type,
        duration: exerciseListItem.duration,
        weight: exerciseListItem.weight,
        sets: exerciseListItem.sets,
        reps: exerciseListItem.reps,
        rest: exerciseListItem.rest,
        distance: exerciseListItem.distance,
        calories: exerciseListItem.calories,
        elevation: exerciseListItem.elevation,
        reps_in_reserve: exerciseListItem.reps_in_reserve,
      });
      return;
    }
    handleAllErrors("Exercise not found");
  };

  function sortStringsByOverlap(): string[] {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    function calculateOverlap(substring: string, str: string): number {
      return str.toLowerCase().includes(substring) ? substring.length / str.length : 0;
    }
    const filteredList = exerciseList
      .map((exercise) => {
        return exercise.name;
      })
      .filter(
        (exercise_name) =>
          calculateOverlap(lowerCaseSearchTerm, mapExercises(exercise_name)) > 0
      );
    return filteredList.sort((a, b) => {
      const overlapA = calculateOverlap(lowerCaseSearchTerm, mapExercises(a));
      const overlapB = calculateOverlap(lowerCaseSearchTerm, mapExercises(b));
      return overlapB - overlapA; // Descending order
    });
  }

  useEffect(() => {
    if (searchTerm) {
      if (searchTerm.length === 0) setSearchList([]);
      else setSearchList(sortStringsByOverlap());
    }
  }, [searchTerm]);

  return (
    <Paper elevation={2} className="p-4">
      <div className="flex justify-between items-center">
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center w-full py-2 px-3 mb-1 rounded-md">
            <div className="pr-4">
              <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
            </div>
            <Input
              spellCheck={false}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (searchList.length > 0) handleAddExercise(searchList[0]);
                }
                if (e.key === "Escape") {
                  setSearchList([]);
                  setSearchTerm("");
                }
              }}
              placeholder={mapKeys("Search for exercises")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{
                "&::before": {
                  transform: "scaleX(0)",
                  left: "2.5px",
                  right: "2.5px",
                  bottom: 0,
                  top: "unset",
                  transition: "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
                  borderRadius: 0,
                },
                "&:focus-within::before": {
                  transform: "scaleX(1)",
                },
              }}
            />
          </div>
        </div>
      </div>
      <List
        sx={{ pt: 0 }}
        className={`flex flex-col w-full overflow-hidden rounded-md ${(searchList.length === 0 || searchTerm.length === 0) && "hidden"
          }`}
      >
        <Divider />
        {searchList.slice(0, 6).map((item) => (
          <ListItem
            key={item}
            disablePadding
            onClick={() => {
              handleAddExercise(item);
            }}
            className={`  ${mapExercises(item).toLowerCase() === searchTerm.toLowerCase() &&
              "bg-gray-100"
              }`}
          >
            <ListItemButton>
              <ListItemText primary={mapExercises(formatExerciseName(item))} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default SearchExercises;
