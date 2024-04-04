export enum HabitType {
  BOOLEAN,
  NUMBER,
}
export function isHabitNumberProgress(
  progress: habitNumberProgress | habitBooleanProgress | null
): progress is habitNumberProgress {
  // Check if progress is not null and maxPerDay is not null/undefined
  if (progress === null) {
    return false;
  }
  return (
    typeof progress.progress[0] === "number" &&
    Object.prototype.hasOwnProperty.call(progress, "maxPerDay")
  );
}

export function isHabitBooleanProgress(
  progress: habitNumberProgress | habitBooleanProgress | null
): progress is habitBooleanProgress {
  // We can determine if the progress is habitBooleanProgress if 'progress' is an array of booleans
  if (progress === null) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(progress, "maxPerDay") === true) {
    return false;
  }
  return typeof progress.progress[0] === "boolean";
}
export function isHabitRepeatEveryCertainDays(
  repeatEvery: number | RepeatEveryCertainDays
): repeatEvery is RepeatEveryCertainDays {
  return Object.prototype.hasOwnProperty.call(repeatEvery, "days");
}

export const convertBackendToFrontendHabits = (data: {
  habits: BackendHabitItem[];
}): HabitItem[] => {
  return data.habits.map((habitBackend: BackendHabitItem) => {
    const newHabit: HabitItem = {
      id: habitBackend.id,
      title: habitBackend.title,
      description: habitBackend.description,
      recorded_at: habitBackend.recorded_at,
      repeat_every:
        habitBackend.repeat_every_certain_days !== null
          ? {
              type: "certain_days",
              days: habitBackend.repeat_every_certain_days,
            }
          : habitBackend.repeat_every,
      color: habitBackend.color,
      icon: habitBackend.icon,
      progress: {} as habitNumberProgress | habitBooleanProgress,
    };
    const lastRecordedDate = dayjs(habitBackend.recorded_at);
    const today = dayjs();
    const deltaDays = today.diff(lastRecordedDate, "day");
    if (
      habitBackend.max_number !== null &&
      habitBackend.number_progress !== null
    ) {
      newHabit.progress = {
        progress: habitBackend.number_progress,
        maxPerDay: habitBackend.max_number,
      };
    } else if (
      habitBackend.progress !== null &&
      habitBackend.progress.length > 0
    ) {
      newHabit.progress = {
        progress: habitBackend.progress,
      };
    }
    if (deltaDays > 0) {
      for (let i = 0; i < deltaDays; i++) {
        if (isHabitNumberProgress(newHabit.progress)) {
          (newHabit.progress.progress as number[]).push(0);
        }
        if (isHabitBooleanProgress(newHabit.progress)) {
          (newHabit.progress.progress as boolean[]).push(false);
        }
      }
    }
    const currDay = Math.min(newHabit.progress.progress.length, deltaDays + 1);
    return {
      ...newHabit,
      currDay,
    };
  });
};
export interface BackendHabitItem {
  id: number;
  title: string;
  description: string;
  progress: boolean[] | null;
  number_progress: number[] | null;
  max_number: number | null;
  recorded_at: string;
  icon: string;
  repeat_every: number;
  repeat_every_certain_days: number[] | null;
  color: string;
}
export const convertFrontendToBackendHabits = (data: HabitItem[]): any => {
  return data.map((habit: HabitItem) => {
    let progress;
    let number_progress;
    let max_number;
    let repeat_every;
    let repeat_every_certain_days;
    if (isHabitNumberProgress(habit.progress)) {
      number_progress = habit.progress.progress;
      max_number = habit.progress.maxPerDay;
    } else if (isHabitBooleanProgress(habit.progress)) {
      progress = habit.progress.progress;
    }
    if (isHabitRepeatEveryCertainDays(habit.repeat_every)) {
      repeat_every_certain_days = habit.repeat_every.days;
    } else {
      repeat_every = habit.repeat_every;
    }
    return {
      id: habit.id,
      title: habit.title,
      description: habit.description,
      progress,
      number_progress,
      max_number,
      repeat_every: repeat_every,
      repeat_every_days: repeat_every_certain_days,
      color: habit.color,
      recorded_at: habit.recorded_at,
      icon: habit.icon,
    };
  });
};

export interface habitNumberProgress {
  progress: number[];
  maxPerDay: number;
}
export interface habitBooleanProgress {
  progress: boolean[];
}
export enum Days {
  Sunday,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}
export interface RepeatEveryCertainDays {
  type: "certain_days";
  days: Days[];
}

export interface HabitItem {
  id: number;
  title: string;
  description: string;
  progress: habitNumberProgress | habitBooleanProgress;
  recorded_at: string;
  color: string;
  icon: string;
  repeat_every: number | RepeatEveryCertainDays;
}

export interface StatisticData {
  id: number;
  name: string;
  values: number[];
}

