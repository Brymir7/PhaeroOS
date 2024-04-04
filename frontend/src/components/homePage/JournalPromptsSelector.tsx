import { useState, useEffect, useContext } from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import { Button, Paper, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { MapKeysContext } from "../contexts/MapKeysContext";

type JournalPromptsProps = {
  allPrompts: string[]; // This is the new prop for all available prompts
  onSelect: (promptIndex: number) => void;
  onClose: () => void;
};

const JournalingPromptsSelector = ({
  allPrompts,
  onSelect,
  onClose,
}: JournalPromptsProps) => {
  // State for the search term
  const [searchTerm, setSearchTerm] = useState("");
  // State for the filtered prompts
  const [filteredPrompts, setFilteredPrompts] = useState<string[]>(allPrompts);
  const { mapKeys } = useContext(MapKeysContext);
  // Effect to filter prompts based on search term
  useEffect(() => {
    const results = allPrompts.filter((prompt) =>
      prompt.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (results.length === 0) {
      results.push(mapKeys("No prompts found"));
    }
    setFilteredPrompts(results);
  }, [searchTerm, allPrompts]);

  return (
    <Dialog onClose={onClose} open={true} fullWidth>
      <Paper elevation={2} className="flex items-center justify-between mb-0">
        <Typography className="p-3" variant="h5">
          {mapKeys("Your prompts")}
        </Typography>

        <Button onClick={onClose}>
          <FontAwesomeIcon icon={faXmark} size="2x" />
        </Button>
      </Paper>
      <TextField
        variant="outlined"
        placeholder={mapKeys("Search prompts...")}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="p-4"
        size="small"
      />
      <List
        className="flex flex-col space-y-4 p-4"
        style={{ maxHeight: "50vh", overflow: "auto" }}
      >
        {filteredPrompts.map((prompt, index) => (
          <ListItem
            button
            key={index}
            onClick={() => onSelect(index)}
            className="hover:bg-gray-300"
          >
            <ListItemText
              primary={<Typography className="text-sm">{prompt}</Typography>}
            />
          </ListItem>
        ))}
      </List>
    </Dialog>
  );
};

export default JournalingPromptsSelector;
