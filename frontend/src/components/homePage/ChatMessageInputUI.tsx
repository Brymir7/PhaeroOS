import { keyframes } from "@emotion/react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Paper,
  TextareaAutosize,
  Typography,
  useTheme,
} from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import { JournalNoteContext } from "../contexts/JournalNoteContext";
import { useWindowWidth } from "../utils/CustomHooks";
import { Add, Apple, DocumentText, Microphone2, Paperclip2 } from "iconsax-react";
// Extend the Window interface to include SpeechRecognition and webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Add a glowing animation for the microphone button when recording

const ChatMessageInputUI = () => {
  const theme = useTheme();
  const glow = keyframes`
  0% {
    box-shadow: 0 0 5px ${theme.palette.primary.main};
  }

  50% {
    box-shadow: 0 0 10px ${theme.palette.primary.main};
  }

  100% {
    box-shadow: 0 0 5px ${theme.palette.primary.main};
  }
`;

  const recognitionRef = useRef<any | null>(null);
  const { mapKeys, language } = useContext(MapKeysContext);
  const { isProcessing, isAnswering } = useContext(JournalNoteContext);
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const { sendMessage } = useContext(JournalNoteContext);
  const startRecording = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = language === Language.English ? "en-US" : "de-DE";
    recognition.interimResults = true; // Allow interim results for continuous updates
    recognition.continuous = true; // Set continuous to true

    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += " " + event.results[i][0].transcript.trim() + " ";
        }
      }

      setMessage((prevMessage) => (prevMessage + finalTranscript).trim());
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error detected: " + event.error);
        return;
      }
      recognition.stop();
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);
  };
  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const windowWidth = useWindowWidth();

  const onFocus = () => {
    stopRecording();
  };

  useEffect(() => {

    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, [message]);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = windowWidth < 600;
  const actions = [
    {
      icon: (
        <div style={{ display: "flex", alignItems: "center" }}>
          <DocumentText
            color={theme.palette.primary.main}
            size={theme.iconSize.large}
          />
        </div>
      ),
      name: "Create Training Plan (Coming Soon)",
      onclick: () => {
        setDrawerOpen(false);
      },
      badge: undefined,
      keepOpen: false,
    },
    {
      icon: (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Apple
            color={theme.palette.primary.main}
            size={theme.iconSize.large}
          />
        </div>
      ),
      name: "Create Nutrition Plan (Coming Soon)",
      onclick: () => {
        setDrawerOpen(false);
      },
      badge: undefined,
      keepOpen: false,
    },
    {
      icon: (
        <Paperclip2
          size={theme.iconSize.large}
          color={theme.palette.primary.main}
        />
      ),
      name: "Add Image (Coming Soon)",
      onclick: () => {
        setDrawerOpen(false);
      },
      badge: undefined,
    },
  ];
  return (
    <Paper
      elevation={3}
      className="flex justify-center py-1 relative flex-col  w-full"
      sx={{ borderRadius: 0, marginTop: "0px" }}
    >
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
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            maxWidth: isMobile ? "100%" : "27%",
            margin: isMobile ? "0" : "0 auto", // Center the drawer on desktop
          },
        }}
      >
        <Box
          component={"div"}
          sx={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(3, 1fr)",
            gap: "30px",
            justifyContent: "center",
            marginX: "auto",
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
              <Paper
                style={{ borderRadius: 999, aspectRatio: "1/1" }}
                className="flex justify-between align-middle"
              >
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

      <div className="flex gap-2 items-center mx-auto relative min-w-[95%] max-w-[95%] pb-1">
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
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(true)}
            disabled={isProcessing || isAnswering}
          >
            <div className="">
              <Add
                color={isProcessing || isAnswering ? "gray" : theme.palette.primary.text}
                size={theme.iconSize.large}
              />
            </div>
          </IconButton>
        </Paper>
        <TextareaAutosize
          className="textareaCustom h-full"
          spellCheck={false}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => onFocus()}
          placeholder={mapKeys("What's on your mind today...")}
          minRows={1}
          color="primary"
          disabled={isProcessing || isAnswering}
          style={{
            width: "100%",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "10px", // @ts-ignore
            "--color": theme.palette.primary.main,
            "--backGroundColor": theme.palette.background.paper,
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && windowWidth > 1900) {
              e.preventDefault();
              sendMessage(message);
              setMessage("");
            }
            if (e.key === "Escape") {
              setMessage("");
            }
          }}
        />

        {!message || isRecording ? (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isAnswering}
            variant="outlined"
            sx={{
              animation: isRecording ? `${glow} 1.5s infinite` : "none",
              width: "50px",
              height: "50px",
            }}
          >
            <Microphone2 size={theme.iconSize.medium} />
          </Button>
        ) : (
          <Button
            onClick={() => {
              sendMessage(message);
              setMessage("");
            }}
            disabled={isProcessing || isAnswering}
            variant={"contained"}
            sx={{
              width: "130px",
              height: "50px",
              borderRadius: "999px",
              textTransform: "none",
            }}
          >
            {mapKeys("Send")}
          </Button>
        )}
      </div>
      {/* {showToggleButtons && (
        <div className="mx-auto min-w-[95%] mt-1">
          <ToggleButtons
            buttons={buttons}
            onToggle={(value) =>
              setMessagingView(value === "Chat" ? true : false)
            }
          />
        </div>
      )} */}
    </Paper>
  );
};

export default ChatMessageInputUI;
