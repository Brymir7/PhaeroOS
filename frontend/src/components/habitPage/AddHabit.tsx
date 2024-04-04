import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Days,
  HabitItem,
  HabitType,
  MapIconStringToIcon,
} from "../goalsPage/types"; // Adjust the import path based on your project structure
import HabitIconSelector from "./HabitIconSelector";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { MapKeysContext } from "../contexts/MapKeysContext";
import HabitDaySelector from "./HabitDaySelector";

interface AddHabitProps {
  open: boolean;
  onClose: () => void;
  onSave: (habit: HabitItem) => void;
}

const AddHabit: React.FC<AddHabitProps> = ({ open, onClose, onSave }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [openedIconSelector, setOpenedIconSelector] = useState(false);
  const [repeatEvery, setRepeatEvery] = useState(1);
  const [progressType, setProgressType] = useState<HabitType>(
    HabitType.BOOLEAN
  );
  const [repeatEveryCertainDays, setRepeatEveryCertainDays] = useState(false); // Relevant only for numeric progress
  const [repeatEveryDays, setRepeatEveryDays] = useState<Days[]>([]); // Relevant only for numeric progress
  const [maxPerDay, setMaxPerDay] = useState(1); // Relevant only for numeric progress

  const handleSave = () => {
    const newHabit: HabitItem = {
      // Assuming id and recorded_at will be handled server-side or with another mechanism
      id: Date.now(), // Placeholder for actual ID assignment mechanism
      title,
      description,
      icon,
      repeat_every:
        repeatEveryDays.length > 0
          ? {
            days: repeatEveryDays,
            type: "certain_days",
          }
          : repeatEvery,
      color: "bg-blue-500", // Placeholder for actual color assignment mechanism
      recorded_at: new Date().toISOString(),
      progress:
        progressType === HabitType.NUMBER
          ? { progress: [0], maxPerDay }
          : { progress: [false] },
    };
    onSave(newHabit);
    onClose(); // Close the dialog after saving
  };
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{mapKeys("Add New Habit")}</DialogTitle>
      <DialogContent>
        <ToggleButtonGroup
          color="primary"
          value={progressType}
          exclusive
          onChange={(_, newAlignment) => {
            if (newAlignment === null) {
              setProgressType(HabitType.BOOLEAN);
              return;
            }
            setProgressType(newAlignment);
          }}
          fullWidth
        >
          <ToggleButton value={HabitType.NUMBER}>
            {mapKeys("Multiple times per day")}
          </ToggleButton>
          <ToggleButton value={HabitType.BOOLEAN}>
            {mapKeys("Yes | No")}
          </ToggleButton>
        </ToggleButtonGroup>
        <div className="flex justify-between">
          <TextField
            margin="dense"
            label={mapKeys("Title")}
            type="text"
            fullWidth
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />{" "}
          <Button onClick={() => setOpenedIconSelector(true)}>
            <FontAwesomeIcon
              icon={MapIconStringToIcon(icon)}
              size="2xl"
              className="ml-2"
            />
          </Button>
        </div>
        <TextField
          margin="dense"
          label={mapKeys("Description")}
          type="text"
          fullWidth
          multiline
          variant="outlined"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {openedIconSelector && (
          <HabitIconSelector
            onClose={() => setOpenedIconSelector(false)}
            onIconSelect={(icon: string) => setIcon(icon)}
          ></HabitIconSelector>
        )}
        {progressType === HabitType.NUMBER && (
          <TextField
            margin="dense"
            label={mapKeys("Max Per Day")}
            type="number"
            helperText={mapKeys(
              "How many times per day do you want do this habit?"
            )}
            fullWidth
            variant="outlined"
            value={maxPerDay}
            onChange={(e) => setMaxPerDay(parseInt(e.target.value))}
          />
        )}
        <ToggleButtonGroup
          sx={{ paddingY: "10px" }}
          value={repeatEveryCertainDays}
          exclusive
        >
          <ToggleButton
            value={false}
            onClick={() => {
              setRepeatEveryCertainDays(false);
              setRepeatEveryDays([]);
            }}
          >
            {mapKeys("Every x days")}
          </ToggleButton>
          <ToggleButton
            value={true}
            onClick={() => {
              setRepeatEveryCertainDays(true);
              setRepeatEveryDays([Days.Monday]);
            }}
          >
            {mapKeys("Specific days")}
          </ToggleButton>
        </ToggleButtonGroup>
        {!repeatEveryCertainDays ? (
          <TextField
            margin="dense"
            label={mapKeys("Repeat Every (Days)")}
            type="number"
            helperText={mapKeys(
              "In what intervals (go to the gym every 2 days)"
            )}
            fullWidth
            variant="outlined"
            value={repeatEvery}
            onChange={(e) => setRepeatEvery(parseInt(e.target.value))}
          />
        ) : (
          <HabitDaySelector
            selectedDays={repeatEveryDays}
            setSelectedDays={setRepeatEveryDays}
          />
        )}
      </DialogContent>
      <div className={`flex  justify-between mt-4`}>
        <Button
          onClick={() => {
            onClose();
          }}
          sx={{
            width: "100%",
            minHeight: "3rem",
          }}
        >
          {mapKeys("Cancel")}
        </Button>
        <div className="border-l" />
        <Button
          onClick={() => {
            handleSave();
          }}
          sx={{
            width: "100%",
            minHeight: "3rem",
          }}
          variant="contained"
        >
          {mapKeys("Confirm")}
        </Button>
      </div>
    </Dialog>
  );
};

export default AddHabit;
