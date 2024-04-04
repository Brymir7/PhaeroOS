import { useContext, useEffect, useRef, useState } from "react";
import { EntryData } from "../../pages/EditEntryPage";
import { MapKeysContext } from "../contexts/MapKeysContext";

import WellbeingSlider from "../utils/WellbeingSlider";
import {
  Button,
  Divider,
  Grid,
  IconButton,
  Paper,
  TextareaAutosize,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import { Edit2 } from "iconsax-react";
interface Props {
  data: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  viewOnly: boolean;
  handleSliderChange: (
    value: number,
    slider: "wellbeing" | "fluid" | "steps"
  ) => void;
  setIsEmblaActive: (isactive: boolean) => void;
  images: string[];
}

const EditNote = ({
  data,
  viewOnly,
  handleSliderChange,
  updateEntryData,
  setIsEmblaActive,
  images,
}: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  const [editing, setEditing] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [editValue, setEditValue] = useState<string>("");

  let debounceTimer: NodeJS.Timeout;

  const onEdit = () => {
    // Clear the existing timer every time the function is called
    clearTimeout(debounceTimer);

    // Set a new timer that delays the function execution
    debounceTimer = setTimeout(() => {
      if (!editing) {
        setEditValue(data.result.Note.Note);
        setEditing(true);
      } else {
        if (editValue === "") return;
        const newData = {
          ...data,
          result: {
            ...data.result,
            Note: {
              ...data.result.Note,
              Note: editValue,
            },
          },
        };
        updateEntryData(newData);
        setEditing(false);
      }
    }, 50); // Only allow the function to be called once every 200 ms
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      const textarea = inputRef.current;
      textarea.focus();
      // Move cursor to end
      const valueLength = textarea.value.length;
      textarea.selectionStart = valueLength;
      textarea.selectionEnd = valueLength;
    }
  }, [editing]);

  //dynamically resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editing]);
  const windowWidth = window.innerWidth;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <Grid
        container
        sx={{
          maxWidth: "98vw",
          px: 2,
          maxHeight: "80vh",
          pb: 4,
          overflowY: "auto",
          marginTop: "0.25rem",
        }}
        spacing={1}
      >
        <Grid item xs={12} style={{ paddingTop: 0 }}>
          <Typography variant="h4" className="pb-2 flex justify-center">
            {" "}
            {mapKeys("Note")}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ padding: 2 }} className="relative">
            <div
              className={`flex flex-col  ${windowWidth > 768 ? "max-h-[38vh]" : "max-h-[50svh]"
                } overflow-auto px-2 py-2 pb-20 text-sm sm:text-base `}
            >
              {" "}
              {!editing ? <Paper
                elevation={4}
                sx={{
                  borderRadius: "60%", // Circular shape
                  display: !viewOnly ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "75px",
                  minWidth: "fit-content",
                  height: "75px",
                  position: "absolute",
                  bottom: "10px",
                  right: "25px",

                }}

              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  disabled={viewOnly}
                >

                  <Edit2
                    size={theme.iconSize.large}
                    color={theme.palette.primary.main}
                  />

                </IconButton>
              </Paper> : <Button onClick={onEdit} variant="contained" color="primary" sx={{ position: "absolute", bottom: "15px", right: "25px" }}>{mapKeys("Save")}</Button>}
              {editing ? (
                <div className="w-full ">
                  <TextareaAutosize
                    className="textareaCustom"
                    style={{
                      // @ts-ignore
                      "--color": theme.palette.primary.main,
                    }}
                    spellCheck={false}
                    minRows={3}
                    placeholder={mapKeys("Tap here!")}
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={onEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        onEdit();
                      }
                    }}
                  />
                </div>
              ) : (
                <div
                  onClick={() => {
                    if (viewOnly) return;
                    if (!editing) {
                      onEdit();
                    }
                  }}
                  className={`${isMobile ? "max-w-[300px]" : ""} ${viewOnly ? "cursor-default" : "cursor-pointer"
                    }`}
                >
                  <MarkdownDisplay
                    text={data.result.Note.Note}
                    images={images}
                  />
                </div>
              )}
            </div>
          </Paper>
        </Grid>
        <Grid item xs={12} md={12}>
          <Grid container spacing={2} direction={"row"}>
            <Grid item xs={12} md={6}>
              <Paper elevation={2}>
                <Typography
                  variant="h6"
                  className="flex justify-center"
                  sx={{ px: 4, pt: 1 }}
                >
                  {mapKeys("Wellbeing")}
                </Typography>
                <Divider />
                <div className="px-6 py-5 max-w-[350px] mx-auto ">
                  <div
                    onMouseDown={() => setIsEmblaActive(false)}
                    onMouseUp={() => setIsEmblaActive(true)}
                    onTouchStart={() => setIsEmblaActive(false)}
                    onTouchEnd={() => setIsEmblaActive(true)}
                  >
                    <WellbeingSlider
                      viewOnly={viewOnly}
                      value={data.result.Note.Rating}
                      setValue={(newValue) => {
                        handleSliderChange(newValue, "wellbeing");
                      }}
                    />
                  </div>
                </div>
              </Paper>
            </Grid>
            {images && images.length > 0 ? (
              <Grid item xs={12} md={6}>
                <Paper>
                  {images.map((image, index) => (
                    <div key={index}>
                      <Paper elevation={2}>
                        <img src={image} alt="note" className="w-full" />
                      </Paper>
                    </div>
                  ))}
                </Paper>
              </Grid>
            ) : (
              <Grid item xs={12} md={6}>
                <Paper elevation={2}>
                  <Typography variant="h6" className="flex pt-2 pl-4">
                    {mapKeys("Images")}
                  </Typography>
                  <Divider />

                  <div className="px-6 py-8">
                    <Typography>{mapKeys("No images")} </Typography>
                  </div>
                </Paper>
              </Grid>
            )}
          </Grid>
        </Grid>
      </Grid>
    </>
  );
};

export default EditNote;
