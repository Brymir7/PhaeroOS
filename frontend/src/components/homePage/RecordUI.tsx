import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  Drawer,
  Box,
  useTheme,
} from "@mui/material";
import React, { ChangeEvent, useContext, useRef, useState } from "react";
import SpeakButton from "./SpeakButton";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { JournalNoteContext } from "../contexts/JournalNoteContext";
import RedirectStatsButton from "./RedirectStatsButton";
import CircularAudioProgress from "./CircularAudioProgress";
import {
  Add,
  Apple,
  DocumentText,
  Magicpen,
  Microphone2,
  Paperclip2,
  Setting2,
  TickCircle,
  Trash,
} from "iconsax-react";
interface Props {
  hasProcessed: boolean;
  isListening: boolean;
  isEditing: boolean;
  recordAndSendAudio: () => void;
  setFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  file: File | undefined;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  transcriptionAllwance: number;
  imageAllowance: number;
  formatAllowance: number;
  conversionAllowance: number;
  duration: number;
  maxRecordingDuration: number;
  stopRecording: (audioFileAction: "discard" | "confirm") => void;
  setUploadType: (uploadType: "handwriting" | "food" | "attachment") => void;
  isPaused: boolean;
  openFoodDialog: () => void;
  openExerciseDialog: () => void;
  isProcessing: boolean;
  openAddCustomFoodDialog: () => void;
}
const RecordUI = ({
  hasProcessed,
  isListening,
  isEditing,
  recordAndSendAudio,
  file,
  setFile,
  canvasRef,
  formatAllowance,
  conversionAllowance,
  imageAllowance,
  duration,
  maxRecordingDuration,
  stopRecording,
  setUploadType,
  isPaused,
  openAddCustomFoodDialog,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mapKeys } = useContext(MapKeysContext);
  const {
    formatNote,
    processNote,
    autoProcess,
    updateAutoProcessSetting,
    processAllowance,
    isProcessing,
    canProcess,
  } = useContext(JournalNoteContext);
  const [wantsToFormat, setWantsToFormat] = useState(false);
  const theme = useTheme();
  const actions = [
    {
      icon: (
        <div style={{ display: "flex", alignItems: "center" }}>

          <DocumentText
            color={conversionAllowance > 0 ? theme.palette.primary.main : "gray"}
            size={theme.iconSize.large}
          />
        </div>
      ),
      name: "Add Handwritten",
      onclick: () => {
        setUploadType("handwriting");
        if (!fileInputRef.current) {
          return;
        }
        fileInputRef.current.click();
      },
      badge: conversionAllowance,
    },
    {
      icon: (
        <Magicpen
          color={formatAllowance > 0 ? theme.palette.primary.main : "gray"}
          size={theme.iconSize.large}
        />
      ),
      name: "Format Note",
      onclick: () => {
        setWantsToFormat(true);
      },
      badge: formatAllowance,
    },

    {
      icon: (
        <div style={{ display: "flex", alignItems: "center" }}>

          <Apple
            color={conversionAllowance > 0 ? theme.palette.primary.main : "gray"}
            size={theme.iconSize.large}
          />
        </div>
      ),
      name: "Add Food from Image",
      onclick: () => {
        setUploadType("food");
        if (!fileInputRef.current) {
          return;
        }
        fileInputRef.current?.click();
      },
      badge: conversionAllowance,
    },
    {
      icon: (
        <Microphone2
          size={theme.iconSize.large}
          color={theme.palette.primary.main}
        />
      ),
      name: "Voice To Text",
      onclick: () => {
        recordAndSendAudio();
      },
    },
    {
      icon: (
        <Paperclip2
          size={theme.iconSize.large}
          color={imageAllowance > 0 ? theme.palette.primary.main : "gray"}
        />
      ),
      name: "Add Image",
      onclick: () => {
        setUploadType("attachment");
        if (!fileInputRef.current) {
          return;
        }
        fileInputRef.current.click();
      },
      badge: imageAllowance,
    },
    {
      icon: <Apple color={theme.palette.primary.main} size={theme.iconSize.large} />,
      name: "Add custom food",
      onclick: () => {
        openAddCustomFoodDialog();
      },
    },
    {
      icon: (
        <Setting2
          size={theme.iconSize.large}
          color={autoProcess ? theme.palette.primary.main : "gray"}
        />
      ),
      name: autoProcess ? "Disable Auto Process" : "Enable Auto Process",
      onclick: () => {
        updateAutoProcessSetting(!autoProcess);
      },
      keepOpen: true,
    },
  ];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    const file = event.target.files[0];
    event.target.value = "";
    if (file) {
      setFile(file);
    }
  };
  const generateSeconds = () => {
    if (isListening) {
      return `${(duration / 1000).toFixed(0)}/${(
        maxRecordingDuration / 1000
      ).toFixed(0)}`;
    } else {
      return "";
    }
  };
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = window.innerWidth < 768;

  return (
    <Paper
      elevation={3}
      className="flex justify-center flex-col  relative pb-1"
      sx={{ borderRadius: 0, marginTop: "0px" }}
    >
      {generateSeconds() !== "" && (
        <CircularAudioProgress
          seconds={duration}
          maxSeconds={maxRecordingDuration}
        />
      )}

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "20px", // Equal padding on both left and right sides
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: "14px", // Ensure inner padding matches outer padding
            paddingRight: "8px",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            maxWidth: isMobile ? "100%" : "47%",
            margin: isMobile ? "0" : "0 auto", // Center the drawer on desktop
          },
        }}
      >
        <Box
          component={"div"}
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "px",
            justifyContent: "center",
            padding: "0 0px", // Ensure inner padding matches outer padding
            maxWidth: "100%",
          }}
        >
          {actions.map((action, index) => (
            <Box
              component={"div"}
              key={index}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                width: "90px", // Ensure each item has enough width
              }}
              onClick={() => {
                if (action.badge && action.badge === 0) {
                  return;
                }
                if (!action.keepOpen) {
                  setDrawerOpen(false);
                }
                action.onclick();
              }}
            >
              <Paper style={{ borderRadius: 999, aspectRatio: "1/1" }} className="flex justify-between align-middle">
                <Button
                  variant="text"
                  color="primary"
                  disabled={action.badge === 0}
                >
                  {action.icon}
                </Button>
              </Paper>
              {/* </Badge> */}
              <Typography variant="caption">{mapKeys(action.name)}</Typography>
            </Box>
          ))}
        </Box>
      </Drawer>
      <Dialog open={wantsToFormat} onClose={() => setWantsToFormat(false)}>
        <DialogTitle>
          {mapKeys("Are you sure you want to format your note?")}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {mapKeys(
              "This will format your note and might remove some of the formatting you have added. Are you sure you want to continue?"
            )}
          </Typography>
          <DialogActions>
            <Button
              variant="outlined"
              onClick={() => {
                setWantsToFormat(false);
              }}
              color="error"
              fullWidth
            >
              {mapKeys("Cancel")}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => {
                formatNote();
                setWantsToFormat(false);
              }}
              color="primary"
            >
              {mapKeys("Format")}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      <div
        className={` ${isListening
          ? "grid grid-cols-3 w-[60%] px-2 mx-auto"
          : "items-center w-[95%] mx-auto"
          } relative py-1`}
      >
        {isListening && (
          <Paper elevation={3} sx={{ borderRadius: 999, mx: "auto", width: "50px", height: "50px" }} className="flex justify-center align-middle">
            <IconButton
              sx={{ aspectRatio: "1/1" }}
              onClick={() => stopRecording("discard")}
            >
              <Trash color={theme.palette.primary.error} size={theme.iconSize.large} />
            </IconButton>
          </Paper>
        )}
        {!isListening && (
          <>
            <Paper
              elevation={3}
              sx={{
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                paddingTop: "2px",
                justifyContent: "center",
                width: "50px",
                height: "50px",
                position: "absolute",
              }}
            >
              <IconButton
                onClick={() => setDrawerOpen(true)}
                disabled={hasProcessed}
              >
                <div className="">
                  <Add
                    color={hasProcessed ? "gray" : theme.palette.primary.text}
                    size={theme.iconSize.large}
                  />
                </div>
              </IconButton>
            </Paper>
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <div className="flex gap-1">
                {!autoProcess &&
                  window.innerWidth >= 200 &&
                  processAllowance > 0 && (
                    <div className={`flex justify-center ${window.innerWidth < 390 ? "ml-7" : ""}`}>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => processNote()}
                        disabled={!canProcess || isProcessing}
                        sx={{
                          minHeight: "55px",
                          minWidth: "50px",
                        }}
                      >
                        <Setting2 size={theme.iconSize.large} />
                      </Button>
                    </div>
                  )}
                <RedirectStatsButton />
              </div>
            </div>
          </>
        )}
        {!isListening && (
          <div
            className={`flex justify-center z-10  ${(isEditing || file) && "pointer-events-none"
              } `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>
        )}
        {isListening && (
          <div
            className={`flex justify-center z-10  ${(isEditing || file) && "pointer-events-none"
              } `}
          >
            <Paper elevation={3} sx={{ borderRadius: 999 }}>
              <SpeakButton
                isPaused={isPaused}
                isListening={isListening}
                onSpeakButtonClick={() => {
                  recordAndSendAudio();
                }}
              />
            </Paper>
          </div>
        )}

        <canvas
          ref={canvasRef}
          id="visualizer"
          className={`flex z-0 h-14 w-1/3 translate-x-[100%] mt-auto rounded-full bg-transparent pointer-events-none absolute `}
        />  {isListening && (
          <Paper elevation={3} sx={{ borderRadius: 999, mx: "auto", width: "50px", height: "50px" }} className="flex justify-center align-middle">

            <IconButton
              sx={{ aspectRatio: "1/1" }}
              onClick={() => stopRecording("confirm")}
            >
              <TickCircle color={theme.palette.primary.success} size={theme.iconSize.large} />
            </IconButton>


          </Paper>)}
      </div>

    </Paper>
  );
};

export default RecordUI;
