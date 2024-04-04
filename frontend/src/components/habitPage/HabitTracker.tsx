// HabitTracker.tsx
import React, { useContext, useEffect, useRef } from "react";
import Habit, {
  getNextInsertionRepeatEveryCertainDaysIdx,
  getnextInsertionIdx,
} from "./Habit"; // Import the Habit component
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { Button, Grid, Modal, Paper, Typography, useTheme } from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";
import dayjs from "dayjs";
import ExtendedHabitView from "./ExtendedHabitView";
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
import TutorialStep from "../utils/TutorialStep";
import {
  HabitItem,
  RepeatEveryCertainDays,
  convertBackendToFrontendHabits,
  convertFrontendToBackendHabits,
  // habitBooleanProgress,
  // habitNumberProgress,
  isHabitBooleanProgress,
  isHabitNumberProgress,
  isHabitRepeatEveryCertainDays,
  textColors,
} from "../goalsPage/types";
import AddHabit from "./AddHabit";
import { Add, CardTick } from "iconsax-react";

import { useWindowHeight, useWindowWidth } from "../utils/CustomHooks";
import { useThemeContext } from "../../ThemeContext";
export const maxWidthBasedOnWindowWidth =
  window.innerWidth < 768
    ? "max-w-[100%]"
    : window.innerWidth < 1100
      ? "max-w-[100%] mx-auto"
      : "max-w-[60%] mx-auto";
