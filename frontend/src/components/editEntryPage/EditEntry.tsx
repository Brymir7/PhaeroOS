import { useRef, useEffect, useState, useContext } from "react";
import EditFoodList from "./food/EditFoodList";
import { useApi } from "../../modules/apiAxios";
import React from "react";
import { EntryData } from "../../pages/EditEntryPage";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import EditExercise from "./exercise/EditExercise";
import { AuthContext } from "../contexts/AuthContext";
import { Paper, BottomNavigation, BottomNavigationAction, Dialog, Button, DialogContent, Typography, DialogActions, DialogTitle, useTheme } from "@mui/material";
import EditNote from "./EditNote";
import EditSleep from "./sleep & weight/EditSleep";
import EditWeight from "./sleep & weight/EditWeight";
import useEmblaCarousel from "embla-carousel-react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { DiagramDataType } from "../../pages/StatisticsPage";
import { Apple, Moon, Note, Weight, WeightMeter } from "iconsax-react";
import dayjs from "dayjs";
import GreenDivider from "../homePage/GreenDivider";
interface Props {
  entryData: EntryData;
  initialView?: "Note" | "Food" | "Exercise" | "Sleep" | "Weight";
  setEntryData: React.Dispatch<React.SetStateAction<EntryData | undefined>>;
  viewOnly?: boolean;
  noteProcessed?: boolean;
  images: string[];
  dateOfEntry?: dayjs.Dayjs;
}

