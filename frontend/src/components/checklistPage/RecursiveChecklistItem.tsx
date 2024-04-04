import React, { useContext, useState } from "react";
import { ChecklistItem as ChecklistItemType } from "./Checklist";
import {
  Typography,
  Button,
  useTheme,
  TextField,
  Divider,
  Checkbox,
} from "@mui/material";
import dayjs from "dayjs";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Add, Edit2, Trash } from "iconsax-react";

interface RecursiveChecklistItemProps {
  item: ChecklistItemType;
  checkItem: (id: number) => void;
  increaseDueDateBy: (id: number, days: number) => void;
  startEditing: (item: ChecklistItemType) => void;
  addSubTask: (id: number, subtask: ChecklistItemType) => void;
  editSubTask: (id: number, subtask: ChecklistItemType) => void;
  subTaskDepth: number;
  parent: ChecklistItemType | null;
  deleteSubTask: (id: number) => void;
  showDate?: boolean;
}

export const RecursiveChecklistItem: React.FC<RecursiveChecklistItemProps> = ({
  item,
  checkItem,
  increaseDueDateBy,
  startEditing,
  subTaskDepth,
  addSubTask,
  editSubTask,
  parent,
  deleteSubTask,
  showDate = false,
}) => {
  const theme = useTheme();

  const priorityStyle = {
    color:
      item.priority === 0
        ? theme.palette.text.primary
        : item.priority === 1
          ? theme.palette.primary.dark
          : item.priority === 2
            ? theme.palette.warning.main
            : theme.palette.error.main,
    fontWeight: "bold" as const,
  };
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(item.title);
  const { mapKeys } = useContext(MapKeysContext);
  const createSubTask = () => {
    let new_title = "subtask";
    if (parent && parent.subtasks) {
      new_title = `${mapKeys("subtask")} ${parent.subtasks.length > 0 ? parent.subtasks.length + 1 : ""
        }`;
    }
    if (!parent && item.subtasks) {
      new_title = `${mapKeys("subtask")} ${item.subtasks.length + 1}`;
    }
    const newSubTask: ChecklistItemType = {
      title: new_title,
      checked: false,
      priority: 0,
      expiration_date: dayjs(),
      subtasks: [],
      id: Math.floor(Math.random() * 1000000),
      repeat_every: 0,
    };
    addSubTask(item.id, newSubTask);
  };
  return (
    <>
      {subTaskDepth > 2 ? (
        <>
          <Divider />
          <div className="flex ml-4">
            {!isEditingName ? (
              <Typography
                variant="body1"
                style={{
                  color: "grey",
                  marginLeft: 10,
                  marginTop: 7,
                  minWidth: "50%",
                }}
                onClick={() => checkItem(item.id)}
              >
                {item.checked ? "✅" : "❌"} {item.title}
              </Typography>
            ) : (
              <TextField
                value={editName}
                onChange={(e) => {
                  setEditName(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingName(false);
                    editSubTask(item.id, { ...item, title: editName });
                  }
                  if (e.key === "Escape") {
                    setIsEditingName(false);
                    setEditName(item.title);
                  }
                }}
                sx={{ minWidth: "60%" }}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {!item.checked && (
              <div className="flex">
                <Button
                  onClick={() => {
                    if (isEditingName) {
                      editSubTask(item.id, { ...item, title: editName });
                      setIsEditingName(false);
                    } else {
                      setIsEditingName(true);
                    }
                  }}
                >
                  <Edit2
                    size={theme.iconSize.medium}
                    color={theme.palette.primary.main}
                  />
                </Button>
                <Button onClick={() => deleteSubTask(item.id)} color="error">
                  <Trash
                    size={theme.iconSize.medium}
                    color={theme.palette.primary.error}
                  />
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div
          className="p-[0.1em]"
          style={{
            borderRadius: 0,
            marginLeft: 1,
            paddingLeft: 10,
            borderLeft: item.checked || subTaskDepth < 1 ? "" : "2px solid",
            borderColor: theme.palette.primary.main,
          }}
        >
          <li key={item.id}>
            <div
              elevation={0}
              onClick={() => checkItem(item.id)}
              className={`flex w-full items-center ${subTaskDepth > 0 || !showDate ? "" : "py-3"
                } pl-2 checklist-item-div  cursor-pointer relative `}
              style={{
                // @ts-ignore
                "--check": theme.palette.primary.main,
                "--border": theme.palette.primary.main,
                "borderRadius": "0px",
              }}
            >
              <Checkbox
                id={item.id.toString()}
                readOnly={true}
                checked={item.checked}
                onChange={() => { }} // This is to suppress a React warning about readOnly checkboxes without onChange handlers.
                className={``}
              />
              {!item.checked && subTaskDepth === 0 && showDate && (
                <span
                  className="absolute bottom-0 right-0"
                  style={{ color: "grey" }}
                >
                  {dayjs(item.expiration_date).format("MMM D").toString()}
                </span>
              )}
              {!isEditingName ? (
                <Typography
                  variant="body2"
                  style={{
                    textDecoration: item.checked ? "line-through" : "none",
                    ...priorityStyle,
                  }}
                >
                  {editName}
                </Typography>
              ) : (
                <TextField
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setIsEditingName(false);
                      editSubTask(item.id, { ...item, title: editName });
                    }
                    if (e.key === "Escape") {
                      setIsEditingName(false);
                      setEditName(item.title);
                    }
                  }}
                  sx={{ maxWidth: "50%" }}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={() => {
                    editSubTask(item.id, { ...item, title: editName });
                    setIsEditingName(false);
                  }}
                />
              )}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex flex-shrink-0 items-center justify-center ml-auto"
              >
                <div
                  className={`rounded-full h-12 flex flex-row py-2 px-2 gap-[2px]`}
                >
                  {!item.checked && !isEditingName && subTaskDepth < 2 && (
                    <Button onClick={createSubTask} variant="outlined">
                      <Add
                        size={theme.iconSize.medium}
                        color={theme.palette.primary.main}
                      />
                    </Button>
                  )}
                  {!item.checked &&
                    (subTaskDepth === 0 ? (
                      <Button
                        onClick={() => startEditing(item)}
                        variant="outlined"
                      >
                        <Edit2
                          size={theme.iconSize.medium}
                          color={theme.palette.primary.main}
                        />
                      </Button>
                    ) : (
                      <div className="flex">
                        {isEditingName && (
                          <Button
                            onClick={() => deleteSubTask(item.id)}
                            variant="outlined"
                            color="error"
                          >
                            <Trash
                              className=""
                              size={theme.iconSize.medium}
                              color={theme.palette.primary.error}
                            />
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            if (isEditingName) {
                              editSubTask(item.id, {
                                ...item,
                                title: editName,
                              });
                              setIsEditingName(false);
                            } else {
                              setIsEditingName(true);
                            }
                          }}
                          variant="outlined"
                        >
                          <Edit2
                            size={theme.iconSize.medium}
                            color={theme.palette.primary.main}
                          />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </li>
          {item.subtasks && item.subtasks.length > 0 &&
            <Divider />}
          {item.subtasks &&

            item.subtasks.map((subtask) => (
              <RecursiveChecklistItem
                key={subtask.id}
                item={subtask}
                checkItem={checkItem}
                increaseDueDateBy={increaseDueDateBy}
                startEditing={startEditing}
                subTaskDepth={subTaskDepth + 1}
                addSubTask={addSubTask}
                editSubTask={editSubTask}
                deleteSubTask={deleteSubTask}
                parent={item}
              />
            ))}
        </div>
      )}
    </>
  );
};