const MapIconStringToIcon = (icon: string) => {
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
interface HabitTracker {
  messageView?: boolean;
}
const HabitTracker: React.FC<HabitTracker> = ({ messageView }) => {
  const theme = useTheme();
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const habitModified = useRef(false);
  const maxEntries = 28;
  const { mapKeys } = useContext(MapKeysContext);
  const [habits, setHabits] = React.useState<HabitItem[]>([]);
  const [selectedHabit, setSelectedHabit] = React.useState<HabitItem | null>(
    null
  ); // State to manage selected habit for detailed view
  const getGridItemSizeByMessageViewAndWindoWidth = () => {
    if (messageView || window.innerWidth < 520) {
      return 11;
    }
    if (window.innerWidth > 1000) {
      return 6;
    }
    if (window.innerWidth < 520) {
      return 12;
    }
    return 6;
  };
  const openHabitDetails = (habit: HabitItem) => {
    setSelectedHabit(habit);
  };
  const closeHabitDetails = () => {
    setSelectedHabit(null);
  };
  const updateHabits = () => {
    const updatedHabits = habits.map((habit) => {
      habit.recorded_at = dayjs().format("YYYY-MM-DD");
      return habit;
    });
    console.log("Updating habits", updatedHabits);
    const backendUpdatedHabits = convertFrontendToBackendHabits(updatedHabits);
    api
      .post("/habits/update/", { habit_items: backendUpdatedHabits })
      .then(() => { })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const getHabits = () => {
    api
      .get("/habits/")
      .then((response) => {
        const updatedHabits = convertBackendToFrontendHabits(response.data);
        if (
          updatedHabits.length === 0 &&
          localStorage.getItem("defaultHabit") !== "false"
        ) {
          updatedHabits.push({
            id: 0,
            title: "Tap",
            description: "Tap",
            icon: "faHeart",
            repeat_every: 1,
            color: "bg-blue-500",
            progress: {
              progress: [false],
            },
            recorded_at: dayjs().format("YYYY-MM-DD"),
          });
          localStorage.setItem("defaultHabit", "false");
          habitModified.current = true;
        }
        messageView
          ? setHabits(
            updatedHabits.filter((habit) => {
              const habitHasToBeCheckedToday = !isHabitRepeatEveryCertainDays(
                habit.repeat_every
              )
                ? getnextInsertionIdx(
                  habit.progress.progress.length - 1,
                  habit.repeat_every
                ) ===
                habit.progress.progress.length - 1
                : getNextInsertionRepeatEveryCertainDaysIdx(
                  habit.progress.progress.length - 1,
                  (habit.repeat_every as RepeatEveryCertainDays).days
                ) ===
                habit.progress.progress.length - 1;
              return habitHasToBeCheckedToday;
            })
          )
          : setHabits(updatedHabits);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  useEffect(() => {
    getHabits();
  }, []);

  useEffect(() => {
    if (habitModified.current) {
      updateHabits();
      habitModified.current = false;
    }
  }, [habits]);
  const addHabit = (habit: HabitItem) => {
    if (!habit.title) {
      handleAllErrors("Please fill in all fields");
      return;
    }
    if (habits.find((h) => h.title === habit.title)) {
      handleAllErrors("A habit with this title already exists");
      return;
    }
    setHabits([...habits, habit]);
    habitModified.current = true;
  };
  const deleteHabit = (id: number) => {
    setHabits(habits.filter((habit) => habit.id !== id));
    habitModified.current = true;
  };
  // function countTrueStreak(boolArray: boolean[]) {
  //   let streak = 0;
  //   for (let i = boolArray.length - 1; i >= 0; i--) {
  //     if (boolArray[i] === false) break;
  //     streak++;
  //   }
  //   return streak;
  // }
  // function countNonZeroStreak(numberArray: number[]) {
  //   let streak = 0;
  //   for (let i = numberArray.length - 1; i >= 0; i--) {
  //     if (numberArray[i] === 0) break;
  //     streak++;
  //   }
  //   return streak;
  // }
  // const addHabitToNote = (habit: HabitItem, day: number) => {
  //   if (habit) {
  //     const habitIsBoolean = isHabitBooleanProgress(habit.progress);
  //     if (
  //       (habitIsBoolean && habit.progress.progress[day]) ||
  //       (!habitIsBoolean &&
  //         habit.progress.progress[day] ===
  //           (habit.progress as habitNumberProgress).maxPerDay)
  //     ) {
  //       let newNote = note;
  //       const habitHeader = `## ${mapKeys("Habits")}\n`;
  //       let indexOfHabitHeader = note.indexOf(habitHeader);

  //       if (indexOfHabitHeader === -1) {
  //         newNote += newNote.length === 0 ? "" : "\n\n";
  //         newNote += habitHeader;
  //         indexOfHabitHeader = newNote.indexOf(habitHeader);
  //       }
  //       const currStreak = habitIsBoolean
  //         ? countTrueStreak((habit.progress as habitBooleanProgress).progress)
  //         : countNonZeroStreak(
  //             (habit.progress as habitNumberProgress).progress
  //           );
  //       const insertionPoint = indexOfHabitHeader + habitHeader.length;
  //       const amountWhiteSpaceInTitle = habit.title.split(" ").length - 1;
  //       let habitString =
  //         amountWhiteSpaceInTitle > 0
  //           ? `#h '${habit.title}'`
  //           : `#h ${habit.title}`;
  //       habitString += ` ${dayjs().format("HH:mm")} ${
  //         currStreak === 1
  //           ? mapKeys("First Completion!")
  //           : `${currStreak}` + mapKeys("Completions in a row!")
  //       }\n`;
  //       newNote =
  //         newNote.slice(0, insertionPoint) +
  //         habitString +
  //         newNote.slice(insertionPoint);
  //       setNote(newNote);
  //     } else {
  //       const amountWhiteSpaceInTitle = habit.title.split(" ").length - 1;
  //       const regex =
  //         amountWhiteSpaceInTitle === 0
  //           ? new RegExp(`^.*#h ${habit.title} \\d{2}:\\d{2}.*\n`, "gm")
  //           : new RegExp(`^.*#h '${habit.title}' \\d{2}:\\d{2}.*\n`, "gm");
  //       setNote(note.replace(regex, ""));
  //     }
  //   }
  // };
  const checkHabit = (id: number, day: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          if (day > habit.progress.progress.length - 1) {
            console.log("Day is out of bounds");
            return habit;
          }
          if (isHabitBooleanProgress(habit.progress)) {
            habit.progress.progress[day] = !habit.progress.progress[day];
          } else if (isHabitNumberProgress(habit.progress)) {
            if (habit.progress.progress[day] < habit.progress.maxPerDay) {
              habit.progress.progress[day] += 1; // Or set to a specific value
            }
          }
        }
        return habit;
      })
    );
    const habit = habits.find((habit) => habit.id === id);
    if (!habit) {
      return;
    }
    // addHabitToNote(habit, day);
    habitModified.current = true;
  };
  const onDecrement = (id: number, day: number) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id === id) {
          if (isHabitNumberProgress(habit.progress)) {
            if (habit.progress.progress[day] > 0) {
              habit.progress.progress[day] -= 1;
            }
          }
        }
        return habit;
      })
    );
    habitModified.current = true;
  };
  const modifyHabit = (habit: HabitItem) => {
    habitModified.current = true;
    setHabits(habits.map((h) => (h.id === habit.id ? habit : h)));
  };
  const colors = [
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
  const [openedAddHabitDialog, setOpenedAddHabitDialog] = React.useState(false);
  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  if (messageView && habits.length === 0) {
    return null;
  }
  const { isDarkMode } = useThemeContext();
  return (
    <TutorialStep extraClasses={`w-full ${!messageView ? "h-screen" : "h-[250px] "} max-h-full`} step={1}>
      {!messageView && (
        <AddHabit
          open={openedAddHabitDialog}
          onClose={() => setOpenedAddHabitDialog(false)}
          onSave={(habit: HabitItem) => {
            habitModified.current = true;
            habit.color = colors[habits.length % colors.length];
            addHabit(habit);
          }}
        />
      )}
      <Paper
        elevation={messageView ? 1 : 2}
        className={`${habits.length === 1 ? "w-full" : ""
          } flex flex-col pt-2 h-full ${messageView ? "max-w-[350px]" : maxWidthBasedOnWindowWidth
          } `}
        sx={{
          paddingX: messageView ? 0 : window.innerWidth > 520 ? 4 : 2,
        }}
      >
        {!messageView && (
          <Typography
            variant="h6"
            className="flex align-middle items-center gap-2"
          >
            <CardTick
              size={theme.iconSize.large}
              color={theme.palette.primary.main}
            />
            {mapKeys("Your Habits")}
          </Typography>
        )}
        <Paper elevation={isDarkMode ? 4 : 0} sx={{
          paddingX: messageView ? 0 : 0, marginTop: messageView ? 0 : 2
        }} className={`flex flex-col ${!messageView ? "max-h-[90%]" : "max-h-[100%]"}`} >
          <Grid
            container
            spacing={2}
            wrap="wrap"
            direction={"row"}
            sx={{
              overflowY: "auto",
              maxHeight:
                messageView ? "100%" : (windowWidth < 1000 || windowHeight < 1000) ? "90%" : "90%",
              minHeight:
                windowWidth < 1000 || windowHeight < 1000 ? "31%" : "31%",
              overflowX: "hidden",
              display: windowWidth <= 520 ? "flex" : "",
              justifyContent: "center",
            }}
          >
            {habits
              .sort((a, b) => {
                const A_nextInsertionIdx = !isHabitRepeatEveryCertainDays(
                  a.repeat_every
                )
                  ? getnextInsertionIdx(
                    a.progress.progress.length - 1,
                    a.repeat_every
                  )
                  : getNextInsertionRepeatEveryCertainDaysIdx(
                    a.progress.progress.length - 1,
                    (a.repeat_every as RepeatEveryCertainDays).days
                  ); // happens before padding
                const B_nextInsertionIdx = !isHabitRepeatEveryCertainDays(
                  b.repeat_every
                )
                  ? getnextInsertionIdx(
                    b.progress.progress.length - 1,
                    b.repeat_every
                  )
                  : getNextInsertionRepeatEveryCertainDaysIdx(
                    b.progress.progress.length - 1,
                    (b.repeat_every as RepeatEveryCertainDays).days
                  ); // happens before padding
                return (
                  A_nextInsertionIdx -
                  a.progress.progress.length -
                  (B_nextInsertionIdx - b.progress.progress.length)
                );
              })

              .map((habit, index) => (
                <Grid
                  item
                  xs={getGridItemSizeByMessageViewAndWindoWidth()}
                  key={index}
                >
                  <div key={habit.id}>
                    <Habit
                      habit={habit}
                      color={habit.color}
                      textColor={
                        textColors[
                        (colors.indexOf(habit.color) || 0) % colors.length
                        ]
                      }
                      maxEntries={
                        isHabitRepeatEveryCertainDays(habit.repeat_every)
                          ? 7 * maxEntries // because days are on a modulo 7 basis
                          : maxEntries * (habit.repeat_every as number)
                      } // because if we only show every 2 days, we need double the data to show the same amount of entries
                      onCheck={checkHabit}
                      onDecrement={onDecrement}
                      openDetails={openHabitDetails}
                      iconToUse={MapIconStringToIcon(habit.icon)}
                      messageView={messageView}
                    />
                  </div>
                </Grid>
              ))}
          </Grid>
          {!messageView && (
            <div className="flex justify-center align-middle my-auto">
              <Button
                sx={{ textTransform: "none", borderRadius: 999 }}
                className="flex items-center h-12 gap-2"
                onClick={() => setOpenedAddHabitDialog(true)}
                variant="contained"
              >
                <Add
                  size={theme.iconSize.medium}
                  color={"white"}
                />
                <Typography>{mapKeys("Add Habit")}</Typography>
              </Button>
            </div>
          )}
        </Paper>

        <Modal
          open={!!selectedHabit}
          onClose={closeHabitDetails}
          aria-labelledby="extended-habit-view-title"
          aria-describedby="extended-habit-view-description"
        >
          <Paper
            sx={{
              width: {
                xs: "100%",
                md: 800,
                maxHeight: "100%",

                overflowY: "auto",
              }, // Adjusts width based on breakpoints
              height: {
                xs: "100%",
              },
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 1,
            }}
          >
            {selectedHabit && (
              <ExtendedHabitView
                habit={selectedHabit}
                deleteHabit={(id: number) => {
                  deleteHabit(id);
                  closeHabitDetails();
                }}
                closeHabitDetails={closeHabitDetails}
                modifyHabit={modifyHabit}
                color={
                  colors[
                  habits.findIndex((habit) => habit.id === selectedHabit.id) %
                  colors.length
                  ]
                }
                iconToUse={MapIconStringToIcon(selectedHabit.icon)}
              />
            )}
          </Paper>
        </Modal>
      </Paper>
    </TutorialStep >
  );
};

export default HabitTracker;
