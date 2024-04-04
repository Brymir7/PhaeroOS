import React, { useContext } from "react";
import {
  Badge,
  Paper,
  useTheme,
  Button,
} from "@mui/material";
import Typewriter from "typewriter-effect";
import { useFormattedFoodName, useWindowWidth } from "../utils/CustomHooks";
import { EntryData, Nutrients } from "../../pages/EditEntryPage";
import { useNavigate } from "react-router";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { MapKeyedButton } from "../utils/Buttons";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import { mapExerciseRegardlessOfRepetitionInList } from "../editEntryPage/exercise/ExerciseDisplay";
import { formatExerciseImplementation } from "../editEntryPage/exercise/mapExerciseSmartly";
import WellbeingSlider from "../utils/WellbeingSlider";
import {
  JournalNoteContext,
  Message,
  display,
  sleepQuestions,
} from "../contexts/JournalNoteContext";
import HabitTracker from "../habitPage/HabitTracker";
import Checklist from "../checklistPage/Checklist";
// @ts-ignore
import PhaeroCompanion from "/Phaero.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { Apple, Moon, Note, Weight, WeightMeter } from "iconsax-react";
import SleepSurvey from "./SleepSurveyMessage";
interface NutrientValues {
  fat?: [number, string];
  carbs?: [number, string];
  sugar?: [number, string];
  amount?: [number, string];
  protein?: [number, string];
  calories?: [number, string];
}

interface Micros {
  amount?: [number, string];
}

interface FoodDetails {
  Macros?: NutrientValues;
  Micros?: Micros;
}

interface FoodList {
  [key: string]: FoodDetails;
}

interface Nutrition {
  Total?: {
    Macros?: NutrientValues;
    Micros?: Micros;
  };
}
export interface ExerciseImplementation {
  reps?: number;
  sets?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest?: number;
  calories?: number;
  elevation?: number;
  [key: string]: number | undefined;
}
interface ExerciseDetails {
  "Other Exercises"?: {
    [key: string]: ExerciseImplementation | undefined;
  };
  "Cardio Exercises"?: {
    [key: string]: ExerciseImplementation | undefined;
  };
  "Bodyweight Exercises"?: {
    [key: string]: ExerciseImplementation | undefined;
  };
  "Weight Lifting Exercises"?: {
    [key: string]: ExerciseImplementation | undefined;
  };
}

interface Exercise {
  Steps?: number;
  Exercises?: ExerciseDetails;
  "absolute Rating"?: number;
  "relative Rating"?: number;
}

interface SleepAndWeight {
  Weight?: [number, string];
  "Sleep End"?: string;
  "Sleep Start"?: string;
  "Sleep Quality"?: number;
}

interface Note {
  Note?: string;
  Rating?: number;
}

export interface phaero_note_dict_diff {
  Food?: {
    FoodList?: FoodList | undefined;
    "Not found foods": FoodList | undefined;
    "List of Supplements": any[];
  };
  Nutrition?: Nutrition;
  Exercise?: Exercise;
  "Sleep & Weight"?: SleepAndWeight;
  Note?: Note;
}

