import React, { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../../contexts/MapKeysContext";

import { EntryData } from "../../../pages/EditEntryPage";
import SearchExercises from "./SearchExercises";
import { useApi } from "../../../modules/apiAxios";
import { AuthContext } from "../../contexts/AuthContext";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";
import {
  Box,
  Button,
  Collapse,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Theme,
  Typography,
  useTheme,
} from "@mui/material";
import {
  faAngleUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RangeSlider from "../RangeSlider";
import {
  ExerciseCategories,
  ExerciseItem,
  ExerciseItemPhaeroNote,
  MultipleExerciseItem,
  convertExerciseBackendToExerciseItem,
} from "../../utils/exerciseInterfaces";
import MultipleExerciseDisplay from "./MultipleExerciseDisplay";
import WrappedExerciseDisplay from "./SingleExerciseDisplay";
import UniversalChart from "../../statisticsPage/UniversalChart";
import { DiagramDataType } from "../../../pages/StatisticsPage";
import Icon from "@mdi/react";
import { mdiGymnastics, mdiRun, mdiRunFast, mdiWeightLifter } from "@mdi/js";

interface Props {
  entryData: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  viewOnly?: boolean;
  handleSliderChange: (
    value: number,
    slider: "wellbeing" | "fluid" | "steps"
  ) => void;
  setIsEmblaActive: (isactive: boolean) => void;
  stepsData?: DiagramDataType;
  exerciseDiagramData?: DiagramDataType[];
}

function EditExercise({
  entryData,
  updateEntryData,
  viewOnly = false,
  handleSliderChange,
  setIsEmblaActive,
  stepsData,
  exerciseDiagramData,
}: Props) {
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>([]);
  const [openExerciseType, setOpenExerciseType] = useState<string | null>(null);
  const { mapExercises, mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  const [exercisesNote, setExercisesNote] = useState<ExerciseCategories>({
    "Cardio Exercises": [],
    "Weight Lifting Exercises": [],
    "Bodyweight Exercises": [],

  }); // easier access than from the dictionary
  useEffect(() => {
    const newExerciseNote: ExerciseCategories = {
      "Cardio Exercises": [],
      "Weight Lifting Exercises": [],
      "Bodyweight Exercises": [],

    };

    Object.keys(entryData.result.Exercise.Exercises).forEach(
      (exerciseTypeKey) => {
        const groupedExercises: { [key: string]: ExerciseItem[] } = {};
        Object.keys(
          entryData.result.Exercise.Exercises[exerciseTypeKey]
        ).forEach((exercise) => {
          const baseName = removeRepetitionFromExercise(exercise);
          if (!groupedExercises[baseName]) {
            groupedExercises[baseName] = [];
          }
          groupedExercises[baseName].push({
            name: exercise,
            exercise_type: mapExerciseKeyToType(exerciseTypeKey),
            ...entryData.result.Exercise.Exercises[exerciseTypeKey][exercise],
          });
        });

        Object.entries(groupedExercises).forEach(
          ([baseName, groupedExercises]) => {
            if (groupedExercises.length > 1) {
              newExerciseNote[exerciseTypeKey as keyof ExerciseCategories].push(
                {
                  exercise_name: baseName,
                  exercises: groupedExercises,
                } as MultipleExerciseItem
              );
            } else {
              newExerciseNote[exerciseTypeKey as keyof ExerciseCategories].push(
                groupedExercises[0]
              );
            }
          }
        );
      }
    );
    setExercisesNote(newExerciseNote);
  }, [entryData]); // Include other necessary dependencies
  const convertExerciseItemToPhaeroNote = (
    exercise: ExerciseItem
  ): ExerciseItemPhaeroNote => {
    const newExerciseObject = Object.entries(exercise).reduce(
      (acc, [key, value]) => {
        if (key === "name" || key === "exercise_type" || value === undefined) {
          return acc;
        }
        return { ...acc, [key]: Number(value) };
      },
      {}
    );
    return {
      [exercise.name]: newExerciseObject,
    };
  };
  const updatePhaeroNote = (exercise: ExerciseItem) => {
    const exerciseType = mapExerciseTypeToKey(exercise.exercise_type);
    const newExerciseObject = convertExerciseItemToPhaeroNote(exercise);
    updateEntryData({
      ...entryData,
      result: {
        ...entryData.result,
        Exercise: {
          ...entryData.result.Exercise,
          Exercises: {
            ...entryData.result.Exercise.Exercises,
            [exerciseType]: {
              ...entryData.result.Exercise.Exercises[exerciseType],
              ...newExerciseObject,
            },
          },
        },
      },
    });
    entryData.result.Exercise.Exercises[exerciseType] = {
      ...entryData.result.Exercise.Exercises[exerciseType],
      ...newExerciseObject,
    };
  };
  const addExercise = (exercise: ExerciseItem) => {
    const exerciseType = mapExerciseTypeToKey(exercise.exercise_type);
    const countOfExercise = Object.keys(
      entryData.result.Exercise.Exercises[exerciseType]
    )
      .map((exercise_name) => {
        return removeRepetitionFromExercise(exercise_name);
      })
      .filter((exercise_name) => exercise_name === exercise.name).length;
    if (countOfExercise > 0) {
      exercise.name = `${exercise.name} (${countOfExercise})`;
    }
    setOpenExerciseType(exerciseType);
    updatePhaeroNote(exercise);
  };
  const deleteExercise = (exercise: ExerciseItem) => {
    const exerciseType = mapExerciseTypeToKey(exercise.exercise_type);
    const newExercises = {
      ...entryData.result.Exercise.Exercises[exerciseType],
    };
    delete newExercises[exercise.name];
    updateEntryData({
      ...entryData,
      result: {
        ...entryData.result,
        Exercise: {
          ...entryData.result.Exercise,
          Exercises: {
            ...entryData.result.Exercise.Exercises,
            [exerciseType]: newExercises,
          },
        },
      },
    });
    entryData = {
      ...entryData,
      result: {
        ...entryData.result,
        Exercise: {
          ...entryData.result.Exercise,
          Exercises: {
            ...entryData.result.Exercise.Exercises,
            [exerciseType]: newExercises,
          },
        },
      },
    };
  };

  const api = useApi();
  const fetchExercises = () => {
    try {
      api.get(`/exercise/`).then((response) => {
        const exercises = response.data;
        const result: ExerciseItem[] = [];
        Object.values(exercises).forEach((exercise: any) => {
          result.push(convertExerciseBackendToExerciseItem(exercise));
        });
        setExerciseList(result);
      });
    } catch (error) {
      handleAllErrors(error);
    }
  };

  const mapExerciseTypeToKey = (type: string) => {
    switch (type) {
      case "cardio":
        return "Cardio Exercises";
      case "weight":
        return "Weight Lifting Exercises";
      case "bodyweight":
        return "Bodyweight Exercises";
      default:
        return "Other Exercises";
    }
  };
  const mapExerciseKeyToType = (key: string) => {
    switch (key) {
      case "Cardio Exercises":
        return "cardio";
      case "Weight Lifting Exercises":
        return "weight";
      case "Bodyweight Exercises":
        return "bodyweight";
      default:
        return "other";
    }
  };

  const getIconFromType = (type: string, theme: Theme) => {
    switch (type) {
      case "Cardio Exercises":
        return <Icon path={mdiRunFast} size={1.0} color={theme.palette.primary.main} />;
      case "Weight Lifting Exercises":
        return <Icon path={mdiWeightLifter} size={1.0} color={theme.palette.primary.main} />;
      case "Bodyweight Exercises":
        return <Icon path={mdiGymnastics} size={1.0} color={theme.palette.primary.main} />;
      default:
        return <FontAwesomeIcon icon={faPlus} color={theme.palette.primary.main} />;
    }
  };
  const removeRepetitionFromExercise = (exercise: any) => {
    const regex = /\s*\(\d+\)/g;
    // const matches = exercise.match(regex);
    // const number = matches ? matches[1] : null;
    const cleanedExercise = exercise.replace(regex, "").trim()
    return cleanedExercise;
  };
  useEffect(() => {
    if (hasAccess) fetchExercises();
  }, [hasAccess]);
  const mapKeyToLabel = (key: string) => {
    switch (key) {
      case "duration":
        return mapKeys("Duration") + " in minutes";
      case "weight":
        return mapKeys("Weight") + " in kg";
      case "sets":
        return mapKeys("Sets");
      case "reps":
        return mapKeys("Reps");
      case "rest":
        return mapKeys("Rest");
      case "distance":
        return mapKeys("Distance");
      case "calories":
        return mapKeys("Calories burned");
      default:
        return key.replace(/_/g, " ").toUpperCase();
    }
  };
  const handleChangeExerciseItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: keyof ExerciseCategories,
    exerciseIndex: number
  ) => {
    const { name, value } = e.target;
    const updatedExercise = exercisesNote[category][
      exerciseIndex
    ] as ExerciseItem;
    if (typeof value !== "string") {
      updatedExercise[name] = value;
      updatePhaeroNote(updatedExercise);
      return;
    }
    updatedExercise[name] = value.startsWith("0")
      ? value.replace(/^0+/, "")
      : value;
    updatePhaeroNote(updatedExercise);
  };
  const handleChangeMultipleExerciseItem = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: keyof ExerciseCategories,
    exerciseIndex: number,
    exerciseItemIndex: number
  ) => {
    const { name, value } = e.target;
    const updatedExercise = exercisesNote[category][
      exerciseIndex
    ] as MultipleExerciseItem;
    if (typeof value !== "string") {
      updatedExercise.exercises[exerciseItemIndex][name] = value;
      updatePhaeroNote(updatedExercise.exercises[exerciseItemIndex]);
      return;
    }
    updatedExercise.exercises[exerciseItemIndex][name] = value.startsWith("0")
      ? value.replace(/^0+/, "")
      : value;
    updatePhaeroNote(updatedExercise.exercises[exerciseItemIndex]);
  };
  const toggleOpen = (category: string) => {
    if (category === openExerciseType) {
      setOpenExerciseType(null);
      return;
    }
    setOpenExerciseType(category);
  };
  const windowInnerWidth = window.innerWidth;
  const renderExercises = () => {
    const isMediumScreenSize = window.innerWidth > 960;

    const selectedCategory = openExerciseType;
    const theme = useTheme();
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={isMediumScreenSize && selectedCategory ? 6 : 12}>
          <Paper elevation={2} className="flex justify-center">
            <List
              sx={{
                width: "100%",
                borderRadius: "6px",
                maxWidth: windowInnerWidth - 20,
                bgcolor: "background.paper",
                paddingBottom: "0px",
                paddingTop: "0px",
              }}
              component="nav"
              aria-labelledby="nested-list-subheader"
            >
              {Object.keys(exercisesNote)
                .filter((key) => {
                  if (!isMediumScreenSize) return true;
                  else if (key === selectedCategory) return false;
                  return true;
                })
                .map((category, index) => (
                  <div key={index}>
                    <ListItemButton
                      sx={{ paddingLeft: "10px", display: "flex" }}
                      alignItems="center"
                      onClick={() => toggleOpen(category)}
                    >
                      <ListItemIcon>
                        <Box
                          component="div"
                          display="flex"
                          width={"70px"}
                          alignItems="center"
                        >
                          {getIconFromType(category, theme)}

                          <div className="flex items-center justify-center rounded-full flex-shrink-0 aspect-square w-6 h-6 text-sm border-2 ml-1">
                            {
                              exercisesNote[
                                category as keyof ExerciseCategories
                              ].length
                            }
                          </div>
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        sx={{ paddingLeft: "10px" }}
                        primary={mapKeys(category)}
                      />
                      {!isMediumScreenSize && (
                        <FontAwesomeIcon
                          className={`${category === selectedCategory ? "rotate-180" : ""
                            }`}
                          icon={faAngleUp}
                        />
                      )}
                    </ListItemButton>
                    <Divider />
                    {!isMediumScreenSize && (
                      <Collapse
                        in={category === openExerciseType}
                        timeout="auto"
                        unmountOnExit
                      >
                        <List
                          component="div"
                          disablePadding
                          sx={{ overflowY: "auto", maxHeight: "60vh" }}
                        >
                          {exercisesNote[
                            category as keyof ExerciseCategories
                          ].sort((a, b) => (a.name > b.name ? 1 : -1)).map((exercise, index) => (
                            <React.Fragment key={index}>
                              {exercise.exercises ? (
                                <MultipleExerciseDisplay
                                  multipleExerciseItem={
                                    exercise as MultipleExerciseItem
                                  }
                                  deleteExercise={deleteExercise}
                                  handleChange={(e, itemIndex: number) =>
                                    handleChangeMultipleExerciseItem(
                                      e,
                                      category as keyof ExerciseCategories,
                                      index,
                                      itemIndex
                                    )
                                  }
                                  mapKeyToLabel={mapKeyToLabel}
                                  duplicateExercise={addExercise}
                                  exercise={{} as ExerciseItem} // dummy, because we share interface as ExerciseDisplay is used inside Multiple
                                />
                              ) : (
                                <WrappedExerciseDisplay

                                  exercise={exercise as ExerciseItem}
                                  deleteExercise={deleteExercise}
                                  handleChange={(e) =>
                                    handleChangeExerciseItem(
                                      e,
                                      category as keyof ExerciseCategories,
                                      index
                                    )
                                  }
                                  duplicateExercise={addExercise}
                                  mapKeyToLabel={mapKeyToLabel}
                                />
                              )}
                            </React.Fragment>
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </div>
                ))}
            </List>
          </Paper>
        </Grid>
        {isMediumScreenSize && selectedCategory && (
          <Grid item xs={12} md={6}>
            <Paper elevation={2} className="flex justify-center">
              <List
                sx={{
                  overflowY: "auto",
                  maxHeight: "60vh",
                  width: "100%",
                  borderRadius: "6px",
                  bgcolor: "background.paper",
                }}
                component="div"
                disablePadding
              >
                {" "}
                <ListItemIcon>
                  <Box
                    component="div"
                    display="flex"
                    width={"50px"}
                    justifyContent={"space-between"}
                    alignItems="center"
                    sx={{ paddingLeft: "10px" }}
                  >
                    {
                      getIconFromType(
                        selectedCategory as string,
                        theme
                      )
                    }
                  </Box>{" "}
                  <ListItemText
                    sx={{ paddingLeft: "10px" }}
                    primary={mapKeys(selectedCategory)}
                  />
                </ListItemIcon>
                {exercisesNote[
                  selectedCategory as keyof ExerciseCategories
                ].sort((a, b) => (a.name > b.name ? 1 : -1)).map((exercise, index) => (
                  <React.Fragment key={index}>
                    {exercise.exercises ? (
                      <MultipleExerciseDisplay
                        multipleExerciseItem={exercise as MultipleExerciseItem}
                        deleteExercise={deleteExercise}
                        handleChange={(e, itemIndex) =>
                          handleChangeMultipleExerciseItem(
                            e,
                            selectedCategory as keyof ExerciseCategories,
                            index,
                            itemIndex
                          )
                        }
                        mapKeyToLabel={mapKeyToLabel}
                        duplicateExercise={addExercise}
                        exercise={{} as ExerciseItem} // dummy, because we share interface as ExerciseDisplay is used inside Multiple
                      />
                    ) : (
                      <WrappedExerciseDisplay
                        exercise={exercise as ExerciseItem}
                        deleteExercise={deleteExercise}
                        handleChange={(e) =>
                          handleChangeExerciseItem(
                            e,
                            selectedCategory as keyof ExerciseCategories,
                            index
                          )
                        }
                        duplicateExercise={addExercise}
                        mapKeyToLabel={mapKeyToLabel}
                      />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
        )}
      </Grid>
    );
  };
  const [currExerciseDiagram, setCurrExerciseDiagram] =
    useState<DiagramDataType | null>(null);
  const [filteredExerciseDiagrams, setFilteredExerciseDiagrams] = useState<
    DiagramDataType[] | undefined
  >();
  const getExerciseDiagramsBasedOnAddedExercises = () => {
    const exerciseNames = Object.keys(
      entryData.result.Exercise.Exercises["Bodyweight Exercises"]
    )
      .concat(
        Object.keys(entryData.result.Exercise.Exercises["Cardio Exercises"])
      )
      .concat(
        Object.keys(
          entryData.result.Exercise.Exercises["Weight Lifting Exercises"]
        )
      )
      .concat(
        Object.keys(entryData.result.Exercise.Exercises["Other Exercises"])
      );
    const diagramTitleIncludesExerciseName = (diagram: DiagramDataType) => {
      return exerciseNames.some((exerciseName) => {
        return diagram.title.includes(exerciseName);
      });
    };
    const filteredExerciseDiagramData = exerciseDiagramData?.filter(
      (diagram) => {
        return diagramTitleIncludesExerciseName(diagram);
      }
    );
    setCurrExerciseDiagram(
      filteredExerciseDiagramData ? filteredExerciseDiagramData[0] : null
    );
    setFilteredExerciseDiagrams(filteredExerciseDiagramData);
    return filteredExerciseDiagramData;
  };
  const incrementExerciseDiagramIndex = () => {
    if (!filteredExerciseDiagrams || !currExerciseDiagram) return;
    const currIndex = filteredExerciseDiagrams.indexOf(currExerciseDiagram);
    const nextIndex = (currIndex + 1) % filteredExerciseDiagrams.length;
    setCurrExerciseDiagram(filteredExerciseDiagrams[nextIndex]);
  };
  const decrementExerciseDiagramIndex = () => {
    if (!filteredExerciseDiagrams || !currExerciseDiagram) return;
    const currIndex = filteredExerciseDiagrams.indexOf(currExerciseDiagram);
    const nextIndex =
      (currIndex - 1 + filteredExerciseDiagrams.length) %
      filteredExerciseDiagrams.length;
    setCurrExerciseDiagram(filteredExerciseDiagrams[nextIndex]);
  };
  useEffect(() => {
    getExerciseDiagramsBasedOnAddedExercises();
  }, [entryData.result.Exercise.Exercises, exerciseDiagramData]);

  const [accurateStepData, setAccurateStepData] = useState<
    DiagramDataType | undefined
  >();
  useEffect(() => {
    setAccurateStepData(stepsData);
  }, [stepsData]);
  const handleUpdateToStepsData = (currDaySteps: number) => {
    if (!accurateStepData) return;
    const updatedStepsData = {
      ...accurateStepData,
    };
    updatedStepsData.data[updatedStepsData.data.length - 1] = {
      date: updatedStepsData.data[updatedStepsData.data.length - 1]["date"],
      Steps: currDaySteps,
    };
    setAccurateStepData(updatedStepsData);
  };
  const mapExerciseKeys = (key: string) => {
    const words = key.split(" ");
    if (words.length > 1) {
      const lastWord = words.pop();
      return mapExercises(words.join(" ")) + " " + mapKeys(lastWord ?? "");
    } else {
      return mapKeys(key);
    }
  };
  const theme = useTheme();
  return (
    <div className="mx-auto" style={{ marginTop: "0.25rem" }}>
      <Typography variant="h4" className="pb-2 flex justify-center"> {mapKeys("Exercise")}</Typography>
      <Grid
        container
        spacing={1}
        sx={{
          maxWidth: "98vw",
          paddingRight: 1,
          maxHeight: "80vh",
          paddingBottom: "20px",
          overflowY: "auto",
          marginX: "auto",
        }}
      >
        <Grid item xs={12} md={12}>
          <div>{renderExercises()}</div>
        </Grid>
        <Grid item xs={12} md={6}>
          {!viewOnly && exerciseList && (
            <div>
              <SearchExercises
                exerciseList={exerciseList}
                onAddExercise={addExercise}
              />
            </div>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <div>
            <div
              onMouseDown={() => setIsEmblaActive(false)}
              onMouseUp={() => setIsEmblaActive(true)}
              onTouchStart={() => setIsEmblaActive(false)}
              onTouchEnd={() => setIsEmblaActive(true)}
            >
              <RangeSlider
                viewOnly={viewOnly}
                value={entryData.result.Exercise.Steps}
                heading={"Steps"}
                range={[0, 30000]}
                handleSliderChange={(newValue: number) => {
                  handleUpdateToStepsData(newValue);
                  handleSliderChange(newValue, "steps");
                }}
                markStepSize={5000}
                icon={<Icon path={mdiRun} size={0.8} color={theme.palette.primary.main} />}
              />
            </div>
          </div>
        </Grid>
        {!viewOnly && (
          <>
            {currExerciseDiagram && (
              <Grid item xs={12} md={6}>
                <Paper>
                  <Typography
                    variant="h6"
                    className="flex pt-2 pl-4 flex-col justify-center items-center"
                  >

                    {mapExerciseKeys(currExerciseDiagram.title)}

                    <div className="flex justify-center gap-2">
                      <Button onClick={() => decrementExerciseDiagramIndex()} variant="outlined">
                        {mapKeys("Previous")}
                      </Button>
                      <Button onClick={() => incrementExerciseDiagramIndex()} variant="outlined">
                        {mapKeys("Next")}
                      </Button>
                    </div>
                  </Typography>
                  <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
                    <UniversalChart
                      timeframe={7}
                      diagramData={currExerciseDiagram}
                    />
                  </div>
                </Paper>
              </Grid>
            )}
            {stepsData && !viewOnly && (
              <Grid item xs={12} md={6}>
                <Paper>
                  <Typography variant="h6" className="flex pt-2 pl-4">
                    {mapKeys("Steps")}
                  </Typography>
                  <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
                    <UniversalChart
                      timeframe={7}
                      diagramData={accurateStepData}
                    />
                  </div>
                </Paper>
              </Grid>
            )}
          </>
        )}
      </Grid>
    </div>
  );
}

export default EditExercise;
