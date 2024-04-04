import { useContext } from "react";
import { DetailedChecklist } from "../../assets/SVGIcons";
import { ChecklistItem } from "./Checklist";
import { RecursiveChecklistItem } from "./RecursiveChecklistItem";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Paper, useTheme } from "@mui/material";
import { useThemeContext } from "../../ThemeContext";

const ChecklistItems = ({
  checklist,
  checkItem,
  increaseDueDateBy,
  startEditing,
  addSubTask,
  editSubTask,
  deleteSubTask,
  showDate,
}: {
  checklist: ChecklistItem[];
  checkItem: (id: number) => void;
  increaseDueDateBy: (id: number, days: number) => void;
  startEditing: (item: ChecklistItem) => void;
  addSubTask: (id: number, subtask: ChecklistItem) => void;
  editSubTask: (id: number, subtask: ChecklistItem) => void;
  deleteSubTask: (id: number) => void;
  showDate?: boolean;
}) => {
  const limitedHeight = "max-h-[50vh]";
  const { mapKeys } = useContext(MapKeysContext);
  const { isDarkMode } = useThemeContext();
  const theme = useTheme();
  return (
    <div style={{ backgroundColor: theme.palette.background.paper }}>
      {checklist.length > 0 ? <ul className={` overflow-y-auto ${limitedHeight}`}>
        {checklist.sort((a, b) => {
          return b.priority - a.priority;
        }).map((item) => {
          return (
            <div key={item.id} className="p-1 m-1" style={{
              borderRadius: 20, backgroundColor: isDarkMode
                ? theme.palette.background.default
                : theme.palette.grey[100],
            }} >
              <RecursiveChecklistItem
                item={item}
                checkItem={checkItem}
                increaseDueDateBy={increaseDueDateBy}
                startEditing={startEditing}
                subTaskDepth={0}
                addSubTask={addSubTask}
                editSubTask={editSubTask}
                deleteSubTask={deleteSubTask}
                showDate={showDate}
                parent={null}
              /></div>
          );
        })}
      </ul> : <Paper className="flex flex-col h-full items-center justify-center space-y-2  py-8">
        <div className="w-20 h-20 flex justify-center items-center" ><DetailedChecklist /></div>
        <p className="text-lg">{mapKeys("No checklist items found")}</p>
      </Paper>}
    </div>
  );
};

export default ChecklistItems;
