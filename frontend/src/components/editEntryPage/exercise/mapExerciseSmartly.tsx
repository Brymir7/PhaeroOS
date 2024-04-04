import { ExerciseImplementation } from "../../homePage/PhaeroMessage";
import { ExerciseItem } from "../../utils/exerciseInterfaces";
import { mapExerciseRegardlessOfRepetitionInList } from "./ExerciseDisplay";

export function formatExercise(exercise: ExerciseItem): string {
  let result = mapExerciseRegardlessOfRepetitionInList(exercise.name);
  console.log(exercise.name)
  if (exercise.reps !== undefined && exercise.sets !== undefined && exercise.weight !== undefined) {
    result += ` ${exercise.sets}x${exercise.reps} - ${exercise.weight}kg`;
  } else {
    if (exercise.reps !== undefined) {
      result += ` (${exercise.reps} reps)`;
    }
    if (exercise.sets !== undefined) {
      result += ` (${exercise.sets} sets)`;
    }
    if (exercise.weight !== undefined) {
      result += ` (${exercise.weight}kg)`;
    }
    if (exercise.duration !== undefined) {
      result += ` (${exercise.duration} mins)`;
    }
    if (exercise.rest !== undefined) {
      result += ` (${exercise.rest} sec rest)`;
    }
    if (exercise.distance !== undefined) {
      result += ` (${exercise.distance} km)`;
    }
    if (exercise.calories !== undefined) {
      result += ` (${exercise.calories} cal)`;
    }
    if (exercise.elevation !== undefined) {
      result += ` (${exercise.elevation} m elevation)`;
    }
  }

  return result;
}
export function formatExerciseImplementation(exercise: ExerciseImplementation): string {
  let result = '';

  if (exercise.reps !== undefined && exercise.sets !== undefined && exercise.weight !== undefined) {
    result += `${exercise.reps}x${exercise.sets} ${exercise.weight}kg`;
  } else {
    if (exercise.reps !== undefined) {
      result += ` (${exercise.reps} reps)`;
    }
    if (exercise.sets !== undefined) {
      result += ` (${exercise.sets} sets)`;
    }
    if (exercise.weight !== undefined) {
      result += ` (${exercise.weight}kg)`;
    }
    if (exercise.duration !== undefined) {
      result += ` (${exercise.duration} mins)`;
    }
    if (exercise.rest !== undefined) {
      result += ` (${exercise.rest} sec rest)`;
    }
    if (exercise.distance !== undefined) {
      result += ` (${exercise.distance} km)`;
    }
    if (exercise.calories !== undefined) {
      result += ` (${exercise.calories} cal)`;
    }
    if (exercise.elevation !== undefined) {
      result += ` (${exercise.elevation} m elevation)`;
    }
  }

  return result.trim();
}