export interface GoalProps {
  goal: GoalType;
  modifyGoal: (goal: GoalType) => void;
  deleteGoal: (goal: GoalType) => void;
}
export enum RelationType {
  SMALLER,
  BIGGER,
}
export interface AutoCompletion {
  autoCompleteByStats: boolean;
  numberGoals: number[];
  relationType: RelationType;
}
export interface GoalType {
  // maintain that flags[i] == progress[i] == numberGoals[i] <- that if the flag is checked the progress is true
  id: number;
  title: string;
  description: string;
  flags: string[]; // if flag == "" then it is not used therefore progress[i] == numberGoals[i] is also not used
  progress: boolean[];
  autoCompletion?: AutoCompletion;
  habits?: HabitItem[];
  statistic?: StatisticData;
}
export interface backendGoalType {
  id: number;
  title: string;
  description: string;
  flags: string[];
  progress: boolean[];
  autoComplete: boolean;
  numberGoals: number[];
  relationType: string;
  habit_ids: number[];
  statistic_ids: number[];
}
import {
  faPen,
  faHeart,
  faBicycle,
  faRunning,
  faDumbbell,
  faSpa,
  faPeace,
  faOm,
  faShower,
  faWater,
  faClock,
  faUserCircle,
  faSmile,
  faStar,
  faBook,
  faUtensils,
  faHamburger,
  faCoffee,
  faSpoon,
  faSpaceShuttle,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
export const colors = [
  "bg-pink-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-red-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-lime-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-fuchsia-500",
  "bg-emerald-500",
  "bg-lime-600",
];
export const textColors = [
  "text-pink-500",
  "text-yellow-500",
  "text-blue-500",
  "text-green-500",
  "text-purple-500",
  "text-red-500",
  "text-indigo-500",
  "text-orange-500",
  "text-teal-500",
  "text-cyan-500",
  "text-lime-500",
  "text-amber-500",
  "text-sky-500",
  "text-violet-500",
  "text-rose-500",
  "text-fuchsia-500",
  "text-emerald-500",
  "text-lime-600",
];

export const MapIconStringToIcon = (icon: string) => {
  switch (icon) {
    case "faHeart":
      return faHeart;
    case "faBicycle":
      return faBicycle;
    case "faRunning":
      return faRunning;
    case "faDumbbell":
      return faDumbbell;
    case "faSpa":
      return faSpa;
    case "faPen":
      return faPen;
    case "faPeace":
      return faPeace;
    case "faOm":
      return faOm;
    case "faShower":
      return faShower;
    case "faWater":
      return faWater;
    case "faClock":
      return faClock;
    case "faUserCircle":
      return faUserCircle;
    case "faSmile":
      return faSmile;
    case "faStar":
      return faStar;
    case "faBook":
      return faBook;
    case "faUtensils":
      return faUtensils;
    case "faHamburger":
      return faHamburger;
    case "faCoffee":
      return faCoffee;
    case "faSpoon":
      return faSpoon;
    case "faSpaceShuttle":
      return faSpaceShuttle;
    case "faRocket":
      return faRocket;
    default:
      return faClock;
  }
};

export const colorIntensityMap = {
  "bg-pink-500": {
    "0": "bg-pink-200",
    "20": "bg-pink-300",
    "40": "bg-pink-400",
    "60": "bg-pink-500",
    "80": "bg-pink-600",
    "100": "bg-pink-700",
  },
  "bg-yellow-500": {
    "0": "bg-yellow-200",
    "20": "bg-yellow-300",
    "40": "bg-yellow-400",
    "60": "bg-yellow-500",
    "80": "bg-yellow-600",
    "100": "bg-yellow-700",
  },
  "bg-blue-500": {
    "0": "bg-blue-200",
    "20": "bg-blue-300",
    "40": "bg-blue-400",
    "60": "bg-blue-500",
    "80": "bg-blue-600",
    "100": "bg-blue-700",
  },
  "bg-green-500": {
    "0": "bg-green-200",
    "20": "bg-green-300",
    "40": "bg-green-400",
    "60": "bg-green-500",
    "80": "bg-green-600",
    "100": "bg-green-700",
  },
  "bg-purple-500": {
    "0": "bg-purple-200",
    "20": "bg-purple-300",
    "40": "bg-purple-400",
    "60": "bg-purple-500",
    "80": "bg-purple-600",
    "100": "bg-purple-700",
  },
  "bg-red-500": {
    "0": "bg-red-200",
    "20": "bg-red-300",
    "40": "bg-red-400",
    "60": "bg-red-500",
    "80": "bg-red-600",
    "100": "bg-red-700",
  },
  "bg-indigo-500": {
    "0": "bg-indigo-200",
    "20": "bg-indigo-300",
    "40": "bg-indigo-400",
    "60": "bg-indigo-500",
    "80": "bg-indigo-600",
    "100": "bg-indigo-700",
  },
  "bg-orange-500": {
    "0": "bg-orange-200",
    "20": "bg-orange-300",
    "40": "bg-orange-400",
    "60": "bg-orange-500",
    "80": "bg-orange-600",
    "100": "bg-orange-700",
  },
  "bg-teal-500": {
    "0": "bg-teal-200",
    "20": "bg-teal-300",
    "40": "bg-teal-400",
    "60": "bg-teal-500",
    "80": "bg-teal-600",
    "100": "bg-teal-700",
  },
  "bg-cyan-500": {
    "0": "bg-cyan-200",
    "20": "bg-cyan-300",
    "40": "bg-cyan-400",
    "60": "bg-cyan-500",
    "80": "bg-cyan-600",
    "100": "bg-cyan-700",
  },
  "bg-lime-500": {
    "0": "bg-lime-200",
    "20": "bg-lime-300",
    "40": "bg-lime-400",
    "60": "bg-lime-500",
    "80": "bg-lime-600",
    "100": "bg-lime-700",
  },
  "bg-amber-500": {
    "0": "bg-amber-200",
    "20": "bg-amber-300",
    "40": "bg-amber-400",
    "60": "bg-amber-500",
    "80": "bg-amber-600",
    "100": "bg-amber-700",
  },
  "bg-sky-500": {
    "0": "bg-sky-200",
    "20": "bg-sky-300",
    "40": "bg-sky-400",
    "60": "bg-sky-500",
    "80": "bg-sky-600",
    "100": "bg-sky-700",
  },
  "bg-violet-500": {
    "0": "bg-violet-200",
    "20": "bg-violet-300",
    "40": "bg-violet-400",
    "60": "bg-violet-500",
    "80": "bg-violet-600",
    "100": "bg-violet-700",
  },
  "bg-rose-500": {
    "0": "bg-rose-200",
    "20": "bg-rose-300",
    "40": "bg-rose-400",
    "60": "bg-rose-500",
    "80": "bg-rose-600",
    "100": "bg-rose-700",
  },
  "bg-fuchsia-500": {
    "0": "bg-fuchsia-200",
    "20": "bg-fuchsia-300",
    "40": "bg-fuchsia-400",
    "60": "bg-fuchsia-500",
    "80": "bg-fuchsia-600",
    "100": "bg-fuchsia-700",
  },
  "bg-emerald-500": {
    "0": "bg-emerald-200",
    "20": "bg-emerald-300",
    "40": "bg-emerald-400",
    "60": "bg-emerald-500",
    "80": "bg-emerald-600",
    "100": "bg-emerald-700",
  },
  "bg-lime-600": {
    "0": "bg-lime-300",
    "20": "bg-lime-400",
    "40": "bg-lime-500",
    "60": "bg-lime-600",
    "80": "bg-lime-700",
    "100": "bg-lime-700",
  },
};
export function getIntensityScaledColor(
  value: number,
  max: number,
  baseColor: string
) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  if (percentage === 0) {
    return "bg-gray-300";
  } else if (percentage <= 20) {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][0];
  } else if (percentage < 40) {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][20];
  } else if (percentage < 60) {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][40];
  } else if (percentage < 80) {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][60];
  } else if (percentage < 100) {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][80];
  } else {
    return colorIntensityMap[baseColor as keyof typeof colorIntensityMap][100];
  }
}

