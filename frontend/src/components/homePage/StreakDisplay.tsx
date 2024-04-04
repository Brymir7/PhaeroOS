import React, { useContext } from "react";
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Paper,
  Grid,
  Tooltip,
  useTheme,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFireFlameCurved } from "@fortawesome/free-solid-svg-icons";
import Icon from "@mdi/react";
import { mdiWaterOutline, mdiWeatherNightPartlyCloudy, mdiWeatherPartlyCloudy } from "@mdi/js";
import {
  Apple,
  CardTick,
  ClipboardTick,
  EmojiHappy,
  Moon,
  Note,
  TickSquare,
} from "iconsax-react";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import { StreakContext } from "../contexts/StreakContext";
import { JournalNoteContext } from "../contexts/JournalNoteContext";
import IconDescription from "./IconDescription";
import { useWindowHeight, useWindowWidth } from "../utils/CustomHooks";
dayjs.extend(localizedFormat);
const Streak: React.FC = () => {
  const theme = useTheme();
  const { language, mapKeys } = useContext(MapKeysContext);
  const {
    streak,
    recordedANoteAt,
    getStreakNumberColor,
    habitCount,
    completedChecklistCount,
    avgCalories,
    avgFluid,
    avgSleepDuration,
    avgBedtime,
    avgWaketime,
    avgWellbeing,
  } = useContext(StreakContext);
  const { username } = useContext(JournalNoteContext);
  const today = dayjs();
  let daysOfWeek = [];
  let datesOfWeek: string[] = [];
  let datesOfNotes: string[] = [];
  if (language === Language.German) {
    dayjs.locale("de");
  }
  if (recordedANoteAt.length >= 7 && streak >= 7) {
    daysOfWeek = Array.from({ length: 7 }, (_, i) =>
      today.subtract(i, "day").format("dd")
    ).reverse();
    datesOfWeek = Array.from({ length: 7 }, (_, i) =>
      today.subtract(i, "day").format("YYYY-MM-DD")
    ).reverse();
    datesOfNotes = recordedANoteAt.map((note) =>
      dayjs(note).format("YYYY-MM-DD")
    );
  } else {
    daysOfWeek = Array.from({ length: streak }, (_, i) =>
      today.subtract(i, "day").format("dd")
    )
      .reverse()
      .concat(
        Array.from({ length: 7 - streak }, (_, i) =>
          today.add(i, "day").format("dd")
        )
      );
    datesOfWeek = Array.from({ length: streak - 1 }, (_, i) =>
      today.subtract(i, "day").format("YYYY-MM-DD")
    )
      .reverse()
      .concat(
        Array.from({ length: 7 - streak + 1 }, (_, i) =>
          today.add(i, "day").format("YYYY-MM-DD")
        )
      );
    datesOfNotes = recordedANoteAt.map((note) =>
      dayjs(note).format("YYYY-MM-DD")
    );
  }
  const hasNoteOnDays = datesOfWeek.map((date) => datesOfNotes.includes(date));
  const color = getStreakNumberColor();
  const windowWidth = useWindowWidth();
  const windowHeight = useWindowHeight();
  const avgSleepDurationTitle = <p>{mapKeys("Average Sleep Duration")}</p>;
  const avgBedtimeTitle = <p>{mapKeys("Average Bedtime")}</p>;
  const avgWaketimeTitle = <p>{mapKeys("Average Waketime")}</p>;
  const avgWellbeingTitle = <p>{mapKeys("Average Wellbeing")}</p>;
  const avgCaloriesTitle = <p>{mapKeys("Average Calories")}</p>;
  const avgFluidTitle = <p>{mapKeys("Average Fluid Intake")}</p>;
  const hasNoEntryYet = avgWellbeing <= 0.1 && avgCalories <= 0.1 && avgFluid <= 0.1;

  return (
    <Paper
      sx={{
        display: "flex",
        flexDirection: windowWidth > 1900 ? "row" : "column",
        borderRadius: "20px",
        minHeight:
          windowWidth < 1900 ? (windowHeight < 1080 ? "40%" : "32%") : "20%",
        maxHeight: "49%",
        justifyContent: "center",
        alignItems: "center",
      }}
      elevation={4}
    >
      <div className="flex flex-col pl-4">
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          style={{
            justifyContent:
              "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IconButton sx={{ color }}>
              <FontAwesomeIcon
                icon={faFireFlameCurved}
                style={{ fontSize: theme.iconSize.habit }}
              />
            </IconButton>
            <Typography variant="h5" sx={{ margin: "8px 0", color }}>
              {streak} {streak > 1 ? mapKeys("Days") : mapKeys("Days").slice(0, -1)}
            </Typography>
          </Box>
          <div className="flex flex-col">
            <Typography variant="h6" sx={{ marginBottom: "0px" }}>
              {mapKeys("Your Streak")}
            </Typography>
            <Typography variant="body1" sx={{ marginBottom: "8px" }}>
              {username}
            </Typography>
            <Stack direction="row" spacing={1.25}>
              {hasNoteOnDays.map((hasNote, index) => (
                <TickSquare
                  key={index}
                  color={hasNote ? color : "gray"}
                  size={26}
                />
              ))}
            </Stack>
            <Stack direction="row" spacing={1.3}>
              {daysOfWeek.map((day, index) => (
                <Typography
                  key={index}
                  variant="body2"
                  sx={{
                    width: "26px",
                    height: "26px",
                    color: theme.palette.primary.secondaryText,
                  }}
                >
                  {day}
                </Typography>
              ))}
            </Stack>
          </div>
        </Stack>
      </div>
      {!hasNoEntryYet ? <Grid
        container
        spacing={1.4}
        className={`min-w-[340px] flex justify-center h-full mx-auto pl-8 ${windowWidth < 1900 ? "" : "pt-2"}`}
        sx={{ paddingTop: 0 }}
      >
        <Grid item xs={4} >
          <IconDescription
            icon={<CardTick />}
            primaryText={habitCount}
            secondaryText={mapKeys("Habit Count")}
            disablePrecision={true}

          />
        </Grid>
        <Grid item xs={4}>
          <IconDescription
            icon={<ClipboardTick />}
            primaryText={completedChecklistCount}
            secondaryText={mapKeys("Checklist Completions")}
            disablePrecision={true}
          />
        </Grid>
        <Grid item xs={4}>
          <IconDescription
            icon={<Note />}
            primaryText={recordedANoteAt.length}
            secondaryText={mapKeys("Notes")}
            disablePrecision={true}
          />
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgBedtimeTitle}>
            <div>
              <IconDescription
                icon={<Icon path={mdiWeatherNightPartlyCloudy} size={0.7} />}
                primaryText={avgBedtime}
                secondaryText={mapKeys("Bedtime (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgWaketimeTitle}>
            <div>
              <IconDescription
                icon={<Icon path={mdiWeatherPartlyCloudy} size={0.7} />}
                primaryText={avgWaketime}
                secondaryText={mapKeys("Waketime (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgSleepDurationTitle}>
            <div>
              <IconDescription
                icon={<Moon />}
                primaryText={avgSleepDuration}
                secondaryText={mapKeys("SleepDuration (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgWellbeingTitle}>
            <div>
              <IconDescription
                icon={<EmojiHappy />}
                primaryText={avgWellbeing}
                secondaryText={mapKeys("Wellbeing (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgCaloriesTitle}>
            <div>
              <IconDescription
                icon={<Apple />}
                primaryText={avgCalories}
                secondaryText={mapKeys("Calories (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
        <Grid item xs={4}>
          <Tooltip title={avgFluidTitle}>
            <div>
              <IconDescription
                icon={<Icon path={mdiWaterOutline} size={0.9} />}
                primaryText={avgFluid}
                secondaryText={mapKeys("Fluid (avg)")}
              />
            </div>
          </Tooltip>
        </Grid>
      </Grid> : (
        <div className="flex items-center justify-center w-full flex-grow rounded-md px-4">
          <div className="flex flex-col items-center space-y-2">
            <p className="text-lg">{mapKeys("No statistics found")}</p>
            <p className="text-center text-gray-700">
              {mapKeys("Start using Phaero to see your statistics")}
            </p>
          </div>
        </div>
      )}
    </Paper>
  );
};

export default Streak;
