import { getExerciseFromLocalStorage } from "./ExerciseLocalStorage";
export interface ExerciseItem {
  name: string;
  exercise_type: string;
  duration?: number;
  weight?: number;
  sets?: number;
  reps?: number;
  reps_in_reserve?: number;
  rest?: number;
  distance?: number;
  calories?: number;
  elevation?: number;
  [key: string]: string | number | undefined;
}

export const convertExerciseBackendToExerciseItem = (exercise: any[]) => {
  const exerciseLocal = getExerciseFromLocalStorage(exercise[0]);
  if (exerciseLocal !== null) {
    return exerciseLocal;
  }
  return {
    name: exercise[0],
    exercise_type: exercise[1],
    duration: exercise[2] ? 0 : undefined,
    weight: exercise[3] ? 1 : undefined,
    sets: exercise[4] ? 1 : undefined,
    reps: exercise[5] ? 1 : undefined,
    rest: exercise[6] ? 0 : undefined,
    distance: exercise[7] ? 0 : undefined,
    calories: exercise[8] ? 0 : undefined,
    elevation: exercise[9] ? 0 : undefined,
    reps_in_reserve: exercise[10] ? 0 : undefined,
  };
};

export interface ExerciseCategories {
  "Cardio Exercises": Array<ExerciseItem | MultipleExerciseItem>;
  "Weight Lifting Exercises": Array<ExerciseItem | MultipleExerciseItem>;
  "Bodyweight Exercises": Array<ExerciseItem | MultipleExerciseItem>;
  // "Other Exercises": Array<ExerciseItem | MultipleExerciseItem>;
}
export interface MultipleExerciseItem {
  exercise_name: string;
  exercises: ExerciseItem[];
  [key: string]: string | ExerciseItem[];
}
export interface ExerciseItemPhaeroNote {
  [exercise: string]: {
    [key: string]: number;
  };
}
