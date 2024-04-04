import React, { createContext, useContext, useEffect, useState } from "react";
import { useApi } from "../../modules/apiAxios";
import "./Flame.css";
import { HandleAllErrorsContext } from "./HandleAllErrors";
import { AuthContext } from "./AuthContext";
import { JournalNoteContext } from "./JournalNoteContext";

interface StreakContextType {
  streak: number;
  setStreak: React.Dispatch<React.SetStateAction<number>>;
  fetchStreak: () => void;
  displayFlame: () => JSX.Element;
  getStreakNumberColor: () => string;
  recordedANoteAt: any[];
  completedChecklistCount: number;
  habitCount: number;
  avgCalories: number;
  avgFluid: number;
  avgSleepDuration: string;
  avgBedtime: string;
  avgWaketime: string;
  avgSteps: number;
  avgWellbeing: number;
}
export const StreakContext = createContext<StreakContextType>({
  streak: 0,
  setStreak: () => {},
  fetchStreak: () => {},
  displayFlame: () => {
    return <></>;
  },
  getStreakNumberColor: () => {
    return "text-red-500";
  },
  recordedANoteAt: [],
  completedChecklistCount: 0,
  habitCount: 0,
  avgCalories: 0,
  avgFluid: 0,
  avgSleepDuration: "0",
  avgBedtime: "22:00",
  avgWaketime: "6:00",
  avgSteps: 0,
  avgWellbeing: 0,

});

