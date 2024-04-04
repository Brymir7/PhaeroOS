import React, { useContext, useEffect, useState } from "react";
import { EntryData } from "../../../pages/EditEntryPage";
import EditDatetime from "./EditDatetime";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
} from "@mui/material";
import { AnimatedCheckbox } from "../../utils/Buttons";
import { DiagramDataType } from "../../../pages/StatisticsPage";
import UniversalChart from "../../statisticsPage/UniversalChart";
import { JournalNoteContext, sleepQuestions } from "../../contexts/JournalNoteContext";
import { useTheme } from "@mui/material";
import Icon from "@mdi/react";
import { mdiWeatherNightPartlyCloudy, mdiWeatherPartlyCloudy } from "@mdi/js";

interface Props {
  entryData: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  viewOnly?: boolean;
  diagramData?: DiagramDataType;
}

const EditSleep = ({ entryData, updateEntryData, viewOnly = false, diagramData }: Props) => {
  const { sleepSurvey, handleQuestionChange } = useContext(JournalNoteContext);
  const { mapKeys } = useContext(MapKeysContext);
  const handleDateEdit = (key: string, newDate: Date) => {
    const updatedData = {
      ...entryData,
      result: {
        ...entryData.result,
        ["Sleep & Weight"]: {
          ...entryData.result["Sleep & Weight"],
          [key]: newDate.toISOString().slice(0, 19),
        },
      },
    };
    const sleepDurationHours = (new Date(updatedData.result["Sleep & Weight"]["Sleep End"]).getTime() - new Date(updatedData.result["Sleep & Weight"]["Sleep Start"]).getTime()) / 1000 / 60 / 60;
    console.log(sleepDurationHours)
    updateSleepData(sleepDurationHours);
    updateEntryData(updatedData);
  };
  const [accurateSleepData, setAccurateSleepData] = useState<DiagramDataType | undefined>(diagramData);
  useEffect(() => {
    if (diagramData) {
      setAccurateSleepData(diagramData);
    }
  }, [diagramData]);
  const updateSleepData = (newValue: number) => {
    if (!accurateSleepData) return;
    const updatedSleepData: DiagramDataType = {
      ...accurateSleepData,
    };
    updatedSleepData.data[updatedSleepData.data.length - 1] = {
      date: updatedSleepData.data[updatedSleepData.data.length - 1]["date"],
      Duration: newValue,
    };
    setAccurateSleepData(updatedSleepData);
  }
  const theme = useTheme();
  return (
    <div className="mx-auto" style={{ marginTop: "0.25rem", maxWidth: "98vw" }}>
      <Typography variant="h4" className="pb-2 flex justify-center"> {mapKeys("Sleep")}</Typography>
      <div className="max-h-[80vh] overflow-y-auto space-y-2 pb-12 px-1">
        <div>
          <EditDatetime
            date={entryData.result["Sleep & Weight"]["Sleep Start"]}
            label={
              <div className="flex pl-3 items-center">
                <span className="w-5">
                  <Icon path={mdiWeatherNightPartlyCloudy} size={0.7} color={theme.palette.primary.main} />
                </span>
                <span className="ml-1">{mapKeys("Bed time")}</span>
              </div>
            }
            handleDateEdit={(newDate: Date) => {
              handleDateEdit("Sleep Start", newDate);
            }}
            viewOnly={viewOnly}
          />
        </div>
        <div>
          <EditDatetime
            date={entryData.result["Sleep & Weight"]["Sleep End"]}
            label={
              <div className="flex pl-3 items-center">
                <span className="w-5" >
                  <Icon path={mdiWeatherPartlyCloudy} size={0.7} color={theme.palette.primary.main} />
                </span>
                <span className="ml-1">{mapKeys("Rising time")}</span>
              </div>
            }
            handleDateEdit={(newDate: Date) => {
              handleDateEdit("Sleep End", newDate);
            }}
            viewOnly={viewOnly}
          />
        </div>
        <div>
          {sleepSurvey && (
            <Paper elevation={2} sx={{ p: 1 }}>
              <List sx={{ p: 0 }}>
                {sleepQuestions.map((question: string, index: number) => (
                  <ListItemButton
                    sx={{ pointerEvents: viewOnly ? "none" : "auto", py: 2.5 }}
                    key={index}
                    onClick={() => handleQuestionChange(index)}
                  >
                    <ListItemIcon sx={{ p: 0 }}>
                      <AnimatedCheckbox xMark isChecked={sleepSurvey[index]} />
                    </ListItemIcon>
                    <ListItemText
                      primary={mapKeys(question)}
                      primaryTypographyProps={{
                        sx: { fontSize: "14px", textTransform: "none", pl: 1 },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </div>
        {!viewOnly && diagramData && (
          <div>
            <Paper className="max-w-[42vh] mx-auto">
              <Typography variant="h6" className="flex pt-2 pl-4">
                {mapKeys("Sleep")}
              </Typography>
              <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
                <UniversalChart timeframe={7} diagramData={accurateSleepData} />
              </div>
            </Paper>
          </div>
        )}
      </div>
    </div>
  );
};
export default EditSleep;
