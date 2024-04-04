import { GoalType } from "./types";

interface EditGoalFlagsProps {
  modifyGoal: (goal: GoalType) => void;
  goal: GoalType;
  flagGroupLength: number;
}
import React, { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {  faTrash, faSave } from "@fortawesome/free-solid-svg-icons";
import { MapKeysContext } from "../contexts/MapKeysContext";

const EditGoalFlags: React.FC<EditGoalFlagsProps> = ({
  modifyGoal,
  goal,
  flagGroupLength,
}) => {
  const [open, setOpen] = React.useState(false);
  const [stagedFlags, setStagedFlags] = React.useState<string[]>(goal.flags);

  const handleOpen = () => {
    setStagedFlags(goal.flags);
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  const handleStageDelete = (flagToDelete: string) => {
    setStagedFlags(stagedFlags.filter((flag) => flag !== flagToDelete));
  };

  const handleSaveChanges = () => {
    // Function to bubble up items in the array, maintaining type integrity.
    const bubbleUpItemsByFlagGroupLength = function <T>(
      arr: T[],
      indexesToRemove: number[]
    ): T[] {
      let emptyItem: T;

      // Determine the empty item based on the type of the array
      if (arr.length && typeof arr[0] === "boolean") {
        emptyItem = false as unknown as T;
      } else if (arr.length && typeof arr[0] === "number") {
        emptyItem = 0 as unknown as T;
      } else {
        emptyItem = "" as unknown as T;
      }
      // Group the array into chunks of three
      const groups: T[][] = [];
      for (let i = 0; i < arr.length; i += flagGroupLength) {
        groups.push(arr.slice(i, i + flagGroupLength));
      }

      // Process each group to bubble up items by removing specified indexes
      const processedGroups = groups.map((group, groupIndex) => {
        const newGroup = group.filter(
          (_, index) =>
            !indexesToRemove.includes(index + groupIndex * flagGroupLength)
        );
        while (newGroup.length < flagGroupLength) {
          newGroup.push(emptyItem);
        }
        return newGroup;
      });

      // Flatten the groups back into a single array
      const newArr = processedGroups.flat();

      return newArr;
    };

    if (stagedFlags.length < goal.flags.length) {
      const flagIndexesToRemove = goal.flags
        .map((flag, index) => (!stagedFlags.includes(flag) ? index : -1))
        .filter((index) => index !== -1);

      // Apply bubbling logic for flags, progress, and numberGoals
      goal.flags = bubbleUpItemsByFlagGroupLength(
        goal.flags,
        flagIndexesToRemove
      );
      goal.progress = bubbleUpItemsByFlagGroupLength(
        goal.progress,
        flagIndexesToRemove
      );
      if (goal.autoCompletion) {
        goal.autoCompletion.numberGoals = bubbleUpItemsByFlagGroupLength(
          goal.autoCompletion.numberGoals,
          flagIndexesToRemove
        );
      }
    }
    // improve multiple deletion at end (delete consecutive empty at end)
    while (goal.flags.length > 0 && goal.flags[goal.flags.length - 1] === "") {
      goal.flags.pop();
      goal.progress.pop();
      if (goal.autoCompletion) {
        goal.autoCompletion.numberGoals.pop();
      }
    }
    modifyGoal(goal);
    handleClose();
  };
  const { mapKeys} = useContext(MapKeysContext);
  const newFlag = mapKeys("Tap to edit");

  const handleAddFlag = () => {
    if (newFlag) {
      goal.progress = goal.progress.concat(false);
      if (goal.autoCompletion) {
        goal.autoCompletion.numberGoals =
          goal.autoCompletion.numberGoals.concat(
            goal.autoCompletion.numberGoals.slice(-1)
          );
      }
      goal.flags = goal.flags.concat(newFlag);
    }
    modifyGoal(goal);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={handleOpen} sx={{ marginRight: 1 }}>
          {mapKeys("Edit Flags")}
        </Button>
        <Button onClick={handleAddFlag}>{mapKeys("Add Flag")}</Button>
      </div>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{mapKeys("Edit Flags")}</DialogTitle>
        <DialogContent>
          <List>
            {stagedFlags.map((flag, index) => {
              if (flag !== "") {
                return (
                  <ListItem key={index}>
                    <ListItemText primary={flag} />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => handleStageDelete(flag)}
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-red-500" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                );
              }
              return null; // Return null for empty flags
            })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            {mapKeys("Cancel")}
          </Button>
          <Button
            onClick={handleSaveChanges}
            color="primary"
            variant="contained"
            startIcon={<FontAwesomeIcon icon={faSave} />}
          >
            {mapKeys("Save Changes")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditGoalFlags;
