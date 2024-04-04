import { HabitItem, isHabitNumberProgress } from "../goalsPage/types";
import { Button, Grid, useTheme } from "@mui/material";

import { ClipboardClose, ClipboardTick, TickSquare } from "iconsax-react";
interface HabitProgressButtonsProps {
  habit: HabitItem;
  currDay: number;
  onIncrement: (id: number, day: number) => void;
  onDecrement: (id: number, day: number) => void;
}
const HabitProgressButtons = ({
  habit,
  currDay,
  onIncrement,
  onDecrement,
}: HabitProgressButtonsProps) => {
  const theme = useTheme();
  const isMaxDayReached =
    isHabitNumberProgress(habit.progress) &&
    habit.progress.progress[currDay] === habit.progress.maxPerDay;
  return (
    <div>
      {typeof habit.progress.progress[0] === "boolean" ? (
        <div className="py-7">
          <Button onClick={() => onIncrement(habit.id, currDay)}>
            <Grid item>
              {habit.progress.progress[currDay] ? (
                <ClipboardTick
                  color={"white"}
                  size={theme.iconSize.habit}
                />
              ) : (
                <ClipboardClose
                  color={"white"}
                  size={theme.iconSize.habit}
                />
              )}
            </Grid>
          </Button>
        </div>
      ) : (
        <>
          {!isMaxDayReached ? (
            <Grid
              container
              spacing={0}
              justifyContent="center"
              alignItems="center"
              className=""
            >
              <Grid item xs={12} className="flex justify-center">
                <Button onClick={() => onIncrement(habit.id, currDay)}>
                  <ClipboardTick size={theme.iconSize.habit} color={"white"} />
                </Button>
              </Grid>
              <Grid item xs={12} className="flex justify-center">
                <Button onClick={() => onDecrement(habit.id, currDay)}>
                  <ClipboardClose size={theme.iconSize.habit} color={"white"} />
                </Button>
              </Grid>
            </Grid>
          ) : (
            <div className="w-full h-full py-7">
              <Button >
                <TickSquare
                  color={"white"}
                  size={theme.iconSize.habit}
                  onClick={() => onDecrement(habit.id, currDay)}
                />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default HabitProgressButtons;