export const StreakProvider = ({ children }: { children: React.ReactNode }) => {
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [streak, setStreak] = useState<number>(0);
  const [recordedANoteAt, setRecordedANoteAt] = useState<any[]>([]);
  const [habitCount, setHabitCount] = useState<number>(0);
  const [completedChecklistCount, setCompletedChecklistCount] = useState<number>(0);
  const [avgCalories, setAvgCalories] = useState<number>(0);
  const [avgFluid, setAvgFluid] = useState<number>(0);
  const [avgSleepDuration, setAvgSleepDuration] = useState<string>("");
  const [avgBedtime, setAvgBedtime] = useState<string>("");
  const [avgWaketime, setAvgWaketime] = useState<string>("");
  const [avgSteps, setAvgSteps] = useState<number>(0);
  const [avgWellbeing, setAvgWellbeing] = useState<number>(0);
  
  const [currColours, setCurrColours] = useState<string[] | undefined>(
    undefined
  );
  const { hasAccess } = useContext(AuthContext);
  const {note, editEntry} = useContext(JournalNoteContext);
  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess, note, editEntry]);

  const initialLoad = () => {
    api
      .get("/streak/")
      .then((response) => {
        setStreak(response.data.currentStreak);
        setRecordedANoteAt(response.data.recordedANoteAt);
        setHabitCount(response.data.habitCount);
        setCompletedChecklistCount(response.data.completedChecklistCount);
        setAvgCalories(response.data.avgCalories);
        setAvgFluid(response.data.avgFluid);
        setAvgSleepDuration(response.data.avgSleepDuration);
        setAvgBedtime(response.data.avgBedtime);
        setAvgWaketime(response.data.avgWaketime);
        setAvgSteps(response.data.avgSteps);
        setAvgWellbeing(response.data.avgWellbeing);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  //get streak
  const fetchStreak = () => {
    setTimeout(() => {
      initialLoad();
    }, 10000);
  };

  useEffect(() => {
    let flame = 0;
    if (streak === 0) {
      flame = 4;
    } else if (streak < 3) {
      flame = 3;
    } else if (streak < 6) {
      flame = 2;
    } else if (streak < 13) {
      flame = 5;
    } else if (streak < 20) {
      flame = 6;
    } else if (streak < 27) {
      flame = 7;
    } else if (streak < 41) {
      flame = 8;
    } else if (streak < 55) {
      flame = 9;
    } else if (streak < 69) {
      flame = 10;
    } else if (streak < 99) {
      flame = 11;
    } else if (streak > 99) {
      flame = 12;
    }
    // flame = 5;

    switch (flame) {
      case 1:
        setCurrColours(["flm-1-1", "flm-1-2", "flm-1-3", "flm-1-4"]);
        break;
      case 2:
        setCurrColours(["flm-2-1", "flm-2-2", "flm-2-3", "flm-2-4"]);
        break;
      case 3:
        setCurrColours(["flm-3-1", "flm-3-2", "flm-3-3", "flm-3-4"]);
        break;
      case 4:
        setCurrColours(["flm-4-1", "flm-4-2", "flm-4-3", "flm-4-4"]);
        break;
      case 5:
        setCurrColours(["flm-5-1", "flm-5-2", "flm-5-3", "flm-5-4"]);
        break;
      case 6:
        setCurrColours(["flm-6-1", "flm-6-2", "flm-6-3", "flm-6-4"]);
        break;
      case 7:
        setCurrColours(["flm-7-1", "flm-7-2", "flm-7-3", "flm-7-4"]);
        break;
      case 8:
        setCurrColours(["flm-8-1", "flm-8-2", "flm-8-3", "flm-8-4"]);
        break;
      case 9:
        setCurrColours(["flm-9-1", "flm-9-2", "flm-9-3", "flm-9-4"]);
        break;
      case 10:
        setCurrColours(["flm-10-1", "flm-10-2", "flm-10-3", "flm-10-4"]);
        break;
      case 11:
        setCurrColours(["flm-11-1", "flm-11-2", "flm-11-3", "flm-11-4"]);
        break;
      case 12:
        setCurrColours(["flm-12-1", "flm-12-2", "flm-12-3", "flm-12-4"]);
        break;
    }
  }, [streak]);

const getStreakNumberColor = (): string => {
  if (streak === 0) {
    return "#9CA3AF"; // gray
  } else if (streak < 3) {
    return "#A3BFFA"; // light blue
  } else if (streak < 6) {
    return "#7F9CF5"; // medium blue
  } else if (streak < 13) {
    return "#5A67D8"; // dark blue
  } else if (streak < 20) {
    return "#805AD5"; // purple
  } else if (streak < 27) {
    return "#6B46C1"; // dark purple
  } else if (streak < 41) {
    return "#D53F8C"; // pink
  } else if (streak < 55) {
    return "#B83280"; // dark pink
  } else if (streak < 69) {
    return "#E53E3E"; // red
  } else if (streak < 99) {
    return "#DD6B20"; // orange
  } else if (streak < 110) {
    return "#38A169"; // green
  } else if (streak < 120) {
    return "#319795"; // teal
  } else if (streak < 130) {
    return "#2C7A7B"; // dark teal
  }
  return "#9CA3AF";
};

  //display flame
  const displayFlame = (): JSX.Element => {
    return (
      <>
        {currColours && (
          <div className="flame relative  w-full pb-10">
            <div
              className={`flm-part flm-first flipped ${currColours[0]} ${
                streak > 0 ? "animate-first" : "static-first"
              }`}
            ></div>
            <div
              className={`flm-part flm-second ${currColours[1]} ${
                streak > 0 ? "animate-second" : "static-second"
              }`}
            ></div>
            recordedANoteAt
            <div
              className={`flm-part flipped flm-third ${currColours[2]} ${
                streak > 0 ? "animate-third" : "static-third"
              }`}
            ></div>
            <div
              className={`flm-part flm-forth ${currColours[3]} ${
                streak > 0 ? "animate-forth" : "static-forth"
              }`}
            ></div>
          </div>
        )}
      </>
    );
  };

  return (
    <StreakContext.Provider
      value={{
        streak,
        setStreak,
        fetchStreak,
        displayFlame,
        getStreakNumberColor,
        recordedANoteAt,
        completedChecklistCount,
        habitCount,
        avgCalories,
        avgFluid,
        avgSleepDuration,
        avgBedtime,
        avgWaketime,
        avgSteps,
        avgWellbeing,
      }}
    >
      {children}
    </StreakContext.Provider>
  );
};