const EditEntry: React.FC<Props> = ({
  entryData,
  setEntryData,
  initialView = "Note", // default to "Note" if not provided
  viewOnly = false,
  images,
  dateOfEntry,
}) => {
  const [viewOnlyMode, setViewOnlyMode] = useState<boolean>(viewOnly);
  const [emblaActive, setIsEmblaActive] = useState(null);
  const [emblaRef, emblaApi] = useEmblaCarousel();
  const [currentKey, setCurrentKey] = useState<string>(initialView);
  const [recommendations, setRecommendations] = useState<{
    [key: string]: [number, string];
  }>({});
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  const today_date =
    dayjs().hour() < 3
      ? dayjs().subtract(1, "day").format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  useEffect(() => {
    if (hasAccess) fetchRecommendations();
  }, [hasAccess]);

  const views = ["Note", "Food", "Exercise", "Sleep", "Weight"];
  const api = useApi();

  const dataModified = useRef(false);

  useEffect(() => {
    updateNoteBackend();
  }, [entryData]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const index = emblaApi.selectedScrollSnap();
      setCurrentKey(views[index]);
    };
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const scrollToIndex = (index: number) => {
    if (emblaApi) {
      emblaApi.scrollTo(index);
    }
  };

  useEffect(() => {
    const index = views
      .map((a) => a.toUpperCase())
      .indexOf(currentKey.toUpperCase());
    scrollToIndex(index);
  }, [currentKey, emblaApi]);

  useEffect(() => {
    const index = views
      .map((a) => a.toUpperCase())
      .indexOf(initialView.toUpperCase());
    scrollToIndex(index);
  }, [emblaApi]);
  useEffect(() => {
    if (emblaApi) {
      emblaApi.reInit();
    }
  }, [emblaActive, emblaApi]);
  // API Calls

  const updateNoteBackend = async () => {
    // NOTE we need to update the temporary note here
    if (viewOnlyMode || !dataModified.current) return;
    dataModified.current = false;
    const data = {
      note_dict: entryData.result,
    };

    try {
      const response = await api.post("/phaero_note/update/", data, { params: { specific_date: dateOfEntry ? dateOfEntry.format("YYYY-MM-DD") : today_date } });

      setEntryData(response.data);
    } catch (error) {
      handleAllErrors(error);
    }
  };

  // const confirmNoteBackend = (note_dict: { [key: string]: EntryData }) => {
  //   // this actually saves the note
  //   api.post("/final_note/", { note_dict }).catch(handleAllErrors);
  // };

  const fetchRecommendations = () => {
    api
      .get("/food/recommendations/")
      .then((response) => setRecommendations(response.data))
      .catch(handleAllErrors);
  };

  useEffect(() => {
    return () => {
      updateNoteBackend();
    };
  }, [currentKey]);

  useEffect(() => {
    window.addEventListener("beforeunload", () => {
      updateNoteBackend();
    });
    diagramRequest();
    return () => {
      window.removeEventListener("beforeunload", () => {
        updateNoteBackend();
      });
    };
  }, []);

  const updateEntryData = (
    newData: React.SetStateAction<EntryData | undefined>
  ) => {
    dataModified.current = true;
    setEntryData(newData);
  };
  useEffect(() => { }, [entryData]);
  const theme = useTheme();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSliderChange = (
    value: number,
    slider: "wellbeing" | "fluid" | "steps"
  ) => {
    // useRef to hold the timeout ID, initialized as null

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setEntryData((prevState) => {
        const newData = JSON.parse(JSON.stringify(prevState));
        switch (slider) {
          case "wellbeing":
            newData.result.Note.Rating = value;
            break;
          case "fluid":
            newData.result.Nutrition.Total.Macros.fluid = [value, "ML"];
            break;
          case "steps":
            newData.result.Exercise.Steps = value;
            break;
        }
        return newData;
      });
    }, 100);
    updateEntryData(entryData);
    // Cleanup timeout on component unmount or before re-executing the callback
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  };

  const { mapKeys } = useContext(MapKeysContext);
  const [diagramData, setDiagramData] = useState<DiagramDataType[]>([]);
  const [exerciseDiagrams, setExerciseDiagrams] = useState<DiagramDataType[]>(
    []
  );
  const generalDiagramTitles = [
    "Wellbeing",
    "Sleep",
    "Activity Level",
    "Steps",
    "Calories",
    "Nutrition",
    "Hydration",
    "Weight",
    "Absolute Activity Level",
  ];
  const diagramRequest = async () => {
    const apiEndpoint = `/diagrams/`;
    api
      .get(apiEndpoint)
      .then((response) => {
        const newDiagramData: DiagramDataType[] = [];
        const newExerciseDiagrams: DiagramDataType[] = [];
        response.data.data.forEach((data: DiagramDataType) => {
          if (generalDiagramTitles.includes(data.title)) {
            newDiagramData.push(data);
          } else {
            newExerciseDiagrams.push(data);
          }
        });
        setDiagramData(newDiagramData);
        setExerciseDiagrams(newExerciseDiagrams);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const [editEntryDialogOpen, setEditEntryDialogOpen] = useState(viewOnly);
  return (
    <>
      <Dialog open={editEntryDialogOpen} onClose={() => setEditEntryDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Typography variant="h5" align="center">
            {mapKeys("Edit Entry")}
          </Typography>
        </DialogTitle>
        <GreenDivider />
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {mapKeys(`You are currently viewing a non-editable entry. If you want to edit, press the "Edit" button. Otherwise, press "Just View".`)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEntryDialogOpen(false)} color="primary" variant="contained" fullWidth>
            {mapKeys("Just View")}
          </Button>
          <Button onClick={() => { setViewOnlyMode(false); setEditEntryDialogOpen(false) }} color="primary" variant="outlined" fullWidth>
            {mapKeys("Edit")}
          </Button>
        </DialogActions>

      </Dialog>
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          width: "100%",

          zIndex: 20, // Ensure it's above other components
        }}
        elevation={2}
      >
        <BottomNavigation
          showLabels
          value={currentKey}
          onChange={(_event, newValue) => {
            setCurrentKey(newValue);
          }}
          sx={{
            "& .MuiBottomNavigationAction-root": {
              minWidth: 0, // Reduce the minimum width
              flex: 1, // Make each action flex to fill the space
              [theme.breakpoints.up("md")]: {
                fontSize: "1.25rem",
              },
              paddingTop: "0.5rem",
            },
          }}
        >
          <BottomNavigationAction
            label={mapKeys("Note")}
            value={"Note"}
            icon={<Note size={theme.iconSize.medium} />}
          />

          <BottomNavigationAction
            label={mapKeys("Food")}
            value={"Food"}
            icon={<Apple size={theme.iconSize.medium} />}
          />
          <BottomNavigationAction
            label={mapKeys("Exercise")}
            value="Exercise"
            icon={<Weight size={theme.iconSize.medium} />}
          />
          <BottomNavigationAction
            label={mapKeys("Sleep")}
            value="Sleep"
            icon={<Moon size={theme.iconSize.medium} />}
          />

          <BottomNavigationAction
            label={mapKeys("Weight")}
            value="Weight"
            icon={<WeightMeter size={theme.iconSize.medium} />}
          />
        </BottomNavigation>
      </Paper>
      <div className="flex  h-full w-full overflow-hidden " ref={emblaRef}>
        <div className="embla__container">
          <div className="embla__slide">
            <div className="embla_slide_content">

              <EditNote
                data={entryData}
                updateEntryData={updateEntryData}
                viewOnly={viewOnlyMode}
                handleSliderChange={handleSliderChange}
                setIsEmblaActive={
                  setIsEmblaActive as (isactive: boolean | null) => void
                } // Fix: Update the type of setIsEmblaActive
                images={images}
              />
            </div>
          </div>
          <div className="embla__slide">
            <div className="embla_slide_content">

              <EditFoodList
                data={entryData}
                updateEntryData={updateEntryData}
                RecommendationMap={recommendations}
                viewOnly={viewOnlyMode}
                handleSliderChange={handleSliderChange}
                setIsEmblaActive={
                  setIsEmblaActive as (isactive: boolean | null) => void
                } // Fix: Update the type of setIsEmblaActive
                diagramData={diagramData.find(
                  (data) => data.title === "Calories"
                )}
              />
            </div>
          </div>
          <div className="embla__slide">
            <div className="embla_slide_content">
              <EditExercise
                handleSliderChange={handleSliderChange}
                entryData={entryData}
                updateEntryData={updateEntryData}
                viewOnly={viewOnlyMode}
                setIsEmblaActive={
                  setIsEmblaActive as (isactive: boolean | null) => void
                }
                stepsData={
                  diagramData.find((data) => data.title === "Steps") ||
                  undefined
                }
                exerciseDiagramData={exerciseDiagrams}
              />
            </div>
          </div>
          <div className="embla__slide ">
            <div className="embla_slide_content">
              <EditSleep
                entryData={entryData}
                updateEntryData={updateEntryData}
                viewOnly={viewOnlyMode}
                diagramData={diagramData?.find(
                  (data) => data.title === "Sleep"
                )}
              />
            </div>
          </div>
          <div className="embla__slide">
            <div className="embla_slide_content">
              <EditWeight
                entryData={entryData}
                updateEntryData={updateEntryData}
                viewOnly={viewOnlyMode}
                diagramData={diagramData?.find(
                  (data) => data.title === "Weight"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditEntry;
