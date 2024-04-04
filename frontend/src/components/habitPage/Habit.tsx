// Habit.tsx
import {
  IconDefinition,

  faHourglass,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Grid, Paper, Typography, keyframes, useTheme } from "@mui/material";
import React from "react";
import {
  Days,
  HabitItem,
  RepeatEveryCertainDays,
  calculateHexGradientBasedOnHabitColour,
  getIntensityScaledColor,
  habitNumberProgress,
  isHabitBooleanProgress,
  isHabitNumberProgress,
  isHabitRepeatEveryCertainDays,
} from "../goalsPage/types";
import HabitProgressButtons from "./HabitProgressButtons";
import dayjs from "dayjs";
import { Add, TickCircle } from "iconsax-react";
import { useWindowWidth } from "../utils/CustomHooks";
import { useThemeContext } from "../../ThemeContext";

type HabitProps = {
  habit: HabitItem;
  color: string; // The color class will be passed as a prop
  textColor: string; // The text color class will be passed as a prop
  maxEntries: number;
  onCheck: (id: number, day: number) => void;
  onDecrement: (id: number, day: number) => void;
  openDetails: (habit: HabitItem) => void;
  iconToUse: IconDefinition;
  messageView?: boolean;
};
export function getnextInsertionIdx(
  progress_length: number,
  multipleOf: number
): number {
  let newIndex = multipleOf;
  if (multipleOf === 1 || progress_length === 0) {
    return progress_length; // 0 based index
  }
  if (progress_length < multipleOf) {
    return multipleOf;
  }
  if (progress_length === multipleOf) {
    return multipleOf;
  }
  while (progress_length > newIndex) {
    newIndex += multipleOf;
  }
  return newIndex;
}
export function getNextInsertionRepeatEveryCertainDaysIdx(
  progress_length: number,
  days: Days[]
) {
  const today = dayjs();

  const todayDay = today.day();
  const closestDay = days.reduce((acc, day) => {
    if (Math.abs(day - todayDay) < Math.abs(acc - todayDay)) {
      return day;
    }
    return acc;
  });
  if (closestDay === todayDay) {
    return progress_length;
  }
  if (closestDay > todayDay) {
    return progress_length + (closestDay - todayDay);
  }
  if (closestDay < todayDay) {
    return progress_length + (7 - todayDay + closestDay);
  }
  return progress_length;
}
const Habit: React.FC<HabitProps> = ({
  habit,
  color,
  textColor,
  maxEntries,
  onCheck,
  onDecrement,
  openDetails,
  iconToUse,
  messageView,
}) => {
  const theme = useTheme();
  const nextInsertionIdx = !isHabitRepeatEveryCertainDays(habit.repeat_every)
    ? getnextInsertionIdx(
      habit.progress.progress.length - 1,
      habit.repeat_every
    )
    : getNextInsertionRepeatEveryCertainDaysIdx(
      habit.progress.progress.length - 1,
      (habit.repeat_every as RepeatEveryCertainDays).days
    ); // happens before padding
  const prePadProgress = habit.progress.progress.slice();
  const habitHasToBeCheckedToday =
    nextInsertionIdx === habit.progress.progress.length - 1;
  let progress = habit.progress.progress;
  const calculateMaxStreak = () => {
    let maxStreak = 0;
    let currStreak = 0;
    // we ignore curr Day tahts why -1 in the loop
    for (let i = 0; i < progress.length - 1; i++) {
      if (progress[i]) {
        currStreak++;
        maxStreak = Math.max(maxStreak, currStreak);
      } else {
        currStreak = 0;
      }
    }
    return maxStreak;
  };
  const calculateCurrStreak = () => {
    // we ignore curr Day
    let currStreak = 0;
    // we ignore curr Day thats why -2
    for (let i = progress.length - 2; i >= 0; i--) {
      if (progress[i]) {
        currStreak++;
      } else {
        break;
      }
    }
    // we ignore curr Day (in the loop)
    if (progress[progress.length - 1]) {
      return currStreak + 1;
    }
    return currStreak;
  };
  // let maxStreak = calculateMaxStreak();
  //let currStreak = calculateCurrStreak();

  const convertHabitProgressTo28Format = () => {
    if (progress.length > maxEntries) {
      progress = progress.slice(progress.length - maxEntries);
      return;
    }
    const remainingEntries = maxEntries - progress.length;
    if (isHabitBooleanProgress(habit.progress)) {
      progress = (progress as boolean[]).concat(
        new Array(remainingEntries).fill(false)
      );
    }
    if (isHabitNumberProgress(habit.progress)) {
      progress = (progress as number[]).concat(
        new Array(remainingEntries).fill(false)
      );
    }
  };
  function filterProgressByRepeatEvery<T>( // only show continuious completion days in habit.tsx (every 7 days -> only show completion every 7 days)
    _progress: T[],
    _repeatEvery: number | RepeatEveryCertainDays,
    _maxEntries: number
  ): T[] {
    if (_repeatEvery === 1) {
      return progress.slice(0, maxEntries) as T[];
    }
    if (isHabitRepeatEveryCertainDays(habit.repeat_every)) {
      return filterProgressByRepeatEveryDays(
        _progress,
        (habit.repeat_every as RepeatEveryCertainDays).days,
        _maxEntries
      );
    }
    const filteredProgress: T[] = [];
    for (let i = 0; i < progress.length; i += _repeatEvery as number) {
      if (filteredProgress.length < maxEntries) {
        filteredProgress.push(_progress[i]);
      } else {
        break;
      }
    }
    return filteredProgress as T[];
  }
  function filterProgressByRepeatEveryDays<T>(
    _progress: T[],
    days: Days[],
    maxEntries: number
  ): T[] {
    const dayJsOfStartedAt = dayjs(habit.recorded_at).subtract(
      Math.min(prePadProgress.length - 1, maxEntries),
      "day"
    );
    const filteredProgress: T[] = [];
    for (let i = 0; i < _progress.length; i++) {
      if (days.includes((dayJsOfStartedAt.day() + i) % 7)) {
        // we start from the day the _progress started
        filteredProgress.push(_progress[i]);
      }
    }
    return filteredProgress.slice(0, maxEntries / 7) as T[]; // we slice to make sure its 28 entries, because maxEntries is defined as maxEntries * 7,
    // maxEntries for habits with repeatEveryDays is defined as maxEntries * 7
  }
  calculateCurrStreak();
  calculateMaxStreak();
  convertHabitProgressTo28Format();
  const windowWidth = useWindowWidth();
  const squareSize = messageView ? 15 : windowWidth > 768 ? windowWidth > 1900 ? 25 : 20 : 17;
  const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;
  const convertNextInsertionIdxToFilteredRepresentationIndex = (
    nextInsertionIdx: number
  ) => {
    if (isHabitRepeatEveryCertainDays(habit.repeat_every)) {
      return nextInsertionIdx;
    }
    return Math.floor(nextInsertionIdx / (habit.repeat_every as number));
  };
  const convertNextInsertionIdxToRepeatEveryCertainDaysRepresentationIndex = (
    nextInsertionIdx: number
  ) => {
    const days = (habit.repeat_every as RepeatEveryCertainDays).days;
    const dayJsOfStartedAt = dayjs(habit.recorded_at).subtract(
      Math.min(prePadProgress.length, maxEntries),
      "day"
    );
    let res = 0;
    for (let i = 0; i <= nextInsertionIdx; i++) {
      if (days.includes((dayJsOfStartedAt.day() + i) % 7)) {
        res++;
      }
    }
    return res;
  };
  const { isDarkMode } = useThemeContext();
  const highLightColor = isDarkMode ? "bg-gray-500" : "bg-gray-600";
  const defaultColor = isDarkMode ? "bg-white" : "bg-gray-300";
  const calculateWhenToHighlight = (index: number) => {
    if (
      !isHabitRepeatEveryCertainDays(habit.repeat_every) &&
      habit.repeat_every === 1
    ) {
      if (index === nextInsertionIdx) {
        return highLightColor;
      } else {
        return defaultColor;
      }
    } else if (!isHabitRepeatEveryCertainDays(habit.repeat_every)) {
      if (
        index ===
        convertNextInsertionIdxToFilteredRepresentationIndex(nextInsertionIdx)
      ) {
        return highLightColor;
      }
      return defaultColor;
    }
    if (isHabitRepeatEveryCertainDays(habit.repeat_every)) {
      if (
        index ===
        convertNextInsertionIdxToRepeatEveryCertainDaysRepresentationIndex(
          nextInsertionIdx
        )
      ) {
        return highLightColor;
      }
      return defaultColor;
    }
    return defaultColor;
  };
  return (
    <Paper
      elevation={isDarkMode ? 0 : 3}
      sx={{
        minWidth: messageView ? "160px" : "100px",
      }}
    >
      <Box component="div" sx={{ position: "relative", overflow: "hidden" }}>
        <Paper
          className="text-xl flex justify-between items-center l-2 pt-2 pl-2 pb-1 m-1"
          elevation={1}
          sx={{ zIndex: 1, position: "relative" }}
        >
          <Typography variant={messageView ? "h6" : "h6"} className="text-nowrap truncate">
            <FontAwesomeIcon icon={iconToUse} size="1x" className="mr-2" />
            {habit.title}
          </Typography>
          <Button onClick={() => openDetails(habit)}>
            <Add size={theme.iconSize.large} className={`${textColor}`} />
          </Button>
        </Paper>
        <Box
          component="div"
          sx={{
            "&::before": {
              content: '""',
              position: "absolute",
              top: -15,
              right: 0,
              bottom: 0,
              left: 0,
              margin: "-3px", // Adjust border thickness here
              zIndex: 0,
              width: "103%",
              height: "150%",
              borderRadius: "inherit", // Ensure the border radius matches the Paper component
              background: `${calculateHexGradientBasedOnHabitColour(color)}`,
              animation: `${rotate} ${habit.progress.progress[nextInsertionIdx] ||
                !habitHasToBeCheckedToday
                ? ""
                : "8s linear infinite"
                }`,
            },
          }}
        ></Box>
      </Box>
      <Box component="div" className="flex relative">
        <div
          className={`${color} flex justify-center items-center w-full h-full `}
          style={{ fontSize: "2rem" }}
        >
          {habitHasToBeCheckedToday ? (
            <HabitProgressButtons
              habit={habit}
              currDay={nextInsertionIdx}
              onIncrement={() => {
                onCheck(habit.id, nextInsertionIdx);
              }}
              onDecrement={onDecrement}
            ></HabitProgressButtons>
          ) : (
            <div className="py-7">
              <Button disabled>
                <TickCircle color={"white"} size={theme.iconSize.habit} />
              </Button>
            </div>
          )}
        </div>
        <Box
          component="div"
          className=" z-1 flex justify-center items-center align-middle w-full"
          sx={{
            minWidth: "150px",
          }}
        >
          <Grid
            container
            spacing={0.5}
            className=" z-1 "
            style={{ width: "100%", maxWidth: "300px" }}
          >
            {
              // Use the type guard to check if it's habitNumberProgress
              typeof progress[0] === "number"
                ? // Handling habitNumberProgress
                filterProgressByRepeatEvery<number>(
                  progress as number[],
                  habit.repeat_every,
                  maxEntries
                )
                  .reduce<Array<Array<number>>>(
                    (acc, numCompleted, index) => {
                      const chunkIndex = Math.floor(index / 7);
                      if (!acc[chunkIndex]) {
                        acc[chunkIndex] = []; // start a new chunk
                      }
                      acc[chunkIndex].push(numCompleted); // add the current item into the current chunk
                      return acc;
                    },
                    []
                  )
                  .map((weekProgress, weekIndex) => (
                    <Grid key={weekIndex} container item md={12}>
                      {weekProgress.map((numCompleted, dayIndex) => {
                        const index = weekIndex * 7 + dayIndex;
                        return (
                          <Grid key={dayIndex} item md={12 / 7}>
                            <div
                              className={`${numCompleted >= 1
                                ? getIntensityScaledColor(
                                  numCompleted,
                                  (habit.progress as habitNumberProgress)
                                    .maxPerDay,
                                  color
                                )
                                : calculateWhenToHighlight(index)
                                }`}
                              style={{
                                height: `${squareSize}px`,
                                width: `${squareSize}px`,
                                marginLeft: "3px",
                                marginTop: "2px",
                                borderRadius: "20%",
                              }}
                            />
                          </Grid>
                        );
                      })}
                    </Grid>
                  ))
                : typeof progress[0] === "boolean"
                  ? // Handling habitBooleanProgress
                  filterProgressByRepeatEvery<boolean>(
                    progress as boolean[],
                    habit.repeat_every,
                    maxEntries
                  )
                    .reduce<Array<Array<boolean>>>((acc, completed, index) => {
                      const chunkIndex = Math.floor(index / 7);
                      if (!acc[chunkIndex]) {
                        acc[chunkIndex] = []; // start a new chunk
                      }
                      acc[chunkIndex].push(completed); // add the current item into the current chunk
                      return acc;
                    }, [])
                    .map((weekProgress, weekIndex) => (
                      <Grid key={weekIndex} container item md={12}>
                        {weekProgress.map((completed, dayIndex) => {
                          const index = weekIndex * 7 + dayIndex;
                          const colorAlternative =
                            calculateWhenToHighlight(index);
                          return (
                            <Grid key={dayIndex} item md={12 / 7}>
                              <div
                                className={`${completed ? color : colorAlternative
                                  }`}
                                style={{
                                  height: `${squareSize}px`,
                                  width: `${squareSize}px`,
                                  marginLeft: "3px",
                                  marginTop: "2px",
                                  borderRadius: "20%",
                                }}
                              />
                            </Grid>
                          );
                        })}
                      </Grid>
                    ))
                  : null
            }
          </Grid>
          {(!isHabitRepeatEveryCertainDays
            ? (habit.repeat_every as number) > 1
            : true) &&
            !habitHasToBeCheckedToday && (
              <div className="h-0 absolute bottom-3 flex items-center left-1">
                <FontAwesomeIcon icon={faHourglass} size="sm" color="white" />
                <Typography sx={{ color: "white" }}>
                  {nextInsertionIdx - (prePadProgress.length - 1) + ""}
                </Typography>
              </div>
            )}
        </Box>
      </Box>
    </Paper>
  );
};

export default Habit;
