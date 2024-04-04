// ExtendedHabitView.tsx
import React, { useContext, useRef, useState } from "react";
import {
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  IconDefinition,
  faArrowLeft,
  faLayerGroup,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import html2canvas from "html2canvas";
import HabitIconSelector from "./HabitIconSelector";
import { MapKeysContext } from "../contexts/MapKeysContext";
import YearDisplay from "./YearDisplay";
import {
  HabitItem,
  RepeatEveryCertainDays,
  habitNumberProgress,
  isHabitBooleanProgress,
  isHabitNumberProgress,
  isHabitRepeatEveryCertainDays,
  textColors,
  colors,
} from "../goalsPage/types";
import HabitDaySelector from "./HabitDaySelector";
import GreenDivider from "../homePage/GreenDivider";
import { Camera, ColorSwatch, Trash } from "iconsax-react";
interface ExtendedHabitViewProps {
  habit: HabitItem;
  deleteHabit: (id: number) => void;
  modifyHabit: (habit: HabitItem) => void;
  closeHabitDetails: () => void;
  color: string;
  iconToUse: IconDefinition;
}

const ExtendedHabitView: React.FC<ExtendedHabitViewProps> = ({
  habit,
  deleteHabit,
  modifyHabit,
  closeHabitDetails,
  iconToUse,
}) => {
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();
  const [open, setOpen] = React.useState(false);
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleDelete = () => {
    deleteHabit(habit.id);
    setOpen(false);
  };
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedTitle, setEditedTitle] = useState(habit.title);
  const [editedDescription, setEditedDescription] = useState(habit.description);
  const [openIconSelector, setOpenIconSelector] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState<number | null>(
    habit.repeat_every as number
  );
  const [showDays, setShowDays] = useState(false);
  const handleSaveEdit = (type: "title" | "description") => {
    if (type === "title") {
      habit.title = editedTitle;
      setIsEditingTitle(false);
    } else {
      habit.description = editedDescription;
      setIsEditingDescription(false);
    }
    modifyHabit(habit);
  };
  const handleRepeatEveryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value === "") {
      setRepeatEvery(null);
    }
    if (parseInt(e.target.value) > 0) {
      setRepeatEvery(parseInt(e.target.value));
      habit.repeat_every = parseInt(e.target.value);
      modifyHabit(habit);
    }
  };
  const extendedViewRef = useRef<HTMLDivElement>(null);
  const handleTakeScreenshot = async () => {
    if (extendedViewRef.current) {
      const canvas = await html2canvas(extendedViewRef.current, {
        scrollX: 0,
        scrollY: -window.scrollY,
      });
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `${habit.title}_progress.png`;
      link.click();
    }
  };
  function padProgressYearly<T>(progress: T[]) {
    const progressCopy = progress.slice();
    if (progressCopy.length % 365 != 0) {
      const remainingEntries = 365 - (progressCopy.length % 365);
      const remainingProgress = new Array(remainingEntries).fill(false);
      progressCopy.push(...remainingProgress);
    }
    return progressCopy;
  }
  const trackingStartDate = dayjs(habit.recorded_at)
    .subtract(habit.progress.progress.length - 1, "day")
    .format("YYYY-MM-DD"); // - 1 for 0-based index

  return (
    <div className="h-[100%] flex flex-col items-start">
      <div ref={extendedViewRef} className="p-2 mb-4 ">
        <div className="flex justify-center items-center">
          {isEditingTitle ? (
            <TextField
              fullWidth
              variant="outlined"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => handleSaveEdit("title")}
              className="text-2xl font-bold"
            />
          ) : (
            <Typography
              variant="h5"
              component="h3"
              onClick={() => setIsEditingTitle(true)}
            >
              <FontAwesomeIcon
                icon={iconToUse}
                size="1x"
                className={`${
                  textColors[
                    (colors.indexOf(habit.color) || 0) % textColors.length
                  ]
                } mr-2`}
              />
              {habit.title}
            </Typography>
          )}
        </div>
        <GreenDivider></GreenDivider>
        <div className="mt-2 mb-3">
          {isEditingDescription ? (
            <TextField
              fullWidth
              multiline
              variant="outlined"
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={() => handleSaveEdit("description")}
              className="text-lg"
            />
          ) : (
            <Typography
              variant="body1"
              onClick={() => setIsEditingDescription(true)}
            >
              {habit.description
                ? `${mapKeys("Description:")} ${habit.description}`
                : ""}
            </Typography>
          )}
          <Typography variant="body2" className="text-gray-500 pb-1">
            {mapKeys("Tracking Since:")} {trackingStartDate}
          </Typography>
        </div>
        <Card
          variant="outlined"
          sx={{
            padding: 1,
            paddingTop: 0,
            marginBottom: 2,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Button
            onClick={() => setShowDays(!showDays)}
            style={{ textTransform: "none", marginBottom: "20px" }}
          >
            {showDays ? mapKeys("Hide days") : mapKeys("Show days")}
          </Button>
          <YearDisplay
            completions={
              isHabitBooleanProgress(habit.progress)
                ? padProgressYearly(habit.progress.progress as boolean[])
                : padProgressYearly(habit.progress.progress as number[])
            }
            color={habit.color}
            trackingStartDate={trackingStartDate}
            maxValue={
              isHabitNumberProgress(habit.progress)
                ? habit.progress.maxPerDay
                : undefined
            }
            showDays={showDays}
          ></YearDisplay>
        </Card>
        <div className="flex flex-col ">
          {!isHabitRepeatEveryCertainDays(habit.repeat_every) ? (
            <TextField
              variant="outlined"
              disabled={true}
              label={
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faRepeat} />
                  <Typography variant="body1">
                    {mapKeys("Repeat every")}
                  </Typography>
                </div>
              }
              value={repeatEvery}
              sx={{ maxWidth: "250px" }}
              type="number"
              onChange={handleRepeatEveryChange}
            />
          ) : (
            <HabitDaySelector
              selectedDays={(habit.repeat_every as RepeatEveryCertainDays).days}
              setSelectedDays={(days) => {
                (habit.repeat_every as RepeatEveryCertainDays).days = days;
                modifyHabit(habit);
              }}
              disabled={true}
            ></HabitDaySelector>
          )}
          {isHabitNumberProgress(habit.progress) ? (
            <TextField
              sx={{ marginTop: "8px", maxWidth: "250px" }}
              variant="outlined"
              label={
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faLayerGroup} />
                  <Typography variant="body1">
                    {mapKeys("Completions per day")}
                  </Typography>
                </div>
              }
              type="number"
              value={habit.progress.maxPerDay}
              onChange={(e) => {
                (habit.progress as habitNumberProgress).maxPerDay = parseInt(
                  e.target.value
                );
                modifyHabit(habit);
              }}
            />
          ) : null}
        </div>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {mapKeys("Confirm Deletion")}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {mapKeys(
                `Are you sure you want to delete this habit? This action cannot be undone.`
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{mapKeys("Cancel")}</Button>
            <Button onClick={handleDelete} color="error">
              {mapKeys("Delete")}
            </Button>
          </DialogActions>
        </Dialog>
        {openIconSelector ? (
          <HabitIconSelector
            onClose={() => setOpenIconSelector(false)}
            onIconSelect={(icon: string) => {
              habit.icon = icon;
              modifyHabit(habit);
            }}
          ></HabitIconSelector>
        ) : null}
      </div>
      <Typography className="pl-1 mt-2">
        {mapKeys("Tap on what you want to change!")}
      </Typography>
      <Button
        onClick={() => {
          habit.color =
            colors[(colors.indexOf(habit.color) + 1) % colors.length];
          modifyHabit(habit);
        }}
        style={{ minWidth: "auto", textTransform: "none" }}
        color="inherit"
      >
        <ColorSwatch
          className={
            textColors[(colors.indexOf(habit.color) || 0) % textColors.length]
          }
        ></ColorSwatch>
        <div className="ml-2">{mapKeys("Color")}</div>
      </Button>
      <Button
        onClick={() => {
          setOpenIconSelector(true);
        }}
        style={{ textTransform: "none" }}
        color="inherit"
      >
        <FontAwesomeIcon
          icon={iconToUse}
          style={{
            fontSize: theme.iconSize.medium,
          }}
          className={
            textColors[(colors.indexOf(habit.color) || 0) % textColors.length]
          }
        />
        <div className="ml-2">{mapKeys("Change Icon")}</div>
      </Button>
      <Button
        onClick={handleTakeScreenshot}
        style={{ minWidth: "auto", textTransform: "none" }}
        color="inherit"
      >
        <Camera
          size={theme.iconSize.medium}
          className={
            textColors[(colors.indexOf(habit.color) || 0) % textColors.length]
          }
        />
        <div className="ml-2">{mapKeys("Take Screenshot")}</div>
      </Button>
      <div className="flex w-full " style={{ marginTop: "auto" }}>
        <Button
          variant="contained"
          color="primary"
          onClick={closeHabitDetails}
          fullWidth
        >
          <FontAwesomeIcon className="" size="lg" icon={faArrowLeft} />
        </Button>

        <div className="flex w-full">
          <Button
            color="error"
            onClick={handleClickOpen}
            fullWidth
            style={{ minWidth: "auto" }} // Adjust padding and minWidth to reduce button size if necessary
          >
            <Trash
              size={theme.iconSize.large}
              color={theme.palette.primary.error}
            />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExtendedHabitView;
