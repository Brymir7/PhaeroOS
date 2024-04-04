import { useState, useEffect, useContext, ChangeEvent, useRef } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Badge,
  TextField,
  IconButton,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Typography,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import dayjs from "dayjs";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import { MapKeysContext } from "../contexts/MapKeysContext";
import "dayjs/locale/de";
import "dayjs/locale/en";
import GreenDivider from "./GreenDivider";
interface Memory {
  id: number;
  note: string;
  review_notes: string;
  repetition: number;
  recall_score: number;
  next_review: string;
  recorded_at: string;
}

const MemoriesButton = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [currentMemoryIndex, setCurrentMemoryIndex] = useState<number>(0);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const hasModified = useRef<boolean>(false);
  const { mapKeys, language } = useContext(MapKeysContext);
  useEffect(() => {
    fetchMemories();
  }, []);
  if (language === "german") {
    dayjs.locale("de");
  }
  const fetchMemories = async () => {
    api
      .post("/memory/", { userDate: dayjs().format("YYYY-MM-DD") })
      .then((response) => {
        const newMemories: Memory[] = response.data.notes;
        if (newMemories.length > 0) {
          setMemories(newMemories);
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const updateMemories = async () => {
    const data = {
      memoryReviews: memories,
    };
    api
      .post(`/memory/review/`, data)
      .then(() => {
        fetchMemories();
        hasModified.current = false;
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleRecallScoreChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newRecallScore = event.target.value;
    const newMemories = memories.map((memory, index) => {
      if (index === currentMemoryIndex) {
        return {
          ...memory,
          recall_score: parseInt(newRecallScore),
        };
      }
      return memory;
    });
    hasModified.current = true;
    setMemories(newMemories);
  };

  const handleReviewNoteChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newReviewNote = event.target.value;
    const newMemories = memories.map((memory, index) => {
      if (index === currentMemoryIndex) {
        return {
          ...memory,
          review_notes: newReviewNote,
        };
      }
      return memory;
    });
    hasModified.current = true;
    setMemories(newMemories);
  };

  const handlePreviousMemory = () => {
    if (currentMemoryIndex > 0) {
      setCurrentMemoryIndex(currentMemoryIndex - 1);
    }
  };

  const handleNextMemory = () => {
    if (currentMemoryIndex + 1 < memories.length) {
      setCurrentMemoryIndex(currentMemoryIndex + 1);
    }
  };

  const badgeContent = memories.length > 0 ? "!": "";
  const badgeColor = memories.length > 0 ? "success" : "default";
  const memoryIsSpecialDaysAgo = (memory: Memory): string | null => {
    const recordedAt = dayjs(memory.recorded_at);
    const currentDate = dayjs();
    const daysAgo = currentDate.diff(recordedAt, "day");

    // Define milestones
    const milestones = [7, 30, 90, 180, 365];

    // Check if the recorded date matches any special milestone
    for (const milestone of milestones) {
      if (daysAgo === milestone) {
        return `${mapKeys("It's been")} ${milestone} ${mapKeys(
          "days since you recorded this note. What do you think of it now?"
        )}`;
      }
    }

    // Return null if no special milestone is matched
    return null;
  };

  return (
    <>
      <Badge badgeContent={badgeContent} color={badgeColor}>
        <Button size="small" onClick={handleOpenDialog} color={"primary" as any}>
          {mapKeys("Memories")}
        </Button>
      </Badge>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
      >
        <DialogContent         sx={{ padding: 0,  overflowY: "hidden" }}>
          {memories.length > 0 && memories[currentMemoryIndex] ? (
            <>
              <Typography
                variant="h6"
                className="flex gap-3"
              >
                <IconButton
                  onClick={handlePreviousMemory}
                  disabled={currentMemoryIndex === 0}
                >
                  <ArrowBackIosNewIcon />
                </IconButton>
                <div className="min-w-[170px]">
                {mapKeys("Memory")} {currentMemoryIndex + 1} / {memories.length}
                                <Typography className="">
                  {dayjs(memories[currentMemoryIndex].recorded_at).format(
                    "D. MMMM YYYY"
                  )}
                </Typography></div>
                <IconButton
                  onClick={handleNextMemory}
                  disabled={currentMemoryIndex === memories.length - 1}
                >
                  <ArrowForwardIosIcon />
                </IconButton>
              </Typography>
              <GreenDivider />
              <div className="overflow-y-auto max-h-[80vh] pb-8">
              {!memoryIsSpecialDaysAgo(memories[currentMemoryIndex]) && (
                <div className="p-3">
                  <Typography variant="h6" sx={{ paddingRight: 2 }}>
                    {mapKeys("Repeat")}
                  </Typography>

                  <RadioGroup
                    row
                    value={memories[currentMemoryIndex].recall_score.toString()}
                    onChange={handleRecallScoreChange}
                  >
                    <FormControlLabel
                      value="1"
                      control={<Radio />}
                      label={mapKeys("Tomorrow")}
                    />
                    <FormControlLabel
                      value="2"
                      control={<Radio />}
                      label={mapKeys("Soon")}
                    />
                    <FormControlLabel
                      value="3"
                      control={<Radio />}
                      label={mapKeys("Later")}
                    />
                    <FormControlLabel
                      value="4"
                      control={<Radio />}
                      label={mapKeys("Never")}
                    />
                  </RadioGroup>
                </div>
              )}
              <Paper
                elevation={3}
                className="overflow-y-auto max-h-[50vh] p-2 m-3"
              >
                <MarkdownDisplay text={memories[currentMemoryIndex].note} />
              </Paper>
              {memoryIsSpecialDaysAgo(memories[currentMemoryIndex]) && (
                <Typography className="p-3 text-sm">
                  {memoryIsSpecialDaysAgo(memories[currentMemoryIndex])}
                </Typography>
              )}
              <div className="p-3">
              <TextField
                fullWidth
                label={mapKeys("Review Notes")}
                multiline
                rows={4}
                value={memories[currentMemoryIndex].review_notes}
                onChange={handleReviewNoteChange}
                variant="outlined"
                margin="normal"
              /></div></div>
            </>
          ) : (
            <p>{mapKeys("No new memories to show.")}</p>
          )}
        </DialogContent>
        <DialogActions
          sx={{ display: "flex", justifyContent: "space-between", padding: 2 }}
        >
          <Button onClick={handleCloseDialog}>{mapKeys("Close")}</Button>
          <Button onClick={updateMemories} disabled={!hasModified.current}>
            {mapKeys("Save")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MemoriesButton;
