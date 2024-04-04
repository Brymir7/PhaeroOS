import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogTitle,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
  Grid,
  useTheme,
} from "@mui/material";
import React, { useContext, useEffect, useRef, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  faCalendarCheck,
  faCalendarDay,
  faCalendarPlus,
  faCalendarWeek,
  faRepeat,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { ChecklistItem } from "./Checklist";
import dayjs from "dayjs";
import RenderDatePicker from "../utils/DatePicker";
import { useNumberValidation, useWindowWidth } from "../utils/CustomHooks";
import GreenDivider from "../homePage/GreenDivider";
import { Trash } from "iconsax-react";
import { useThemeContext } from "../../ThemeContext";
enum maxRepeatSpanTypes {
  "Week" = 7,
  "Two Weeks" = 14,
  "Month" = 28,
}
interface Props {
  onConfirm: () => void;
  onDelete: () => void;
  onCancel: () => void;
  item: ChecklistItem;
  setItem: React.Dispatch<React.SetStateAction<ChecklistItem | null>>;
  adding: boolean;
  repeatItem: (
    item: ChecklistItem,
    interval: number,
    forMaxSpanOfDays: number
  ) => void;
}

function EditAndAddChecklistItem({
  onConfirm,
  onDelete,
  onCancel,
  item,
  setItem,
  adding,
  repeatItem,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const { mapKeys } = useContext(MapKeysContext);
  const originalDate = useRef(dayjs(item.expiration_date));
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [addDueDateDays, setAddDueDateDays] = useState<number | null>(null);
  const [repeat, setRepeat] = useState<boolean>(
    item.repeat_every > 0 ? true : false
  );
  const windowWidth = useWindowWidth();
  const [maxRepeatSpan, setMaxRepeatSpan] = useState<number>(7);
  const [repeatInterval, setRepeatInterval] = useState<number>(
    item.repeat_every
  );
  const handleConfirm = () => {
    if (!item.title) {
      handleAllErrors(mapKeys("Please enter a name"));
      return;
    }
    if (!item.expiration_date) {
      handleAllErrors(mapKeys("Please enter a date"));
      return;
    }
    if (item.repeat_every > 0) {
      repeatItem(item, item.repeat_every, maxRepeatSpan);
    }
    onConfirm();
  };
  const onChangeDueDate = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const days = useNumberValidation(event.target.value);
    if (days === undefined) {
      return;
    }
    if (days !== null) {
      if (typeof days === "number") {
        setAddDueDateDays(days);
        return;
      }
      if (typeof days === "string") {
        if (days === "" || days === "-") {
          setAddDueDateDays(0);
          return;
        }
        setAddDueDateDays(parseInt(days));
      }
    }
  };
  const setToday = () => {
    setItem({
      ...item,
      expiration_date: dayjs(),
    });
  };
  const setTomorrow = () => {
    setItem({
      ...item,
      expiration_date: dayjs().add(1, "day"),
    });
  };
  const onChangeMaxRepeatSpan = (
    _: React.MouseEvent<HTMLElement>,
    newValue: number | null
  ) => {
    if (newValue === null) {
      setMaxRepeatSpan(maxRepeatSpanTypes["Week"]);
      return;
    }
    setMaxRepeatSpan(newValue);
  };

  useEffect(() => {
    if (addDueDateDays === null) {
      return;
    }
    if (addDueDateDays === 0) {
      setItem({
        ...item,
        expiration_date: originalDate.current,
      });
      return;
    }
    if (addDueDateDays) {
      setItem({
        ...item,
        expiration_date: originalDate.current.add(addDueDateDays, "day"),
      });
    }
  }, [addDueDateDays]);

  useEffect(() => {
    if (repeat) {
      setItem({ ...item, repeat_every: repeatInterval });
    } else {
      setItem({ ...item, repeat_every: 0 });
    }
  }, [repeatInterval]);
  const incrementPriority = () => {
    setItem({ ...item, priority: (item.priority + 1) % 4 });
  };
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const priorityStyle = {
    color:
      item.priority === 0
        ? isDarkMode ? "white" : "black"
        : item.priority === 1
          ? theme.palette.success.main
          : item.priority === 2
            ? theme.palette.warning.main
            : theme.palette.error.main,
    fontWeight: "bold" as const,
  };
  const isToday = dayjs(item.expiration_date).isSame(dayjs(), "day");
  const isTomorrow = dayjs(item.expiration_date).isSame(
    dayjs().add(1, "day"),
    "day"
  );

  return (
    <div className="fixed flex w-screen h-screen items-center justify-center">
      {item && (
        <Dialog open={item !== null} onClose={onCancel} fullWidth>
          <DialogTitle sx={{ padding: 1 }}>
            <div className="flex justify-between">
              <div>{adding ? mapKeys("Add Item") : mapKeys("Edit Item")}</div>
              <Button
                onClick={() => incrementPriority()}
                variant="outlined"
                color={
                  item.priority === 0
                    ? "primary"
                    : item.priority === 1
                      ? "success"
                      : item.priority === 2
                        ? "warning"
                        : "error"
                }
                style={{ textTransform: "none" }}
              >
                <Typography sx={priorityStyle}>
                  {mapKeys("Importance: ") +
                    mapKeys(
                      item.priority === 0
                        ? "Normal"
                        : item.priority === 1
                          ? "Low"
                          : item.priority === 2
                            ? "Medium"
                            : "High"
                    )}
                </Typography>
              </Button>
            </div>
          </DialogTitle>
          <GreenDivider />
          <div className="flex mx-3 my-3">
            <TextField
              label={mapKeys("Name")}
              spellCheck={false}
              value={item.title}
              onChange={(event) =>
                setItem({ ...item, title: event.target.value })
              }
              error={item.title === ""}
              helperText={
                item.title === ""
                  ? mapKeys("Checklist item name cannot be empty!")
                  : ""
              }
              variant="standard"
              fullWidth
              multiline
              maxRows={2}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  (event.target as HTMLInputElement).blur();
                }
              }}
            />
          </div>
          {item.repeat_every !== 1 && (
            <div className="">
              {adding && (
                <>
                  <div className="flex mt-3 max-w-[90%] mx-auto">
                    <Button
                      onClick={setToday}
                      variant={isToday ? "outlined" : "text"}
                      sx={{
                        paddingTop: "0.8rem",
                        paddingBottom: "0.8rem",
                        borderRadius: "0",
                        gap: "0.5rem",
                      }}
                      color="primary"
                      fullWidth
                    >
                      <FontAwesomeIcon icon={faCalendarDay} />{" "}
                      {mapKeys("Today")}
                    </Button>
                    <Button
                      onClick={setTomorrow}
                      variant={isTomorrow ? "outlined" : "text"}
                      sx={{
                        paddingTop: "0.8rem",
                        paddingBottom: "0.8rem",
                        gap: "0.5rem",
                        borderRadius: "0",
                      }}
                      color="primary"
                      fullWidth
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} />{" "}
                      {mapKeys("Tomorrow")}
                    </Button>
                  </div>
                </>
              )}
              <div className="mx-3 mt-1">
                <RenderDatePicker
                  value={dayjs(item.expiration_date)}
                  onChange={(newValue) => {
                    setItem({
                      ...item,
                      expiration_date: item ? dayjs(newValue as never) : "",
                    });
                  }}
                  maxDate={dayjs().add(28, "day")}
                  label={mapKeys("Finish by")}
                />
              </div>{" "}
            </div>
          )}
          {!adding && (
            <div className="mx-3 space-y-4">
              {item.repeat_every !== 1 && (
                <TextField
                  label={mapKeys("Increase due date by")}
                  value={addDueDateDays ? addDueDateDays : ""}
                  onChange={(event) => {
                    onChangeDueDate(event);
                  }}
                  variant="standard"
                  type="number"
                  fullWidth
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      (event.target as HTMLInputElement).blur();
                    }
                  }}
                />
              )}
              {item.repeat_every !== 1 ? (
                <div
                  className={`flex justify-between ${windowWidth < 380 ? "flex-col" : ""
                    }`}
                >
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setAddDueDateDays(addDueDateDays ? addDueDateDays + 1 : 1)
                    }
                    className="flex items-center justify-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faCalendarDay} size="xl" />
                    <span>{mapKeys("Postpone 1 Day")}</span>
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={() =>
                      setAddDueDateDays(addDueDateDays ? addDueDateDays + 7 : 7)
                    }
                    className="flex items-center justify-center space-x-2"
                  >
                    <FontAwesomeIcon icon={faCalendarWeek} size="xl" />
                    <span>{mapKeys("Postpone 1 Week")}</span>
                  </Button>
                </div>
              ) : (
                <Typography variant="body1" className="text-center px-8 pt-5">
                  {" "}
                  {mapKeys(
                    "You cannot postpone something you want to do daily!"
                  )}{" "}
                </Typography>
              )}

              <div className="flex justify-center align-middle pt-5 gap-4">
                <Button variant="outlined" className="flex justify-center align-middle items-center gap-2" sx={{ textTransform: "none" }}>
                  <Checkbox
                    sx={{ paddingLeft: 0, paddingTop: 0, paddingRight: 0, paddingBottom: 0 }}
                    onClick={() => {
                      setRepeat(!repeat);
                    }}
                    defaultChecked={repeat}
                    icon={<FontAwesomeIcon icon={faRepeat} size="2xl" />}
                    checkedIcon={<FontAwesomeIcon icon={faRepeat} size="2xl" />}
                  />
                  <Typography>{mapKeys("Repeat")}</Typography>
                </Button>
                {repeat && (
                  <Grid direction={"column"}>
                    <Grid item xs={3} className="flex align-middle gap-5">
                      <TextField
                        size="small"
                        label={mapKeys("Repeat every")}
                        value={repeatInterval ? repeatInterval : ""}
                        onChange={(event) => {
                          const interval = useNumberValidation(
                            event.target.value
                          );
                          if (interval === undefined) {
                            return;
                          }
                          if (interval !== null) {
                            if (typeof interval === "number") {
                              setRepeatInterval(interval);
                              return;
                            }
                            if (typeof interval === "string") {
                              if (interval === "" || interval === "-") {
                                setRepeatInterval(0);
                                return;
                              }
                              setRepeatInterval(parseInt(interval));
                            }
                          }
                        }}
                        variant="standard"
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            (event.target as HTMLInputElement).blur();
                          }
                        }}
                        type="number"
                        sx={{ width: "50%" }}
                      />

                      <ToggleButtonGroup
                        value={repeatInterval}
                        exclusive
                        onChange={(_, newValue) => {
                          if (newValue === null) {
                            setRepeatInterval(0);
                            return;
                          }
                          setRepeatInterval(newValue);
                        }}
                        aria-label="text alignment"
                      >
                        <ToggleButton value={1} aria-label="Daily">
                          <Typography>{mapKeys("Daily")}</Typography>
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                    <Grid item xs={3} className="flex align-middle pt-2 gap-5">
                      <TextField
                        label={mapKeys("How many days at most?")}
                        value={maxRepeatSpan}
                        variant="standard"
                        type="number"
                        disabled
                        sx={{ width: "50%" }}
                      />
                      <ToggleButtonGroup
                        value={maxRepeatSpan}
                        exclusive
                        onChange={onChangeMaxRepeatSpan}
                        aria-label="text alignment"
                      >
                        <ToggleButton
                          value={maxRepeatSpanTypes["Week"]}
                          aria-label="Week"
                        >
                          <FontAwesomeIcon icon={faCalendarDay} size="lg" />
                        </ToggleButton>
                        <ToggleButton
                          value={maxRepeatSpanTypes["Two Weeks"]}
                          aria-label="Two Weeks"
                        >
                          <FontAwesomeIcon icon={faCalendarWeek} size="lg" />
                        </ToggleButton>
                        <ToggleButton
                          value={maxRepeatSpanTypes["Month"]}
                          aria-label="Month"
                        >
                          <FontAwesomeIcon icon={faCalendarCheck} size="lg" />
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Grid>
                  </Grid>
                )}
              </div>
            </div>
          )}
          <div className="h-6" />
          {!adding && (
            <div className="mt-auto w-full ">
              <Button
                style={{
                  marginRight: "auto",
                  maxWidth: "50%",
                  minWidth: "50%",
                  textTransform: "none",
                }}
                color="error"
                onClick={() => setConfirmDelete(true)}
              >
                {mapKeys("Delete Item")}
                <Trash
                  className="ml-2"
                  size={theme.iconSize.large}
                  color={theme.palette.primary.error}
                />
              </Button>
            </div>
          )}
          <div
            className={`flex  justify-between mt-4 ${adding && ""} `}
          >
            <Button
              onClick={() => {
                setItem({ ...item, expiration_date: originalDate.current });
                onCancel();
              }}
              sx={{
                width: "100%",
                minHeight: "3rem",
              }}
            >
              {mapKeys("Cancel")}
            </Button>
            <Button
              onClick={() => {
                handleConfirm();
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
      )}
      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {mapKeys("Delete this checklist item?")}
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(false)}>
            {mapKeys("Cancel")}
          </Button>
          <Button onClick={onDelete}>{mapKeys("Confirm")}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default EditAndAddChecklistItem;