export const calculateHexGradientBasedOnHabitColour = (
  color: string
): string => {
  let startColor: string;
  let endColor: string; // endColor is the main color

  switch (color) {
    case "bg-pink-500":
      startColor = "#F472B6";
      endColor = "#E11D74";
      break;
    case "bg-yellow-500":
      startColor = "#FBBF24";
      endColor = "#CA8A04";
      break;
    case "bg-blue-500":
      startColor = "#60A5FA";
      endColor = "#2563EB";
      break;
    case "bg-green-500":
      startColor = "#34D399";
      endColor = "#059669";
      break;
    case "bg-purple-500":
      startColor = "#A78BFA";
      endColor = "#6D28D9";
      break;
    case "bg-red-500":
      startColor = "#DC2626";
      endColor = "#B91C1C";
      break;
    case "bg-indigo-500":
      startColor = "#818CF8";
      endColor = "#4F46E5";
      break;
    case "bg-orange-500":
      startColor = "#F97316";
      endColor = "#C2410C";
      break;
    case "bg-teal-500":
      startColor = "#14B8A6";
      endColor = "#0D9488";
      break;
    case "bg-cyan-500":
      startColor = "#06B6D4";
      endColor = "#0891B2";
      break;
    case "bg-lime-500":
      startColor = "#84CC16";
      endColor = "#65A30D";
      break;
    case "bg-amber-500":
      startColor = "#F59E0B";
      endColor = "#D97706";
      break;
    case "bg-sky-500":
      startColor = "#0EA5E9";
      endColor = "#0284C7";
      break;
    case "bg-violet-500":
      startColor = "#7C3AED";
      endColor = "#5B21B6";
      break;
    case "bg-rose-500":
      startColor = "#EC4899";
      endColor = "#BE123C";
      break;
    case "bg-fuchsia-500":
      startColor = "#DB2777";
      endColor = "#9D174D";
      break;
    case "bg-emerald-500":
      startColor = "#10B981";
      endColor = "#047857";
      break;
    case "bg-lime-600":
      startColor = "#65A30D";
      endColor = "#4D7C0F";
      break;
    default:
      startColor = "#F472B6";
      endColor = "#E11D74";
  }

  return `linear-gradient(to right, ${startColor}, ${endColor})`;
};
