import React, { useContext, useState } from "react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Typography,
  useTheme,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import { ChecklistItem } from "./Checklist";
import ChecklistItems from "./ChecklistItems";
import { DateCalendar, PickersDayProps, PickersDay } from "@mui/x-date-pickers";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import GreenDivider from "../homePage/GreenDivider";
import CloseIcon from '@mui/icons-material/Close';
import { Add } from "iconsax-react";
interface CalendarViewProps {
  calendarTasks: { [date: string]: ChecklistItem[] };
  checkItem: (id: number) => void;
  increaseDueDateBy: (id: number, days: number) => void;
  startEditing: (item: ChecklistItem) => void;
  onClose: () => void;
  onAdd: (item?: ChecklistItem) => void;
  addSubTask: (id: number, subtask: ChecklistItem) => void;
  editSubTask: (id: number, subtask: ChecklistItem) => void;
  deleteSubTask: (id: number) => void;
}

const CalendarDialog: React.FC<CalendarViewProps> = ({
  calendarTasks,
  checkItem,
  increaseDueDateBy,
  startEditing,
  onClose,
  onAdd,
  addSubTask,
  editSubTask,
  deleteSubTask,
}) => {
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  function getColorFromTaskCount(count: number | undefined) {
    if (count === 0 || count === undefined) {
      return "inherit"; // Default background if no tasks
    } else if (count <= 1) {
      return theme.palette.primary.tertiaryText; // Light green for few tasks
    } else
      return theme.palette.primary.main // Moderate green for a moderate number of tasks
  }
  function getTextColorFromTaskCount(count: number | undefined) {
    if (count === 0 || count === undefined) {
      return "inherit"; // Default text color if no tasks
    } else if (count <= 1) {
      return theme.palette.primary.main; // Dark green for few tasks
    } else
      return "white"; // Light green for a moderate number of tasks
  }
  function ChecklistItemDay(props: PickersDayProps<Dayjs>) {
    return (
      <Badge key={props.day.toString()} overlap="circular">
        <PickersDay
          {...props}
          sx={{
            bgcolor: getColorFromTaskCount(
              calendarTasks[props.day.format("YYYY-MM-DD")]?.length
            ),
            color: getTextColorFromTaskCount(
              calendarTasks[props.day.format("YYYY-MM-DD")]?.length
            ),
          }}
        ></PickersDay>
      </Badge>
    );
  }
  const { mapKeys, language } = useContext(MapKeysContext);
  if (language === Language.German) {
    dayjs.locale("de");
  }
  const theme = useTheme();
  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle>
        {mapKeys("Choose a Date")}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.primary.main,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <GreenDivider />
      <DialogContent sx={{ padding: 0 }}>
        <Grid container>
          <Grid item xs={12} md={12}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                views={["year", "month", "day"]}
                minDate={dayjs("2024-01-01")}
                maxDate={dayjs("2030-12-31")}
                value={selectedDate}
                onChange={(newValue) => {
                  setSelectedDate(newValue);
                }}
                slots={{ day: ChecklistItemDay }}
                disableHighlightToday
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={12}>
            {selectedDate && (
              <Paper className="p-1">
                <Typography variant="h6">
                  {selectedDate.format("MMMM D, YYYY")}
                </Typography>
                <GreenDivider />
                <div id="checklist" className="checklist-light">
                  <ChecklistItems
                    checklist={
                      calendarTasks[selectedDate.format("YYYY-MM-DD")] || []
                    }
                    checkItem={checkItem}
                    increaseDueDateBy={increaseDueDateBy}
                    startEditing={startEditing}
                    addSubTask={addSubTask}
                    editSubTask={editSubTask}
                    deleteSubTask={deleteSubTask}
                  />
                </div>
                <Button
                  sx={{ textTransform: "none" }}
                  fullWidth
                  className="flex items-center w-full "
                  onClick={() =>
                    onAdd({
                      title: "",
                      expiration_date: selectedDate.format("YYYY-MM-DD"),
                      checked: false,
                      id: 0,
                      priority: 0,
                      repeat_every: 0,
                    })
                  }
                  variant="contained"
                >
                  <p className="mr-2">{mapKeys("Add an item")}</p>
                  <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />
                </Button>
              </Paper>
            )}
          </Grid>
        </Grid>
      </DialogContent >
    </Dialog >
  );
};

export default CalendarDialog;
