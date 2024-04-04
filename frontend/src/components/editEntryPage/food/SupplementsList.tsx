import {
  faMugHot,
  faAngleUp,

} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  ListItem,
  IconButton,
  Button,
  Input,
  Box,
  Paper,
  useTheme,
} from "@mui/material";
import React, { useContext, useState } from "react";
import { EntryData } from "../../../pages/EditEntryPage";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { Add, Trash } from "iconsax-react";
interface Props {
  data: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  viewOnly?: boolean;
}

const SupplementsList = ({
  data,
  updateEntryData,
  viewOnly = false,
}: Props) => {
  const [supplementsOpen, setSupplementsOpen] = useState<boolean>(false);
  const [adding, setAdding] = useState<boolean>(false);
  const [newItem, setNewItem] = useState<string>("");
  const { mapKeys, mapSupplements } = useContext(MapKeysContext);
  const theme = useTheme();
  const handleDelete = (index: number) => {
    const newData = { ...data };
    newData.result.Food["List of Supplements"].splice(index, 1);
    updateEntryData(newData);
  };

  const handleAdd = () => {
    if (!adding) {
      setAdding(true);
      setNewItem("");
    } else {
      setAdding(false);
      if (newItem === "") return;
      const newData = { ...data };
      newData.result.Food["List of Supplements"].push(newItem);
      updateEntryData(newData);
    }
  };

  return (
    <Paper elevation={2} className="flex justify-center">
      <List
        sx={{
          width: "100%",
          borderRadius: "6px",
          maxWidth: 400,
          bgcolor: "background.paper",
          paddingBottom: "0px",
          paddingTop: "0px",
        }}
        component="nav"
        aria-labelledby="nested-list-subheader"
      >
        <ListItemButton
          sx={{ paddingLeft: "10px", display: "flex" }}
          alignItems="center"
          onClick={() => setSupplementsOpen(!supplementsOpen)}
        >
          <ListItemIcon>
            <Box component="div" display="flex" gap={1} alignItems="center">
              <FontAwesomeIcon icon={faMugHot} color={theme.palette.primary.main} />
              <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm  border-2">
                {data.result.Food["List of Supplements"].length}
              </div>
            </Box>
          </ListItemIcon>
          <ListItemText sx={{ paddingLeft: "10px" }} primary="Supplements" />
          <FontAwesomeIcon
            className={` ${supplementsOpen && "rotate-180"}`}
            icon={faAngleUp}
          />
        </ListItemButton>
        <Divider />
        <Collapse in={supplementsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {data.result.Food["List of Supplements"].length > 0 ? (
              data.result.Food["List of Supplements"].map(
                (item: string, index: number) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      viewOnly ? null : (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleDelete(index)}
                        >
                          <Trash  size={theme.iconSize.large} color={theme.palette.primary.error} />
                        </IconButton>
                      )
                    }
                    sx={{ pl: 4 }}
                  >
                    <ListItemText primary={mapSupplements(item)} />
                  </ListItem>
                )
              )
            ) : !adding ? (
              <ListItem sx={{ pl: 4 }}>
                <ListItemText primary="No Supplements" />
              </ListItem>
            ) : null}
            {adding && (
              <ListItem sx={{ pl: 4 }}>
                <Input
                  spellCheck={false}
                  
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAdd();
                    }
                    if (e.key === "Escape") {
                      setAdding(false);
                    }
                  }}
                  placeholder={mapKeys("New supplement")}
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  fullWidth
                  sx={{
                    "&::before": {
                      transform: "scaleX(0)",
                      left: "2.5px",
                      right: "2.5px",
                      bottom: 0,
                      top: "unset",
                      transition: "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
                      borderRadius: 0,
                    },
                    "&:focus-within::before": {
                      transform: "scaleX(1)",
                    },
                  }}
                />
              </ListItem>
            )}
            {!viewOnly && (
              <>
                <Divider />
                <ListItem sx={{ padding: 0 }}>
                  <Button
                    sx={{ textTransform: "none", padding: 1.5 }}
                    fullWidth
                    className="flex items-center w-full"
                    onClick={() => {
                      handleAdd();
                    }}
                  >
                    <p className="mr-4">
                      {mapKeys(adding ? "Confirm" : "Add an item")}
                    </p>
                                    <Add size={theme.iconSize.medium} color={theme.palette.primary.main} />
                  </Button>
                </ListItem>
              </>
            )}
          </List>
        </Collapse>
      </List>
    </Paper>
  );
};

export default SupplementsList;