interface PhaeroMessageProps {
  message?: string;
  currentMessageIndex?: number;
  isLastMessage: boolean;
  sender: "User" | "Phaero";
  phaero_note_dict_diff?: phaero_note_dict_diff;
  phaero_note_dict?: EntryData;
  onCTAClick?: () => void;
  ctaLabel?: string;
  typeOfCTAClick?: "sleep" | "exercise" | "food" | "weight" | "note";
  markdownText?: string;
  nonMarkdown?: React.ReactNode;
  ctaHasMandatoryUserEvent?: boolean;
  display?: display;
  has_confirmed?: boolean;
  used_note_ids?: number[];
}
function messageHasSomethingNewInDiff(message: Message): boolean {
  if (message.typeof_message === "user") return false;
  if (!message.phaero_note_dict_diff_json) return false;
  const phaero_note_dict_diff = message.phaero_note_dict_diff_json;
  const hasNotFoundFoods =
    Object.keys(phaero_note_dict_diff?.Food?.["Not found foods"] || {}).length >
    0;
  const hasNewFoods =
    Object.keys(phaero_note_dict_diff?.Food?.FoodList || {}).length > 0;
  const hasNewExercise =
    Object.keys(phaero_note_dict_diff?.Exercise?.Exercises || {}).length > 0;
  const hasNewSleep =
    Object.keys(phaero_note_dict_diff?.["Sleep & Weight"]?.["Sleep End"] || {})
      .length > 0 ||
    Object.keys(
      phaero_note_dict_diff?.["Sleep & Weight"]?.["Sleep Start"] || {}
    ).length > 0;
  const hasNewWeight =
    Object.keys(phaero_note_dict_diff?.["Sleep & Weight"]?.Weight || {})
      .length > 0;
  const hasNewSteps = phaero_note_dict_diff?.Exercise?.Steps !== undefined;
  const hasNewNutrition =
    Object.keys(phaero_note_dict_diff?.Nutrition?.Total || {}).length > 0;
  return (
    hasNewFoods ||
    hasNewExercise ||
    hasNewSleep ||
    hasNewWeight ||
    hasNewSteps ||
    hasNewNutrition ||
    hasNotFoundFoods
  );
}
const PhaeroMessage: React.FC<PhaeroMessageProps> = ({
  message,
  currentMessageIndex,
  isLastMessage,
  sender,
  phaero_note_dict_diff,
  onCTAClick,
  ctaLabel,
  typeOfCTAClick,
  markdownText,
  nonMarkdown,
  ctaHasMandatoryUserEvent,
  display,
  used_note_ids,
}) => {
  const {
    editEntry,
    updateEditEntry,
    sleepSurvey,
    handleQuestionChange,
    userChangedEditEntry,
    updateUserEditEntry,
    messages,
  } = useContext(JournalNoteContext);
  const theme = useTheme();
  const windowWidth = useWindowWidth();
  const bubbleStyles = {
    display: "inline-flex",
    padding: "1em",
    paddingBottom: "0.5em",
    marginBottom: "10px",
    borderRadius: "calc(1em + 1.5em)/1em",
    borderInline: "1.5em solid #0000",
    mask: "radial-gradient(100% 100% at var(--_p) 0, #0000 99%, #000 102%) var(--_p) 100% / 1.5em 1.5em no-repeat, linear-gradient(#000 0 0) padding-box",
    background: theme.palette.primary.main,
    color: "white",
    maxWidth: windowWidth > 768 ? "72%" : "90%",
    alignItems: "center",
    flexDirection: "column" as const,
    fontSize: windowWidth < 768 ? "15px" : "18px",
  };
  const leftBubbleStyles = {
    ...bubbleStyles,
    "--_p": "0",
    borderBottomLeftRadius: "0 0",
    alignSelf: "start",
  };
  const previousMessages = messages.slice(0, currentMessageIndex);
  const currentMessageIsFirstWithSomethingNew =
    previousMessages.filter((m) => messageHasSomethingNewInDiff(m)).length ===
    0 && sender === "Phaero";
  const hasNotFoundFoods =
    Object.keys(phaero_note_dict_diff?.Food?.["Not found foods"] || {}).length >
    0;
  const hasNewFoods =
    Object.keys(phaero_note_dict_diff?.Food?.FoodList || {}).length > 0;
  const hasNewExercise =
    Object.keys(phaero_note_dict_diff?.Exercise?.Exercises || {}).length > 0;
  const hasNewSleep =
    Object.keys(phaero_note_dict_diff?.["Sleep & Weight"]?.["Sleep End"] || {})
      .length > 0 ||
    Object.keys(
      phaero_note_dict_diff?.["Sleep & Weight"]?.["Sleep Start"] || {}
    ).length > 0;
  const hasNewWeight =
    Object.keys(phaero_note_dict_diff?.["Sleep & Weight"]?.Weight || {})
      .length > 0;
  const hasNewSteps = phaero_note_dict_diff?.Exercise?.Steps !== undefined;
  const hasNewNutrition =
    Object.keys(phaero_note_dict_diff?.Nutrition?.Total || {}).length > 0;
  const hasSomethingNewInDiff =
    hasNewFoods ||
    hasNewExercise ||
    hasNewSleep ||
    hasNewWeight ||
    hasNewSteps ||
    hasNewNutrition ||
    hasNotFoundFoods;
  const navigate = useNavigate();
  const { mapKeys } = useContext(MapKeysContext);
  const formatFoodName = useFormattedFoodName();
  const hasConfirmedX = (
    food: string | undefined,
    exercise:
      | { exerciseType: keyof ExerciseDetails; exercise: string }
      | undefined,
    sleep: { sleepType: keyof SleepAndWeight } | undefined,
    weight: string | undefined
  ) => {
    if (food != undefined) {
      return userChangedEditEntry?.result.Food?.FoodList?.[food] != undefined;
    }
    if (exercise != undefined) {
      return (
        userChangedEditEntry?.result.Exercise?.Exercises?.[
        exercise.exerciseType
        ]?.[exercise.exercise] != undefined
      );
    }
    if (sleep != undefined) {
      return (
        userChangedEditEntry?.result["Sleep & Weight"]?.[sleep.sleepType] ==
        phaero_note_dict_diff?.["Sleep & Weight"]?.[sleep.sleepType]
      );
    }
    if (weight != undefined) {
      return (
        phaero_note_dict_diff?.["Sleep & Weight"]?.Weight &&
        userChangedEditEntry?.result["Sleep & Weight"]?.Weight[0] ===
        phaero_note_dict_diff?.["Sleep & Weight"]?.Weight[0]
      );
    }
    return false;
  };
  const confirmItem = (
    food?: string,
    exercise?: { exerciseType: keyof ExerciseDetails; exercise: string },
    sleep?: "Sleep Start" | "Sleep End",
    weight?: string
  ) => {
    if (!userChangedEditEntry || !userChangedEditEntry.result) {
      return false;
    }
    console.log(userChangedEditEntry.result, food);
    let updatedEntry = { ...userChangedEditEntry };

    if (food !== undefined && phaero_note_dict_diff?.Food?.FoodList?.[food]) {
      updateUserEditEntry({
        ...updatedEntry,
        result: {
          ...updatedEntry.result,
          Food: {
            ...updatedEntry.result.Food,
            FoodList: {
              ...updatedEntry.result.Food?.FoodList,
              [food]: phaero_note_dict_diff?.Food?.FoodList?.[
                food
              ] as Nutrients,
            },
          },
        },
      });
    }

    if (
      exercise !== undefined &&
      phaero_note_dict_diff?.Exercise?.Exercises?.[exercise.exerciseType]?.[
      exercise.exercise
      ]
    ) {
      updateUserEditEntry({
        ...updatedEntry,
        result: {
          ...updatedEntry.result,
          Exercise: {
            ...updatedEntry.result.Exercise,
            Exercises: {
              ...updatedEntry.result.Exercise?.Exercises,
              [exercise.exerciseType]: {
                ...updatedEntry.result.Exercise?.Exercises?.[
                exercise.exerciseType
                ],
                [exercise.exercise]: phaero_note_dict_diff?.Exercise
                  ?.Exercises?.[exercise.exerciseType]?.[
                  exercise.exercise
                ] as any,
              },
            },
          },
        },
      });
    }

    if (sleep !== undefined) {
      if (
        (sleep == "Sleep End" || sleep == "Sleep Start") &&
        updatedEntry.result["Sleep & Weight"]?.[sleep] !== undefined
      ) {
        updateUserEditEntry({
          ...updatedEntry,
          result: {
            ...updatedEntry.result,
            "Sleep & Weight": {
              ...updatedEntry.result["Sleep & Weight"],
              [sleep]: phaero_note_dict_diff?.["Sleep & Weight"]?.[sleep],
            },
          },
        });
      }
    }

    if (
      weight !== undefined &&
      phaero_note_dict_diff?.["Sleep & Weight"]?.Weight
    ) {
      updateUserEditEntry({
        ...updatedEntry,
        result: {
          ...updatedEntry.result,
          "Sleep & Weight": {
            ...updatedEntry.result["Sleep & Weight"],
            Weight: phaero_note_dict_diff?.["Sleep & Weight"]?.Weight,
          },
        },
      });
    }
  };
  const removeConfirmedItem = (
    food?: string,
    exercise?: { exerciseType: keyof ExerciseDetails; exercise: string },
    sleep?: "Sleep Start" | "Sleep End",
    weight?: string
  ) => {
    if (!userChangedEditEntry || !userChangedEditEntry.result) {
      return false;
    }
    let updatedEntry = { ...userChangedEditEntry };
    if (food !== undefined) {
      delete updatedEntry.result.Food?.FoodList?.[food];
    }
    if (exercise !== undefined) {
      delete updatedEntry.result.Exercise?.Exercises?.[exercise.exerciseType]?.[
        exercise.exercise
      ];
    }
    if (sleep !== undefined) {
      delete updatedEntry.result["Sleep & Weight"]?.[sleep];
    }
    if (weight !== undefined && updatedEntry.result["Sleep & Weight"]) {
      updatedEntry.result["Sleep & Weight"].Weight = [0, "kg"];
    }
    updateUserEditEntry(updatedEntry);
  };
  const ConfirmButton = ({
    onClick,
  }: {
    onClick: () => void;
    text: string;
  }) => (
    <Button
      onClick={onClick}
      variant="text"
      size="small"
      style={{
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <FontAwesomeIcon
        icon={faLockOpen}
        style={{ fontSize: theme.iconSize.medium }}
      />
    </Button>
  );
  const LockedButton = ({ onClick }: { onClick: () => void; text: string }) => (
    <Button
      onClick={onClick}
      variant="text"
      size="small"
      style={{ background: "white" }}
    >
      <FontAwesomeIcon
        icon={faLock}
        style={{ fontSize: theme.iconSize.medium }}
      />
    </Button>
  );

  const confirmLockButton = (
    variant: "food" | "exercise" | "sleep" | "weight",
    name: string,
    exercise_type?: keyof ExerciseDetails,
    sleep_type?: "Sleep Start" | "Sleep End"
  ) => {
    let confirmed, confirmAction, removeAction;

    switch (variant) {
      case "food":
        confirmed = hasConfirmedX(name, undefined, undefined, undefined);
        confirmAction = () =>
          confirmItem(name, undefined, undefined, undefined);
        removeAction = () =>
          removeConfirmedItem(name, undefined, undefined, undefined);
        break;
      case "exercise":
        const exercise = {
          exerciseType: exercise_type
            ? exercise_type
            : "Weight Lifting Exercises",
          exercise: name,
        };
        confirmed = hasConfirmedX(undefined, exercise, undefined, undefined);
        confirmAction = () =>
          confirmItem(undefined, exercise, undefined, undefined);
        removeAction = () =>
          removeConfirmedItem(undefined, exercise, undefined, undefined);
        break;
      case "sleep":
        if (!sleep_type) return null;
        confirmed = hasConfirmedX(
          undefined,
          undefined,
          { sleepType: sleep_type },
          undefined
        );
        confirmAction = () =>
          confirmItem(undefined, undefined, sleep_type, undefined);
        removeAction = () =>
          removeConfirmedItem(undefined, undefined, sleep_type, undefined);
        break;
      case "weight":
        confirmed = hasConfirmedX(undefined, undefined, undefined, name);
        confirmAction = () =>
          confirmItem(undefined, undefined, undefined, name);
        removeAction = () =>
          removeConfirmedItem(undefined, undefined, undefined, name);
        break;
      default:
        return null;
    }

    return (
      <div>
        {confirmed ? (
          <LockedButton onClick={removeAction} text="Lock" />
        ) : (
          <ConfirmButton onClick={confirmAction} text="Confirm" />
        )}
      </div>
    );
  };

  const renderNutritionMessage = () => {
    if (!phaero_note_dict_diff) return "";
    let messageToDisplay = "#####" + mapKeys("Found new food information!");
    if (phaero_note_dict_diff.Nutrition?.Total?.Macros) {
      messageToDisplay +=
        "\n\n---\n\n" +
        "**" +
        mapKeys("Macros") +
        "**" +
        "\n" +
        Object.keys(phaero_note_dict_diff.Nutrition.Total.Macros)
          .filter((macro) => macro !== "amount")
          .map(
            (m) =>
              "* " +
              mapKeys(m) +
              " - " +
              phaero_note_dict_diff.Nutrition?.Total?.Macros?.[
                m as keyof NutrientValues
              ]?.[0].toFixed(1) +
              " " +
              (m === "calories" ? "kcal" : m === "fluid" ? "ml" : "g")
          )
          .join("\n");
    }
    if (
      phaero_note_dict_diff.Food &&
      phaero_note_dict_diff.Food?.["Not found foods"]
    ) {
      messageToDisplay +=
        "\n\n---\n\n" +
        "**" +
        mapKeys("Not found foods:") +
        "**" +
        "\n" +
        Object.keys(phaero_note_dict_diff.Food?.["Not found foods"] ?? {})
          .sort((a, b) => a < b ? 1 : -1).map((f) => {
            const result = "* " + formatFoodName(f);
            const amount =
              phaero_note_dict_diff.Food?.["Not found foods"]?.[f]?.Macros
                ?.amount;
            const displayAmount =
              amount !== undefined ? `${amount[0]}g` : mapKeys("Removed");
            return result + " (" + displayAmount + ")";
          })
          .join("\n");
      messageToDisplay += "\n\n\n";
      messageToDisplay += "\n⠀\n---\n\n"; // NOTE INVISIBLE UNICODE TO BREAK
      messageToDisplay += mapKeys("If I made a mistake here:") + "\n\n";
      messageToDisplay += mapKeys(
        "I'm sorry! 😢, just ignore this and forget it ever happened"
      );
    }
    return messageToDisplay;
  };
  const renderFoodList = () => {
    if (!phaero_note_dict_diff?.Food?.FoodList) return null;
    return Object.keys(phaero_note_dict_diff.Food.FoodList).sort((a, b) => a < b ? 1 : -1).map((f) => {
      const food = phaero_note_dict_diff.Food?.FoodList?.[f];
      let result = "* " + formatFoodName(f);
      if (food) {
        result += " (" + food.Macros?.amount?.[0].toFixed(1) + "g)";
      } else {
        result += " " + mapKeys("Removed");
      }
      return (
        <div key={f} className="flex items-center justify-start mt-1">
          <div className={"max-w-[75%] min-w-[75%]"}>
            <MarkdownDisplay text={result}></MarkdownDisplay>
          </div>
          {food && confirmLockButton("food", f)}
        </div>
      );
    });
  };

  const renderExerciseMessage = () => {
    if (!phaero_note_dict_diff) return "";

    const renderExerciseType = (exerciseType: keyof ExerciseDetails) => {
      const exercises =
        phaero_note_dict_diff.Exercise?.Exercises?.[exerciseType] || {};
      return Object.keys(exercises).sort((a, b) => a < b ? 1 : -1).map((e) => {
        const exercise = exercises[e];
        let result = "* " + mapExerciseRegardlessOfRepetitionInList(e);
        if (exercise) {
          result += " " + formatExerciseImplementation(exercise);
        } else {
          result += " " + mapKeys("Removed");
        }
        return (
          <div key={e} className="flex items-center justify-start mt-1">
            <div className={"max-w-[75%] min-w-[75%]"}>
              <MarkdownDisplay text={result}></MarkdownDisplay>
            </div>
            {exercise && confirmLockButton("exercise", e, exerciseType)}
          </div>
        );
      });
    };

    // let messageToDisplay = "#####" + mapKeys("Detected new exercises!") + "\n\n---\n\n";
    const renderExerciseCategoryName = (
      exerciseType: keyof ExerciseDetails
    ) => {
      if (!phaero_note_dict_diff?.Exercise?.Exercises?.[exerciseType])
        return null;
      return (
        <div className="mt-1">
          <MarkdownDisplay text={mapKeys(exerciseType) + "\n\n---\n\n"} />
          {renderExerciseType(exerciseType)}
        </div>
      );
    };
    return (
      <PhaeroMessage
        isLastMessage={false}
        sender={sender}
        // markdownText={messageToDisplay}
        nonMarkdown={
          <div>
            {renderExerciseCategoryName("Cardio Exercises")}
            {renderExerciseCategoryName("Bodyweight Exercises")}
            {renderExerciseCategoryName("Weight Lifting Exercises")}
            {renderExerciseCategoryName("Other Exercises")}
          </div>
        }
        ctaLabel="View now"
        onCTAClick={() => navigate("/home/edit-entry/exercise")}
        typeOfCTAClick="exercise"
      />
    );
  };

  const renderStepsMessage = () => {
    if (!phaero_note_dict_diff) return null;
    return (
      <PhaeroMessage
        isLastMessage={false}
        sender={sender}
        ctaLabel="View now"
        onCTAClick={() => navigate("/home/edit-entry/exercise")}
        markdownText={
          "#####" +
          mapKeys("Detected steps!") +
          "\n\n---\n\n" +
          mapKeys("Steps:") +
          " " +
          phaero_note_dict_diff.Exercise?.Steps
        }
        typeOfCTAClick="exercise"
      />
    );
  };

  const renderSleepMessage = () => {
    if (!phaero_note_dict_diff) return "";

    const sleepStart = phaero_note_dict_diff["Sleep & Weight"]?.["Sleep Start"];
    const sleepEnd = phaero_note_dict_diff["Sleep & Weight"]?.["Sleep End"];
    const renderSleepTime = (time: string, type: "start" | "end") => {
      return (
        <div>
          <MarkdownDisplay
            text={
              "**" +
              mapKeys("Sleep " + (type === "start" ? "Start" : "End")) +
              "**\n" +
              "* " +
              time.split("T")[1]
            }
          />
        </div>
      );
    };
    const nonMarkdownContent = (
      <div className="flex flex-col ">
        {sleepStart && (
          <div className={"flex items-center gap-2 mt-1"}>
            <div className="min-w-[75%] max-w-[70%]">
              {renderSleepTime(sleepStart, "start")}
            </div>
            {confirmLockButton(
              "sleep",
              "Sleep Start",
              undefined,
              "Sleep Start"
            )}
          </div>
        )}
        {sleepEnd && (
          <div className={"flex items-center gap-2"}>
            <div className="min-w-[75%] max-w-[70%]">
              {renderSleepTime(sleepEnd, "end")}
            </div>
            {confirmLockButton("sleep", "Sleep End", undefined, "Sleep End")}
          </div>
        )}
      </div>
    );

    return (
      <PhaeroMessage
        isLastMessage={false}
        sender={sender}
        markdownText={"#####" + mapKeys("Detected sleep!") + "\n\n---\n\n"}
        nonMarkdown={nonMarkdownContent}
        ctaLabel="View now"
        onCTAClick={() => navigate("/home/edit-entry/sleep")}
        typeOfCTAClick="sleep"
      />
    );
  };

  const renderWeightMessage = () => {
    if (!phaero_note_dict_diff) return "";
    const markdownText =
      "#####" + mapKeys("Detected bodyweight!") + "\n\n---\n\n";
    const weight = phaero_note_dict_diff["Sleep & Weight"]?.Weight;
    const nonMarkdownContent = (
      <div className="flex items-center gap-2">
        <div className="min-w-[75%] max-w-[70%]">
          <MarkdownDisplay
            text={
              "**" +
              mapKeys("Weight") +
              "**\n" +
              "* " +
              weight?.[0] +
              " " +
              weight?.[1]
            }
          />
        </div>
        {confirmLockButton("weight", "Weight", undefined, undefined)}
      </div>
    );
    return (
      <PhaeroMessage
        isLastMessage={false}
        sender={sender}
        markdownText={markdownText}
        nonMarkdown={nonMarkdownContent}
        ctaLabel="View now"
        onCTAClick={() => navigate("/home/edit-entry/sleep")}
        typeOfCTAClick="weight"
      />
    );
  };

  const messagePaperRef = React.useRef<HTMLDivElement>(null);
  const [paperWidth, setPaperWidth] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (messagePaperRef.current) {
      setPaperWidth(messagePaperRef.current.clientWidth + 50);
    }
  }, [messagePaperRef.current?.clientWidth]);
  const [typingComplete, setTypingComplete] = React.useState(!isLastMessage);
  const mapCTAClickToIcon = (
    type: "sleep" | "exercise" | "food" | "weight" | "note"
  ) => {
    switch (type) {
      case "sleep":
        return (
          <Moon
            size={theme.iconSize.medium}
            color={theme.palette.primary.main}
          />
        );
      case "exercise":
        return (
          <Weight
            size={theme.iconSize.medium}
            color={theme.palette.primary.main}
          />
        );
      case "food":
        return (
          <Apple
            size={theme.iconSize.medium}
            color={theme.palette.primary.main}
          />
        );
      case "weight":
        return (
          <WeightMeter
            size={theme.iconSize.medium}
            color={theme.palette.primary.main}
          />
        );
      case "note":
        return (
          <Note
            size={theme.iconSize.medium}
            color={theme.palette.primary.main}
          />
        );
    }
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          maxWidth: "100%",
          marginBottom: onCTAClick && ctaLabel ? "" : "10px",
        }}
      >
        {(!hasSomethingNewInDiff || currentMessageIsFirstWithSomethingNew) && (
          <div className="flex">
            <div className="flex items-end min-w-[50px] max-w-[50px]">
              <img
                src={PhaeroCompanion}
                alt="Phaero Companion"
                style={{ width: "50px", height: "50px", borderRadius: 17 }}
              />
            </div>

            <Paper
              elevation={3}
              style={leftBubbleStyles}
              className="relative pr-3"
              ref={messagePaperRef}
            >
              <div className="pb-1 w-full">
                {isLastMessage && !typingComplete && display === undefined ? (
                  <Typewriter
                    onInit={(typewriter) => {
                      typewriter
                        .callFunction(() => setTypingComplete(true))
                        .typeString(message || "")
                        .start();
                    }}
                  />
                ) : markdownText ? (
                  <MarkdownDisplay text={markdownText} />
                ) : typingComplete ? (
                  <MarkdownDisplay text={message || ""} />
                ) : (
                  message
                )}
              </div>
              {typingComplete && nonMarkdown && (
                <div className="pb-1 mr-3">{nonMarkdown}</div>
              )}
            </Paper>
          </div>
        )}
        {display && display === "wellbeing" && editEntry && (
          <Paper
            elevation={3}
            style={{
              width: paperWidth !== null ? paperWidth + 20 : "",
              maxWidth: "80%",
            }}
            className={`flex justify-end items-center p-2 gap-3 ml-10 ${windowWidth < 380 && "flex-col"
              }`}
          >
            <WellbeingSlider
              value={editEntry.result.Note.Rating}
              setValue={(newVal) => {
                if (editEntry)
                  updateEditEntry({
                    ...editEntry,
                    result: {
                      ...editEntry.result,
                      Note: {
                        ...editEntry.result.Note,
                        Rating: newVal,
                      },
                    },
                  });
              }}
            />
            <MapKeyedButton
              text={"View now"}
              onClick={() => navigate("/home/edit-entry/note")}
              variant="outlined"
              maxHeigth="20px"
              style={{
                borderRadius: "30px",
                textTransform: "none",
                minWidth: "2px",
                marginBottom: "10px",
              }}
            />
          </Paper>
        )}


        <SleepSurvey
          display={display}
          sleepSurvey={sleepSurvey}
          handleQuestionChange={handleQuestionChange}
          navigate={navigate}
          paperWidth={paperWidth !== null ? paperWidth + 20 : null}
          sleepQuestions={sleepQuestions}
        />
        {display && display === "checklist" && (
          <div
            className={`max-w-[100%] ${windowWidth > 1000 && "max-w-[75%]"}`}
          >
            <Checklist messageView={true} />
          </div>
        )}
        {display && display === "habits" && (
          <div className={windowWidth > 520 ? "ml-10" : ""}>
            <HabitTracker messageView={true} />{" "}
          </div>
        )}
        {onCTAClick && ctaLabel && typeOfCTAClick && (
          <div
            style={{ width: paperWidth !== null ? paperWidth + 20 : "" }}
            className="flex justify-end"
          >
            {ctaHasMandatoryUserEvent ? (
              <Badge badgeContent="!" color="error">
                <MapKeyedButton
                  text={ctaLabel}
                  onClick={onCTAClick}
                  variant="outlined"
                  maxHeigth="20px"
                  style={{
                    borderRadius: "30px",
                    textTransform: "none",
                    minWidth: "135px",
                    marginBottom: "10px",
                  }}
                  startIcon={mapCTAClickToIcon(typeOfCTAClick)}
                />
              </Badge>
            ) : (
              <MapKeyedButton
                text={ctaLabel}
                onClick={onCTAClick}
                variant="outlined"
                maxHeigth="20px"
                style={{
                  borderRadius: "30px",
                  textTransform: "none",
                  minWidth: "135px",
                  marginBottom: "10px",
                }}
                startIcon={mapCTAClickToIcon(typeOfCTAClick)}
              />
            )}
          </div>
        )}
        {used_note_ids && used_note_ids.length > 0 && (
          <div
            className="flex justify-end"
            style={{ width: paperWidth !== null ? paperWidth + 20 : "" }}
          >
            <MapKeyedButton
              text={"View relevant Notes"}
              onClick={() => {
                navigate("/home/notes/" + used_note_ids[0]);
              }}
              variant="outlined"
              maxHeigth="20px"
              style={{
                borderRadius: "30px",
                textTransform: "none",
                minWidth: "200px",
                marginBottom: "10px",
              }}
              startIcon={
                <Note
                  size={theme.iconSize.medium}
                  color={theme.palette.primary.main}
                />
              }
            />
          </div>
        )}
      </div>

      {(hasNotFoundFoods || hasNewNutrition) && (
        <>
          <PhaeroMessage
            markdownText={renderNutritionMessage()}
            sender="Phaero"
            isLastMessage={false}
            ctaLabel={!hasNewFoods ? "View now" : undefined}
            onCTAClick={
              !hasNewFoods ? () => navigate("/home/edit-entry/food") : undefined
            }
            typeOfCTAClick="food"
            ctaHasMandatoryUserEvent={hasNotFoundFoods}
          />
        </>
      )}
      {hasNewFoods && (
        <PhaeroMessage
          sender="Phaero"
          isLastMessage={false}
          markdownText={"#####" + mapKeys("Food List:") + "\n\n---\n\n"}
          nonMarkdown={renderFoodList()}
          ctaLabel="View now"
          typeOfCTAClick="food"
          onCTAClick={() => navigate("/home/edit-entry/food")}
        ></PhaeroMessage>
      )}
      {hasNewExercise && renderExerciseMessage()}
      {hasNewSteps && renderStepsMessage()}
      {hasNewSleep && renderSleepMessage()}
      {hasNewWeight && renderWeightMessage()}
    </div>
  );
};

export default PhaeroMessage;
