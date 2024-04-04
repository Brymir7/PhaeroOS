interface ExerciseItem {
  name: string;
  exercise_type: string;
  duration?: number;
  weight?: number;
  sets?: number;
  reps?: number;
  rest?: number;
  distance?: number;
  calories?: number;
}
export const addExerciseToLocalStorage = (exercise: ExerciseItem) => {
  localStorage.setItem(exercise.name, JSON.stringify(exercise));
};
export const getExerciseFromLocalStorage = (exercise: string) => {
  const storedExercise = JSON.parse(localStorage.getItem(exercise) || "null");
  if (storedExercise !== null) {
    return {
      name: storedExercise.name,
      exercise_type: storedExercise.exercise_type,
      duration: storedExercise.duration,
      weight: storedExercise.weight,
      sets: storedExercise.sets,
      reps: storedExercise.reps,
      rest: storedExercise.rest,
      distance: storedExercise.distance,
      calories: storedExercise.calories,
      elevation: storedExercise.elevation,
      reps_in_reserve: storedExercise.reps_in_reserve,
    };
  }
  return null;
};
