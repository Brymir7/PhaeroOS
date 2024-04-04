import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Grid,
  IconButton,
  ImageList,
  ImageListItem,
  LinearProgress,
  Paper,
  TextareaAutosize,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import Typewriter from "typewriter-effect";
import { Edit2, Trash } from "iconsax-react";

interface TranscriptionTextProps {
  isTranscribing: boolean;
  uploadComplete: boolean;
  isListening: boolean;
  dailyNote: string;
  editingNote: boolean;
  setEditingNote: (editingNote: boolean) => void;
  saveNote: (newText: string) => void;
  text: string;
  setText: (text: string) => void;
  images: string[];
  deleteImages: (imagesToDeleteIndices: number[]) => void;
}

const TranscriptionText: React.FC<TranscriptionTextProps> = ({
  isTranscribing,
  uploadComplete,
  dailyNote,
  images,
  deleteImages,
  editingNote,
  setEditingNote,
  saveNote,
  text,
  setText,
}) => {
  const [progress, setProgress] = React.useState(0);

  const { mapKeys } = useContext(MapKeysContext);
  useEffect(() => {
    if (!isTranscribing) {
      setProgress(0);
      return;
    }
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 95) {
          return 95;
        }
        const diff = Math.random() * (uploadComplete ? 10 : 25);
        return Math.min(oldProgress + diff, 95);
      });
    }, 500);

    return () => {
      clearInterval(timer);
      setProgress(0);
    };
  }, [isTranscribing, uploadComplete]);

  const getLoadingText = (uploadComplete: boolean) => {
    if (uploadComplete) {
      return (
        <>
          {[
            <span key="loading-text">
              {mapKeys("Upload complete, waiting for Transcription.")}
              <br /> {mapKeys("Feel free to leave this page.")}
            </span>,
          ]}
        </>
      );
    } else {
      return (
        <>
          {[
            <span key="loading-text">
              {mapKeys("Uploading your message.")}
              <br /> {mapKeys("Don't leave this page.")}
            </span>,
          ]}
        </>
      );
    }
  };
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState("");

  const handleOpenImageDialog = (imageSrc: string) => {
    setSelectedImage(imageSrc);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [textToScrollTo, setTextToScrollTo] = React.useState<string | null>(
    null
  );
  return (
    <Paper
      elevation={1}
      style={{
        overflow: "hidden",
        height: "100%",
        width: "100%",
        position: "relative",

      }}
    >
      {isTranscribing && (
        <>
          <div id="blur" />
          <div className="flex absolute top-0 left-0 w-full h-full items-center justify-center z-20">
            <Paper elevation={2} sx={{ p: 2, minWidth: "300px" }}>
              <Typography className="text-lg text-center p-1">
                {getLoadingText(uploadComplete)}
              </Typography>
              <div className="mt-2">
                <LinearProgress
                  color={uploadComplete ? "primary" : "warning"}
                  variant="determinate"
                  value={progress}
                />
              </div>
            </Paper>
          </div>
        </>
      )}

      <NoteContent
        saveNote={saveNote}
        dailyNote={dailyNote}
        editingNote={editingNote}
        setEditingNote={setEditingNote}
        text={text}
        setText={setText}
        textToScrollTo={textToScrollTo}
        setTextToScrollTo={setTextToScrollTo}
        images={images}
      />
      {!editingNote && (
        <Paper
          elevation={4}
          sx={{
            borderRadius: "60%", // Circular shape
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "75px",
            height: "75px",
            position: "absolute",
            bottom: "10px",
            right: "10px",
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              setTextToScrollTo(null);
              setEditingNote(true);
            }}
            className="w-full h-full"
          >
            <Edit2
              size={theme.iconSize.large}
              color={theme.palette.primary.main}
            />
          </IconButton>
        </Paper>
      )}
      <Grid
        container
        spacing={1}
        sx={{
          position: "absolute",
          bottom: 0,
          pt: 0,
          paddingBottom: 1,
          maxHeight: "20vh",
        }}
      >
        {editingNote && (
          <>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                variant="outlined"
                color="primary"
                className="absolute bottom-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingNote(false);
                }}
                fullWidth
              >
                {mapKeys("Cancel")}
              </Button>
            </Grid>
            <Grid
              item
              xs={6}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Button
                variant="contained"
                color="primary"
                className="absolute bottom-3"
                fullWidth
              >
                {mapKeys("Save")}
              </Button>
            </Grid>
          </>
        )}

        {!editingNote && (
          <ImageList variant="masonry" cols={3} gap={8}>
            {images.map((img, index) => (
              <ImageListItem key={img}>
                <img
                  srcSet={`${img}`}
                  src={`${img}`}
                  alt={"Daily note Image"}
                  loading="lazy"
                  style={{
                    width: "100px",
                    maxHeight: "100px",
                    cursor: "pointer",
                  }}
                  onClick={() => handleOpenImageDialog(img)}
                />
                <IconButton
                  sx={{ position: "absolute", top: 0, right: 0 }}
                  size="small"
                  onClick={() => {
                    deleteImages([index]);
                  }}
                >
                  <Trash size={theme.iconSize.large} color={theme.palette.primary.error} />
                </IconButton>
              </ImageListItem>
            ))}
          </ImageList>
        )}
      </Grid>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullScreen={fullScreen}
      >
        <DialogContent>
          <img
            src={selectedImage}
            alt="Enlarged daily note"
            style={{ width: "100%" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{mapKeys("Close")}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const NoteContent = ({
  dailyNote,
  editingNote,
  saveNote,
  setEditingNote,
  text,
  setText,
  images,
  textToScrollTo,
  setTextToScrollTo,
}: {
  dailyNote: string;
  editingNote: boolean;
  saveNote: (newString: string) => void;
  setEditingNote: (editingNote: boolean) => void;
  text: string;
  setText: (text: string) => void;
  textToScrollTo: string | null;
  setTextToScrollTo: (text: string | null) => void;
  images: string[];
}) => {
  const { mapKeys, language } = useContext(MapKeysContext);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const parentDivRef = useRef<HTMLDivElement>(null);
  const ignoreClickRef = useRef(true);
  const textRef = useRef(text);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  const scrollTo = (textToScrollTo: string | null) => {
    if (
      textToScrollTo !== null &&
      parentDivRef.current &&
      textareaRef.current
    ) {
      const charIndex = dailyNote.indexOf(textToScrollTo);
      if (charIndex !== -1) {
        console.log(charIndex, dailyNote.slice(charIndex));
        const insertionIndex =
          dailyNote.slice(charIndex).indexOf("\n") + charIndex;
        textareaRef.current.setSelectionRange(insertionIndex, insertionIndex);
        textareaRef.current.scrollTop =
          textareaRef.current.scrollHeight *
          (insertionIndex / dailyNote.length - 0.2);
      }
    }
  };

  useEffect(() => {
    setText(dailyNote);
    if (textToScrollTo !== null) {
      scrollTo(textToScrollTo);
      return;
    }
    if (textareaRef.current) {
      textareaRef.current.focus(); // Focus on the textarea
      const length = dailyNote.length;
      textareaRef.current.setSelectionRange(length, length); // Move cursor to the end
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [editingNote, textToScrollTo]);

  useEffect(() => {

    return () => {
      if (textRef.current.split(" ").length > 25) {
        saveNote(textRef.current)
      }
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ignoreClickRef.current) {
        ignoreClickRef.current = false;
        return;
      }
      const target = event.target as Node | null;
      if (textareaRef.current && !textareaRef.current.contains(target)) {
        setEditingNote(false);
        saveNote(textRef.current);
      }
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [textareaRef.current]);

  useEffect(() => {
    const handleResize = () => {
      if (editingNote && parentDivRef.current) {
        parentDivRef.current.style.paddingBottom = `${window.innerHeight * 0.4
          }px`;
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [editingNote]);


  const exampleMarkdown = `# June 2, 2024<br>
 
**Sleep:** Slept from 22:00 to 06:00<br>
**Weight:** Weighed in at 68 kg today in the morning.<br>


## Meals<br>
- Breakfast: Oatmeal (150g), Banana (1 medium)<br>
- 3 scrambled eggs with 2 slices of whole grain toast and a glass of orange juice for lunch.<br>


...
Oh and I also had a protein shake after my workout.<br>
I think it was like 30g of protein powder with about 400ml milk (writing it like this works too!).<br>


## Gym Session<br>
- 5 Minutes of warmup on the **treadmill**<br>
- **Squats:** 3 sets of 10 reps 100kg<br>
- **Bench Press:** 3 sets of 10 reps 60kg<br>


Oh and I also hit a new PR on my deadlifts today! 150kg for 5 reps! (writing it like this works too!)<br>


## Thoughts of the day<br>
- I feel more **energetic** today.<br>
- I need to **drink** more water.<br>
- When I interacted with Tom today, I felt happy.<br>


**Steps:** 10,000<br>`;

  const exampleMarkdownDe = `# 2. Juni 2024<br>

**Schlaf:** Geschlafen von 22:00 bis 06:00<br>
**Gewicht:** Heute Morgen mit 68 kg gewogen.<br>


## Mahlzeiten<br>
- Frühstück: Haferflocken (150g), Banane (1 mittelgroß)<br>
- 3 Rühreier mit 2 Scheiben Vollkorntoast und ein Glas Orangensaft zum Mittagessen.<br>


...
Ach ja, ich hatte auch einen Proteinshake nach dem Training.<br>
Ich glaube, es waren etwa 30g Proteinpulver mit etwa 400ml Milch (so geht's auch!).<br>


## Fitnessstudio<br>
- 5 Minuten Aufwärmen auf dem **Laufband**<br>
- **Kniebeugen:** 3 Sätze mit 10 Wiederholungen 100kg<br>
- **Bankdrücken:** 3 Sätze mit 10 Wiederholungen 60kg<br>


Ach ja, ich habe heute einen neuen PR beim Kreuzheben erreicht! 150kg für 5 Wiederholungen! (so geht's auch!)<br>


## Gedanken des Tages<br>
- Ich fühle mich heute **energiegeladener**.<br>
- Ich muss mehr **Wasser trinken**.<br>
- Als ich heute mit Tom interagierte, fühlte ich mich glücklich.<br>


**Schritte:** 10,000<br>`;

  const textToWrite =
    language === Language.German ? exampleMarkdownDe : exampleMarkdown;
  const [tempNote, setTempNote] = useState<string | null>(null);
  const [showTypewriter, setShowTypewriter] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const contentArray = textToWrite
    .split("\n\n")
    .filter((item) => item.trim() !== "")
    .concat([textToWrite]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTypewriter(true);
    }, 3000); // 3 seconds delay

    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, []);
  const theme = useTheme();
  return (
    <div
      onClick={() => {
        setTempNote(null);
        if (!editingNote) {
          ignoreClickRef.current = true;
          setEditingNote(true);
        }
      }}
      ref={parentDivRef}
      className={`flex flex-col py-2 px-2 max-h-full h-full overflow-y-auto break-words absolute w-full   ${!editingNote ? "cursor-pointer pb-16" : "min-h-[90vh] pb-16"
        }`}
    >
      {editingNote ? (
        <TextareaAutosize
          className="textareaCustom h-full w-full "
          spellCheck={false}
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}

          style={{ // @ts-ignore
            "--color": theme.palette.primary.main,
            "--backgroundColor": theme.palette.background.paper,
          }}
          placeholder={mapKeys("Start writing!")}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditingNote(false);
              saveNote(textRef.current);
            }
          }}
        />
      ) : (
        <div>
          {!dailyNote && (
            <>
              {tempNote && (
                <>
                  <MarkdownDisplay text={tempNote} />
                </>
              )}
              {showTypewriter && (
                <Typewriter
                  key={currentIndex} // Adding key to reinitialize on index change
                  options={{
                    delay: 50,
                  }}
                  onInit={(typewriter) => {
                    typewriter
                      .typeString(contentArray[currentIndex])
                      .start()
                      .callFunction(() => {
                        setTempNote(contentArray[currentIndex]);
                        setTimeout(() => {
                          setTempNote(null);
                          setCurrentIndex(
                            (prevIndex) => (prevIndex + 1) % contentArray.length
                          );
                        }, 5000); // Revert back after 5 seconds
                      });
                  }}
                />
              )}
            </>
          )}
          <MarkdownDisplay
            text={dailyNote ? dailyNote : mapKeys("Tap here!")}
            images={images}
            onTextClick={(text) => setTextToScrollTo(text)}
            backgroundColorHorizontalRule="#000"
          />
        </div>
      )}
    </div>
  );
};
export default TranscriptionText;
