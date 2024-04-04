// Checklist.tsx
import React, { useContext } from "react";
import { ChecklistItem } from "./Checklist";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Dialog, DialogActions, IconButton, Typography } from "@mui/material";
import ChecklistItems from "./ChecklistItems";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { MapKeysContext } from "../contexts/MapKeysContext";
import GreenDivider from "../homePage/GreenDivider";
interface Props {
  title: string;
  titleAttachment: React.ReactNode;
  items: ChecklistItem[];
  checkItem: (id: number) => void;
  increaseDueDateBy: (id: number, days: number) => void;
  startEditing: (item: ChecklistItem) => void;
  expanded: boolean;
  onClick: () => void;
  addSubTask: (id: number, subtask: ChecklistItem) => void;
  editSubTask: (id: number, subtask: ChecklistItem) => void;
  deleteSubTask: (id: number) => void;
}

const AccordionChecklistCategory: React.FC<Props> = ({
  title,
  titleAttachment,
  items,
  checkItem,
  increaseDueDateBy,
  startEditing,
  onClick,
  expanded,
  addSubTask,
  editSubTask,
  deleteSubTask,
}) => {
  const [isFullScreenView, setIsFullScreenView] = React.useState(false);
  const { mapKeys } = useContext(MapKeysContext)
  return (
    <>
      <Accordion
        expanded={expanded}
        onChange={() => onClick()}
        sx={{
          padding: "0px",
          margin: "0px",
          marginBottom: 1,
          minHeight: `${expanded ? "300px" : ""}`,
          boxShadow: 3, // Mimics the elevation 3 of Paper component
          borderRadius: 1, // Paper component typically has rounded corners
        }}

      >
        <AccordionSummary
          aria-controls="panel1a-content"
          id="panel1a-header"
          expandIcon={
            <div className="flex" style={{ display: 'flex', alignItems: 'center' }}>
              <Typography style={{ marginRight: '8px', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                {mapKeys(expanded ? "Close" : "Open")}
              </Typography>
              <ExpandMoreIcon
              />
            </div>
          }
        >

          <Typography>{title}</Typography>
          {(items.reduce((prev, curr) => {
            return curr.checked ? prev + 1 : prev;
          }, 0) != items.length ||
            title === "Completed") &&
            titleAttachment}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setIsFullScreenView(!isFullScreenView);
            }}
            size="small"
            sx={{ marginLeft: "auto" }}
          >
            {isFullScreenView ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </AccordionSummary>
        <GreenDivider />
        <AccordionDetails className="flex flex-col" sx={{ paddingX: 0.25 }}>
          <ChecklistItems
            checklist={items}
            checkItem={checkItem}
            increaseDueDateBy={increaseDueDateBy}
            startEditing={startEditing}
            addSubTask={addSubTask}
            editSubTask={editSubTask}
            deleteSubTask={deleteSubTask}
          />
        </AccordionDetails>
      </Accordion>{" "}
      <Dialog
        fullScreen
        open={isFullScreenView}
        onClose={() => setIsFullScreenView(!isFullScreenView)}
      >

        <Typography variant="h6" className="pl-4 pt-4 pr-4">
          {title}
        </Typography>
        <GreenDivider />
        <div id="checklist" className="checklist-light">
          <ChecklistItems
            checklist={items}
            checkItem={checkItem}
            increaseDueDateBy={increaseDueDateBy}
            startEditing={startEditing}
            addSubTask={addSubTask}
            editSubTask={editSubTask}
            deleteSubTask={deleteSubTask}
          />
        </div>
        <DialogActions>        <IconButton
          onClick={() => setIsFullScreenView(!isFullScreenView)}
          size="large"
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Typography>{mapKeys("Close")}</Typography>
          <FullscreenExitIcon />
        </IconButton></DialogActions>
      </Dialog>
    </>
  );
};

export default AccordionChecklistCategory;
