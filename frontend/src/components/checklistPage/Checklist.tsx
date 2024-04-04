import React, { useContext, useEffect, useRef, useState } from "react";
import { useApi } from "../../modules/apiAxios";
import { DetailedChecklist } from "../../assets/SVGIcons";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import "./Checklist.css";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { AuthContext } from "../contexts/AuthContext";
import Button from "@mui/material/Button";
import EditAndAddChecklistItem from "./EditAndAddItemChecklist";
import { Paper, Typography, useTheme } from "@mui/material";
import TutorialStep from "../utils/TutorialStep";
import dayjs from "dayjs";
import CalendarView from "./CalendarView";
import AccordionChecklistCategory from "./AccordionChecklistCategory";
import PaperButton from "../homePage/PaperButton";
import { Add, Calendar, ClipboardTick } from "iconsax-react";

import { maxWidthBasedOnWindowWidth } from "../habitPage/HabitTracker";
export interface ChecklistItem {
  title: string;
  checked: boolean;
  priority: number;
  id: number;
  expiration_date: string | dayjs.Dayjs;
  repeat_every: number;
  subtasks?: ChecklistItem[];
}
const defaultChecklistItem: ChecklistItem = {
  title: "",
  checked: false,
  priority: 0,
  id: 0,
  expiration_date: dayjs(),
  repeat_every: 0,
};
interface ChecklistCategory {
  [key: string]: ChecklistItem[];
}
interface CalendarTasks {
  [date: string]: ChecklistItem[];
}
interface ChecklistProps {
  messageView?: boolean;
}
const Checklist = ({ messageView }: ChecklistProps) => {
  const theme = useTheme();
  const [loading, setLoading] = React.useState<boolean>(true);
  const [expandedCategory, setExpandedCategory] = React.useState<string | null>(
    "Today"
  );
  const [calendarTasks, setCalendarTasks] = useState<CalendarTasks>({});
  const [categories, setCategories] = useState<ChecklistCategory>({
    Today: [],
    Expired: [],
    Completed: [],
  });
  const [calendarView, setCalendarView] = useState<boolean>(false);
  const [checklist, setChecklist] = React.useState<ChecklistItem[]>([]);
  const [adding, setAdding] = React.useState<boolean>(false);
  const [editingItem, setEditingItem] = React.useState<ChecklistItem | null>(
    null
  );
  const checklistModified = useRef(false);
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  useEffect(() => {
    if (hasAccess) {
      loadChecklist();
    }
  }, [hasAccess]);

  const loadChecklist = () => {
    api
      .get(`/checklist/`)
      .then((response) => {
        setChecklist(response.data.items);
        console.log(response.data.items);
        setLoading(false);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const categorizeItems = (items: ChecklistItem[]) => {
    const now = dayjs();
    const newCategories: ChecklistCategory = {
      Today: [],
      Expired: [],
      Completed: [],
    };

    const newCalendarTasks: {
      [date: string]: ChecklistItem[];
    } = {};

    items.forEach((item) => {
      const itemDate = dayjs(item.expiration_date);
      const formattedDate = itemDate.format("YYYY-MM-DD");

      if (!newCalendarTasks[formattedDate]) {
        newCalendarTasks[formattedDate] = [];
      }
      newCalendarTasks[formattedDate].push(item);

      if (item.checked && itemDate.isBefore(now, "day")) {
        newCategories.Completed.push(item);
      } else if (itemDate.isBefore(now, "day")) {
        newCategories.Expired.push(item);
      } else if (itemDate.isSame(now, "day")) {
        newCategories.Today.push(item);
      }
    });
    if (newCategories.Today.length > 0) {
      setExpandedCategory("Today");
    } else if (
      newCategories.Today.length === 0 &&
      newCategories.Expired.length > 0
    ) {
      setExpandedCategory("Expired");
    } else if (
      newCategories.Today.length === 0 &&
      newCategories.Expired.length === 0 &&
      newCategories.Completed.length > 0
    ) {
      setExpandedCategory("Completed");
    } else {
      setExpandedCategory(null);
    }
    setCategories(newCategories);
    setCalendarTasks(newCalendarTasks);
  };
  const addSubTask = (id: number, subtask: ChecklistItem) => {
    api
      .post("/checklist/add-subtask/", { ...subtask, parent_id: id })
      .then(() => {
        loadChecklist();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const repeatItem = (
    item: ChecklistItem,
    interval: number,
    forMaxSpanOfDays: number
  ) => {
    const newItems: ChecklistItem[] = [];
    const originalItem = checklist.find((i) => i.title === item.title);
    if (!originalItem) return;
    newItems.push(originalItem);

    const endDate = dayjs(originalItem.expiration_date).add(
      forMaxSpanOfDays,
      "day"
    );
    let nextExpirationDate = dayjs(originalItem.expiration_date).add(
      interval,
      "day"
    );
    while (nextExpirationDate.isBefore(endDate)) {
      const newItem: ChecklistItem = {
        ...item,
        id:
          Math.max(
            0,
            ...checklist.map((i) => i.id),
            ...newItems.map((i) => i.id)
          ) + 1, // Ensuring unique ID
        expiration_date: nextExpirationDate,
        repeat_every: interval,
        checked: false,
      };
      newItems.push(newItem);
      nextExpirationDate = nextExpirationDate.add(interval, "day");
    }
    setChecklist((currentChecklist) => [
      ...currentChecklist.filter((oldItem) => {
        oldItem.id !== item.id && oldItem.title !== item.title;
      }),
      ...newItems,
    ]);
  };

  useEffect(() => {
    if (checklist.length > 0) {
      categorizeItems(checklist);
    }
  }, [checklist]);
  const recursivelyCheckItem = (
    id: number,
    alwaysCheck: boolean,
    items: ChecklistItem[]
  ): ChecklistItem[] => {
    return items.map((item) => {
      if (item.id === id || alwaysCheck) {
        if (item.subtasks) {
          item.checked = alwaysCheck ? true : !item.checked;
          return {
            ...item,
            subtasks: recursivelyCheckItem(
              id,
              item.checked ? true : false,
              item.subtasks
            ),
          };
        }
        return { ...item, checked: alwaysCheck ? true : !item.checked };
      }
      if (item.subtasks) {
        return {
          ...item,
          subtasks: recursivelyCheckItem(id, false, item.subtasks),
        };
      }
      return item;
    });
  };
  const api = useApi();
  const checkItem = (id: number) => {
    setChecklist((prev) => {
      return recursivelyCheckItem(id, false, prev);
    });
    checklistModified.current = true;
    // const checklistItem = checklist.find((item) => item.id === id);
    // if (!checklistItem) return;
    // let newNote = note;
    // if (!checklistItem.checked) {
    //   const finishedSection = `## ${mapKeys("Finished:")}\n`;
    //   let indexOfFinished = newNote.indexOf(finishedSection);
    //   if (indexOfFinished === -1) {
    //     newNote += newNote.length === 0 ? "" : "\n\n";
    //     newNote += finishedSection;
    //     indexOfFinished = newNote.indexOf(finishedSection);
    //   }
    //   const insertionPoint = indexOfFinished + finishedSection.length;
    //   const amountWhiteSpaceTitle = checklistItem.title.split(" ").length - 1;
    //   const checklistString =
    //     amountWhiteSpaceTitle > 0
    //       ? `#c '${checklistItem.title}'`
    //       : `#c ${checklistItem.title}`;
    //   newNote =
    //     newNote.slice(0, insertionPoint) +
    //     checklistString +
    //     "\n" +
    //     newNote.slice(insertionPoint);
    // } else {
    //   const amountWhiteSpaceTitle = checklistItem.title.split(" ").length - 1;
    //   const regex =
    //     amountWhiteSpaceTitle === 0
    //       ? new RegExp(`^.*#c ${checklistItem.title}.*(?:\n|$)`, "gm")
    //       : new RegExp(`^.*#c '${checklistItem.title}'.*(?:\n|$)`, "gm");
    //   newNote = newNote.replace(regex, "");
    // }
    // setNote(newNote);
  };

  const updateChecklist = () => {
    const backendChecklist = checklist.map((item) => {
      return {
        ...item,
        expiration_date: dayjs(item.expiration_date).format("YYYY-MM-DD"),
      };
    });
    console.log("UPDATING", backendChecklist);
    api
      .post("/checklist/update/", { checklist_items: backendChecklist })
      .then(() => { })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  useEffect(() => {
    console.log("CHECKLIST", checklist);
  }, [checklist]);

  useEffect(() => {
    if (checklistModified.current) {
      updateChecklist();
      checklistModified.current = false;
    }
  }, [checklist]);

  const addItemChecklist = () => {
    if (!editingItem) return;
    if (recursivelyCheckForItem(editingItem.title, checklist)) {
      handleAllErrors(mapKeys("Item name already exists"));
      return;
    }
    editingItem.expiration_date = dayjs(editingItem.expiration_date).format(
      "YYYY-MM-DD"
    );
    api
      .post("/checklist/add/", { ...editingItem })
      .then(() => {
        loadChecklist();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const startEditing = (item: ChecklistItem) => {
    if (!item) return;
    setAdding(false);
    setEditingItem(item);
  };

  const startAdding = (defaultChecklistItemOverwrite?: ChecklistItem) => {
    setAdding(true);
    if (defaultChecklistItemOverwrite !== undefined) {
      setEditingItem(defaultChecklistItemOverwrite);
      return;
    }
    setEditingItem(defaultChecklistItem);
  };

  const onDelete = () => {
    if (adding || !editingItem) return;
    setChecklist((prev) => {
      return prev.filter((item) => item.title !== editingItem.title);
    });
    checklistModified.current = true;
    setAdding(false);
    setEditingItem(null);
  };
  const recursivelyEditChecklistItem = (
    id: number,
    newItem: ChecklistItem,
    items: ChecklistItem[]
  ): ChecklistItem[] => {
    return items.map((item) => {
      if (item.id === id) {
        return newItem;
      }
      if (item.subtasks) {
        return {
          ...item,
          subtasks: recursivelyEditChecklistItem(id, newItem, item.subtasks),
        };
      }
      return item;
    });
  };
  const recursivelyCheckForItem = (
    title: string,
    items: ChecklistItem[]
  ): boolean => {
    return items.some((item) => {
      if (item.title === title) {
        return true;
      }
      if (item.subtasks) {
        return recursivelyCheckForItem(title, item.subtasks);
      }
      return false;
    });
  };
  const recursivelyDeleteItem = (
    id: number,
    items: ChecklistItem[]
  ): ChecklistItem[] => {
    if (!items) return [];
    return items.filter((item) => {
      if (item.id === id) {
        return false;
      }
      if (item.subtasks) {
        item.subtasks = recursivelyDeleteItem(id, item.subtasks);
        return true;
      }
      return true;
    });
  };
  const confirmEdit = () => {
    if (!editingItem) return;
    if (adding) {
      addItemChecklist();
    } else {
      setChecklist((prev) => {
        return recursivelyEditChecklistItem(editingItem.id, editingItem, prev);
      });
      checklistModified.current = true;
    }
    setAdding(false);
    setEditingItem(null);
  };

  const increaseDueDateBy = (id: number, days: number) => {
    checklistModified.current = true;
    setChecklist((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          return {
            ...item,
            expiration_date: dayjs(item.expiration_date).add(days, "day"),
          };
        }
        return item;
      });
    });
  };
  // const { note, setNote } = useContext(JournalNoteContext);

  const getTitleAttachment = (category: string) => {
    if (category === "Today") {
      return (
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-2 h-2 text-sm  "
          style={{ background: theme.palette.primary.main }}
        ></div>
      );
    }
    if (category === "Expired") {
      return (
        <div
          className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-2 h-2 text-sm  "
          style={{ background: theme.palette.primary.error }}
        ></div>
      );
    }
    if (category === "Completed") {
      return (
        <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2 ml-2">
          {categories[category].length}
        </div>
      );
    }
    return null;
  };
  if (messageView) {
    const hasMinimized = localStorage.getItem("minimizedChecklist") === "true";
    const [isOpen, setIsOpen] = useState(!hasMinimized);
    const minimize = () => {
      setIsOpen(false);
      localStorage.setItem("minimizedChecklist", "true");
    };
    const maximize = () => {
      setIsOpen(true);
      localStorage.setItem("minimizedChecklist", "false");
    };
    const toggle = () => {
      if (isOpen) {
        minimize();
      } else {
        maximize();
      }
    };
    return (
      <div>
        {editingItem && (
          <EditAndAddChecklistItem
            onConfirm={confirmEdit}
            onCancel={() => setEditingItem(null)}
            item={editingItem}
            setItem={setEditingItem}
            adding={adding}
            onDelete={onDelete}
            repeatItem={repeatItem}
          />
        )}
        <AccordionChecklistCategory
          title={mapKeys("Today")}
          titleAttachment={getTitleAttachment("Today")}
          items={categories["Today"]}
          checkItem={checkItem}
          increaseDueDateBy={increaseDueDateBy}
          startEditing={startEditing}
          expanded={isOpen}
          onClick={toggle}
          addSubTask={addSubTask}
          editSubTask={(id, subtask) => {
            checklistModified.current = true;
            setChecklist(recursivelyEditChecklistItem(id, subtask, checklist));
          }}
          deleteSubTask={(id) => {
            checklistModified.current = true;
            setChecklist(recursivelyDeleteItem(id, checklist));
          }}
        />
        <PaperButton
          icon={
            <Add
              size={theme.iconSize.medium}
              color={theme.palette.primary.main}
            />
          }
          onClick={() => startAdding()}
          text="Add Item"
        />
      </div>
    );
  }
  return (
    <TutorialStep extraClasses="w-full h-[100%]" step={2}>
      {calendarView && (
        <CalendarView
          calendarTasks={calendarTasks}
          checkItem={checkItem}
          increaseDueDateBy={increaseDueDateBy}
          startEditing={startEditing}
          onClose={() => setCalendarView(false)}
          onAdd={startAdding}
          addSubTask={addSubTask}
          editSubTask={(id, subtask) => {
            checklistModified.current = true;
            setChecklist(recursivelyEditChecklistItem(id, subtask, checklist));
          }}
          deleteSubTask={(id) => {
            checklistModified.current = true;
            setChecklist(recursivelyDeleteItem(id, checklist));
          }}
        />
      )}
      <Paper
        elevation={2}
        className={`flex flex-col pt-2  h-full ${maxWidthBasedOnWindowWidth} ${window.innerWidth > 520 ? "px-4" : "px-2"
          }`}
      >
        <div className={`flex justify-between mb-2 ${window.innerWidth < 530 && "flex-col gap-2 pb-2"}`}>
          <Typography
            variant="h6"
            className="flex align-middle items-center gap-2"
          >
            <ClipboardTick
              color={theme.palette.primary.main}
              size={theme.iconSize.large}
              className=""
            />
            {mapKeys("Your Checklist")}
          </Typography>
          <div className="flex gap-1">
            <Button
              onClick={() => setCalendarView(true)}
              color="primary"
              sx={{ textTransform: "none", borderRadius: 999 }}
              className="flex items-center h-12 gap-2 "
              variant="outlined"
            >
              <Calendar
                size={theme.iconSize.large}
                color={theme.palette.primary.main}
              />
              <Typography className="ml-4">
                {mapKeys("View Calendar")}
              </Typography>
            </Button>{" "}
            <Button
              sx={{ textTransform: "none", borderRadius: 999 }}
              className="flex items-center h-12 gap-2"
              onClick={() => startAdding()}
              variant="contained"
            >
              <Add size={theme.iconSize.large} color={"white"} />
              <Typography>{mapKeys("Add Item")}</Typography>
            </Button>
          </div>
        </div>

        {!loading &&
          (checklist.length && expandedCategory !== null ? (
            <div className="">
              {expandedCategory === "Today" ||
                expandedCategory === "Expired" ||
                expandedCategory === "Completed" ? (
                <AccordionChecklistCategory
                  title={mapKeys(expandedCategory.toString())}
                  titleAttachment={getTitleAttachment(expandedCategory)}
                  items={categories[expandedCategory]}
                  checkItem={checkItem}
                  increaseDueDateBy={increaseDueDateBy}
                  startEditing={startEditing}
                  expanded={true}
                  onClick={() => setExpandedCategory("")}
                  addSubTask={addSubTask}
                  editSubTask={(id, subtask) => {
                    checklistModified.current = true;
                    setChecklist(
                      recursivelyEditChecklistItem(id, subtask, checklist)
                    );
                  }}
                  deleteSubTask={(id) => {
                    checklistModified.current = true;
                    setChecklist(recursivelyDeleteItem(id, checklist));
                  }}
                />
              ) : (
                Object.keys(categories)
                  .filter((category) => categories[category].length > 0)
                  .map((category) => (
                    <AccordionChecklistCategory
                      key={category}
                      title={mapKeys(category)}
                      titleAttachment={getTitleAttachment(category)}
                      items={categories[category]}
                      checkItem={checkItem}
                      increaseDueDateBy={increaseDueDateBy}
                      expanded={false}
                      startEditing={startEditing}
                      onClick={() => setExpandedCategory(category)}
                      addSubTask={addSubTask}
                      editSubTask={(id, subtask) => {
                        checklistModified.current = true;
                        setChecklist(
                          recursivelyEditChecklistItem(id, subtask, checklist)
                        );
                      }}
                      deleteSubTask={(id) => {
                        checklistModified.current = true;
                        setChecklist(recursivelyDeleteItem(id, checklist));
                      }}
                    />
                  ))
              )}

            </div>
          ) : (
            <div className="flex flex-col h-full items-center justify-center space-y-2 ">
              <div className="w-20 h-20">
                <DetailedChecklist />
              </div>
              <p className="text-lg">{mapKeys("No checklist items found")}</p>
              <div className="flex justify-between">
                <Button
                  sx={{ textTransform: "none" }}
                  className="flex items-center h-10"
                  onClick={() => startAdding()}
                >
                  <p className="mr-4">{mapKeys("Add an item")}</p>
                  <Add
                    size={theme.iconSize.medium}
                    color={theme.palette.primary.main}
                  />
                </Button>
                <Button
                  onClick={() => setCalendarView(true)}
                  color="primary"
                  sx={{ display: "flex", gap: "4px" }}
                >
                  <Calendar
                    size={theme.iconSize.medium}
                    color={theme.palette.primary.main}
                  />
                  {mapKeys("View Calendar")}
                </Button>
              </div>
            </div>
          ))}
      </Paper>

      {editingItem && (
        <EditAndAddChecklistItem
          onConfirm={confirmEdit}
          onCancel={() => setEditingItem(null)}
          item={editingItem}
          setItem={setEditingItem}
          adding={adding}
          onDelete={onDelete}
          repeatItem={repeatItem}
        />
      )}
    </TutorialStep>
  );
};

export default Checklist;
