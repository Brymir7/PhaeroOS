import {
  Button,
  Collapse,
  Dialog,
  DialogActions,
  Divider,
  Grow,
  IconButton,
  Input,
  InputAdornment,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useContext, useEffect, useRef, useState } from "react";
import { EntryData, Nutrients } from "../../../pages/EditEntryPage";
import { Language, MapKeysContext } from "../../contexts/MapKeysContext";
import { TransitionGroup } from "react-transition-group";
import { AnimatedCheckbox } from "../../utils/Buttons";
import {
  useFormattedFoodName,
  useNumberValidation,
  useWindowWidth,
} from "../../utils/CustomHooks";
import React from "react";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FoodStatsDialog from "./FoodStatsDialog";
import { NutrientValues } from "./foodTypes";
// @ts-ignore
import PhaeroCompanion from "/Phaero.png";
import Close from "@mui/icons-material/Close";
interface EditData {
  [key: string]: {
    Nutrients: {
      Macros: {
        [key: string]: [number | string, string];
      };
      Micros: {
        [key: string]: [number | string, string];
      };
      StatsFrom?: string;
    };
    editName: string;
    caloriesOnly: boolean;
    portionSize: number | string;
  };
}
interface Props {
  data: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  handleCreateCustomFood: (
    foodValues: { [key: string]: number | string },
    portionSize: number
  ) => void;
  addFoodToList: (foodName: string, foodValues: Nutrients) => void;
}
const NotFoundFoodsDialog = ({
  data,
  updateEntryData,
  handleCreateCustomFood,
  addFoodToList,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<EditData | undefined>(undefined);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(true);
  const [totalLength, setTotalLength] = useState<number>(0);
  const order = ["calories", "fat", "carbs", "sugar", "protein"];
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { language } = useContext(MapKeysContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatsDialogOpen, setSearchStatsDialogOpen] = useState(false);
  const hasModifiedNutrients = useRef(false);
  const currentlyEditingKey = useRef<string | null>(null);
  const openSearchStatsDialog = (key: string) => {
    if (editData === undefined) return;
    setSearchTerm(editData[key].editName);
    currentlyEditingKey.current = key;
    setSearchStatsDialogOpen(true);
  };
  const formatFoodName = useFormattedFoodName();
  useEffect(() => {
    if (Object.keys(data.result.Food["Not found foods"]).length > 0) {
      setOpen(true);
    }
    const newEditData: EditData = {};
    Object.entries(data.result.Food["Not found foods"])
      .filter(([key]) => key.length > 0)
      .forEach(([key, value]) => {
        newEditData[key] = {
          Nutrients: {
            ...value,
          },
          editName: key,
          caloriesOnly: false,
          portionSize: value.Macros.amount[0],
        };
      });
    setTotalLength(Object.keys(data.result.Food["Not found foods"]).length);
    setEditData(newEditData);
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      setTimeout(() => {
        setShouldAnimate(true);
      }, 200);
    }
  }, [shouldAnimate]);

  const handleNameChange = (key: string, name: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      [key]: {
        ...editData[key],
        editName: name,
      },
    });
  };

  const handleCaloriesOnlyChange = (key: string) => {
    if (!editData) return;

    setEditData({
      ...editData,
      [key]: {
        ...editData[key],
        caloriesOnly: !editData[key].caloriesOnly,
      },
    });
  };

  const handlePortionSizeChange = (key: string, value: number | string) => {
    if (!editData) return;

    setEditData({
      ...editData,
      [key]: {
        ...editData[key],
        portionSize: value,
      },
    });
  };

  const handleNutrientChange = (
    key: string,
    nutrient: string,
    value: number | string
  ) => {
    if (!editData) return;

    hasModifiedNutrients.current = true;
    if (nutrient === "calories" || nutrient === "amount") {
      setEditData({
        ...editData,
        [key]: {
          ...editData[key],
          Nutrients: {
            ...editData[key].Nutrients,
            Macros: {
              ...editData[key].Nutrients.Macros,
              [nutrient]: [value, "kcal"],
            },
          },
        },
      });
      return;
    }
    if (nutrient === "carbs") {
      setEditData({
        ...editData,
        [key]: {
          ...editData[key],
          Nutrients: {
            ...editData[key].Nutrients,
            Macros: {
              ...editData[key].Nutrients.Macros,
              [nutrient]: [value, editData[key].Nutrients.Macros[nutrient][1]],
              ["sugar"]: [
                Math.min(
                  editData[key].Nutrients.Macros["sugar"][0] as number,
                  Number(value)
                ),
                editData[key].Nutrients.Macros["sugar"][1],
              ],
            },
          },
        },
      });
    } else if (nutrient === "sugar") {
      setEditData({
        ...editData,
        [key]: {
          ...editData[key],
          Nutrients: {
            ...editData[key].Nutrients,
            Macros: {
              ...editData[key].Nutrients.Macros,
              [nutrient]: [value, editData[key].Nutrients.Macros[nutrient][1]],
              ["carbs"]: [
                Math.max(
                  editData[key].Nutrients.Macros["carbs"][0] as number,
                  Number(value)
                ),
                editData[key].Nutrients.Macros["carbs"][1],
              ],
            },
          },
        },
      });
    } else {
      setEditData({
        ...editData,
        [key]: {
          ...editData[key],
          Nutrients: {
            ...editData[key].Nutrients,
            Macros: {
              ...editData[key].Nutrients.Macros,
              [nutrient]: [value, editData[key].Nutrients.Macros[nutrient][1]],
            },
          },
        },
      });
    }
  };

  const generateSearchQuery = (key: string) => {
    if (language === Language.German) {
      return `https://www.google.com/search?q=${encodeURIComponent(
        `${key} Nährwerte`
      )}`;
    }
    return `https://www.google.com/search?q=${encodeURIComponent(
      `${key} Nutrient Values`
    )}`;
  };

  const handleDeleteFood = () => {
    if (!editData) return;
    const key = Object.keys(editData)[0];
    const updatedData = JSON.parse(JSON.stringify(data));
    const updatedEditData = JSON.parse(JSON.stringify(editData));
    delete updatedEditData[key];
    delete updatedData.result.Food["Not found foods"][key];
    updateEntryData(updatedData);
    if (Object.keys(updatedEditData).length === 0) {
      setOpen(false);
    } else {
      setEditData(updatedEditData);
    }
    setShouldAnimate(false);
  };

  const handleAddFood = () => {
    if (!editData) return;
    const foodData = Object.values(editData)[0];
    if (!foodData.editName) {
      handleAllErrors(mapKeys("Food name cannot be empty!"));
      return;
    }
    const foodDict: { [key: string]: string | number } = {
      name: foodData.editName,
      amount: foodData.portionSize,
      fat: 0,
      carbs: 0,
      sugar: 0,
      protein: 0,
    };

    if (!foodData.caloriesOnly) {
      order.forEach((key) => {
        foodDict[key] = Number(foodData.Nutrients.Macros[key][0]);
      });
      const relativeFoodValues: { [key: string]: [number, string] } = {
        amount: [Number(foodData.portionSize), "g"],
      };
      Object.keys(foodData.Nutrients.Macros).forEach((key) => {
        if (key === "amount") return;
        relativeFoodValues[key] = [
          Number(foodData.Nutrients.Macros[key][0]),
          foodData.Nutrients.Macros[key][1],
        ];
      });
      relativeFoodValues["calories"] = [
        relativeFoodValues["fat"][0] * 9 +
        relativeFoodValues["carbs"][0] * 4 +
        relativeFoodValues["protein"][0] * 4,
        "kcal",
      ];
      addFoodToList(foodData.editName, {
        Macros: relativeFoodValues,
        Micros: {},
      });
    } else {
      addFoodToList(foodData.editName, {
        Macros: {
          amount: [Number(foodData.portionSize), "g"],
          calories: [Number(foodData.Nutrients.Macros.calories[0]), "kcal"],
          fat: [0, "g"],
          carbs: [0, "g"],
          sugar: [0, "g"],
          protein: [0, "g"],
        },
        Micros: {},
      });
      foodDict["calories"] = foodData.Nutrients.Macros["calories"][0];
    }
    handleCreateCustomFood(foodDict, Number(foodData.portionSize));
    handleDeleteFood();
  };
  // const handleAddAllFoods = () => {
  //   if (!editData) return;
  //   Object.keys(editData).forEach((key) => {
  //     const foodData = editData[key];
  //     if (!foodData.editName) {
  //       handleAllErrors(mapKeys("Food name cannot be empty!"));
  //       return;
  //     }

  //     const foodDict: { [key: string]: string | number } = {
  //       name: foodData.editName,
  //       amount: foodData.portionSize,
  //       fat: 0,
  //       carbs: 0,
  //       sugar: 0,
  //       protein: 0,
  //     };

  //     if (!foodData.caloriesOnly) {
  //       order.forEach((key) => {
  //         foodDict[key] = Number(foodData.Nutrients.Macros[key][0]);
  //       });
  //       const relativeFoodValues: { [key: string]: [number, string] } = {
  //         amount: [Number(foodData.portionSize), "g"],
  //       };
  //       Object.keys(foodData.Nutrients.Macros).forEach((key) => {
  //         if (key === "amount") return;
  //         relativeFoodValues[key] = [
  //           Number(foodData.Nutrients.Macros[key][0]),
  //           foodData.Nutrients.Macros[key][1],
  //         ];
  //       });
  //       relativeFoodValues["calories"] = [
  //         relativeFoodValues["fat"][0] * 9 +
  //           relativeFoodValues["carbs"][0] * 4 +
  //           relativeFoodValues["protein"][0] * 4,
  //         "kcal",
  //       ];
  //       addFoodToList(foodData.editName, {
  //         Macros: relativeFoodValues,
  //         Micros: {},
  //       });
  //     } else {
  //       addFoodToList(foodData.editName, {
  //         Macros: {
  //           amount: [Number(foodData.portionSize), "g"],
  //           calories: [
  //             (Number(foodData.Nutrients.Macros.calories[0]) *
  //               Number(foodData.portionSize)) /
  //               100,
  //             "kcal",
  //           ],
  //           fat: [0, "g"],
  //           carbs: [0, "g"],
  //           sugar: [0, "g"],
  //           protein: [0, "g"],
  //         },
  //         Micros: {},
  //       });
  //       foodDict["calories"] = foodData.Nutrients.Macros["calories"][0];
  //     }
  //     handleCreateCustomFood(foodDict, Number(foodData.portionSize));
  //   });
  //   const updatedData = JSON.parse(JSON.stringify(data));
  //   updatedData.result.Food["Not found foods"] = {};
  //   updateEntryData(updatedData);
  //   setOpen(false);
  // };
  const theme = useTheme();
  const windowWidth = useWindowWidth();
  const bubbleStyles = {
    display: "inline-flex",
    padding: "1em",
    paddingBottom: "0.5em",
    marginBottom: "10px",
    borderRadius: "calc(1em + 1.5em)/1em",
    borderInline: "1.5em solid #0000",
    mask: "radial-gradient(100% 100% at var(--_p) 0, #0000 99%, #000 102%) var(--_p) 100% / 1.5em 1.5em no-repeat, linear-gradient(#000 0 0) padding-box",
    background: theme.palette.primary.main,
    color: "white",
    maxWidth: windowWidth > 768 ? "72%" : "90%",
    alignItems: "center",
    flexDirection: "column" as const,
    fontSize: windowWidth < 768 ? "15px" : "18px",
  };
  const leftBubbleStyles = {
    ...bubbleStyles,
    "--_p": "0",
    borderBottomLeftRadius: "0 0",
    alignSelf: "start",
  };
  const PortionSizeExplanation = ({ isVisible, onClose }: { isVisible: boolean, onClose: () => void }) => {
    if (!isVisible) return null;
    return (
      <div className="flex items-end mt-1 mb-1">
        <div className="flex-shrink-0 mr-1 ">
          <img
            src={PhaeroCompanion}
            alt="Phaero Companion"
            style={{ width: "20px", height: "20px", borderRadius: 6 }}
          />
        </div>
        <Paper
          style={{
            ...leftBubbleStyles,
            fontSize: "12px",
            padding: "0.3em 0.5em",
            maxWidth: "calc(100% - 30px)",
            marginBottom: 0,
          }}
        >
          <div className="flex justify-between items-start w-full">
            <p>
              {mapKeys("In the future Phaero will remember the portion size. 5 Toasts = 5 times portion size")}
            </p>
            <IconButton
              size="small"
              onClick={onClose}
              style={{ marginLeft: "4px", marginTop: "-4px", padding: "2px" }}
            >
              <Close fontSize="small" style={{ fontSize: "14px", color: "white" }} />
            </IconButton>
          </div>
        </Paper>
      </div>
    );
  };
  const [showPortionSizeExplanation, setShowPortionSizeExplanation] =
    useState(true);

  return (
    <div>
      {searchStatsDialogOpen && (
        <FoodStatsDialog
          open={searchStatsDialogOpen}
          onClose={() => setSearchStatsDialogOpen(false)}
          initialSearchTerm={searchTerm}
          onAddFood={(food_name: string, stats: NutrientValues) => {
            if (!editData) return;
            const alwaysValidKeyToEdit = currentlyEditingKey.current
              ? currentlyEditingKey.current
              : "";
            if (
              alwaysValidKeyToEdit === undefined ||
              alwaysValidKeyToEdit === ""
            )
              return;
            editData[alwaysValidKeyToEdit].Nutrients.Macros.calories = [
              stats.calories,
              "kcal",
            ];
            editData[alwaysValidKeyToEdit].Nutrients.Macros.amount = [
              Object.values(editData)[0].portionSize,
              "g",
            ];
            order.forEach((key) => {
              editData[alwaysValidKeyToEdit].Nutrients.Macros[key] = [
                stats[key],
                "g",
              ];
            });
            editData[alwaysValidKeyToEdit].Nutrients.StatsFrom = food_name;
          }}
        ></FoodStatsDialog>
      )}
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            setOpen(false);
          }
        }}
        disableEscapeKeyDown
      >
        <div className="flex flex-col p-3">
          <div className="pt-2 space-y-1 flex gap-2 justify-center">
            <div className="flex items-end min-w-[50px] max-w-[50px]">
              <img
                src={PhaeroCompanion}
                alt="Phaero Companion"
                style={{ width: "50px", height: "50px", borderRadius: 17 }}
              />
            </div>
            <Paper style={leftBubbleStyles}>
              <p className="">
                {mapKeys(
                  "We want to make sure that our nutrient data is accurate."
                )}
              </p>
            </Paper>
            {/* <p>
              {mapKeys(
                "Once approved, this item will be automatically recognized in the future."
              )}
            </p> */}
          </div>
          <div className="relative mx-auto mt-1 ">
            {editData && Object.keys(editData).length > 0 && (
              <>
                {Object.keys(data.result.Food["Not found foods"]).map(
                  (key, index) =>
                    key && (
                      <Grow
                        key={key}
                        className=" top-0"
                        in={0 === index && shouldAnimate}
                      >
                        <Paper
                          className="flex flex-col flex-grow mx-auto"
                          elevation={4}
                          sx={{
                            my: 2,
                            width: 260,
                          }}
                        >
                          <List>
                            <ListItem sx={{ pl: 1 }}>
                              <TextField
                                label={mapKeys("Name")}
                                spellCheck={false}
                                value={formatFoodName(editData[key].editName)}
                                onChange={(e) =>
                                  handleNameChange(key, e.target.value)
                                }
                                error={editData[key].editName === ""}
                                helperText={
                                  editData[key].editName === ""
                                    ? mapKeys("Food name cannot be empty!")
                                    : ""
                                }
                                variant="standard"
                                fullWidth
                                multiline
                                maxRows={2}
                              />
                            </ListItem>
                            <ListItem disablePadding>
                              <ListItemButton
                                sx={{ pl: 1 }}
                                onClick={() => handleCaloriesOnlyChange(key)}
                              >
                                <ListItemText
                                  primary={mapKeys("Only calories")}
                                />
                                <AnimatedCheckbox
                                  extraClasses="mr-10 border-gray-400"
                                  isChecked={editData[key].caloriesOnly}
                                />
                              </ListItemButton>
                            </ListItem>
                            <ListItem sx={{ pl: 1 }}>
                              <ListItemText
                                primary={mapKeys("Size 1 portion")}
                              />
                              <Input
                                spellCheck={false}
                                placeholder={mapKeys("Portion size")}
                                value={editData[key].portionSize}
                                onChange={(e) => {
                                  const newValue = useNumberValidation(
                                    e.target.value
                                  );
                                  if (newValue === undefined) {
                                    return;
                                  }
                                  handlePortionSizeChange(key, newValue);
                                }}
                                endAdornment={
                                  <InputAdornment position="end">
                                    g
                                  </InputAdornment>
                                }
                                sx={{
                                  borderRadius: "4px",
                                  px: 1,
                                  width: "100px",
                                  border: "1px solid #ddd",
                                  "&::before": {
                                    transform: "scaleX(0)",
                                    left: "2.5px",
                                    right: "2.5px",
                                    bottom: 0,
                                    top: "unset",
                                    transition:
                                      "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
                                    borderRadius: 0,
                                  },
                                  "&:focus-within::before": {
                                    transform: "scaleX(1)",
                                  },
                                }}
                              />
                            </ListItem>{" "}
                            <PortionSizeExplanation
                              isVisible={showPortionSizeExplanation}
                              onClose={() =>
                                setShowPortionSizeExplanation(false)
                              }
                            />
                          </List>
                          <Divider />
                          <List>
                            {editData[key].Nutrients.StatsFrom ? (
                              <ListItem sx={{ pr: 0, pl: 0, py: 0 }}>
                                <Paper className=" pl-2 flex flex-col w-full pb-1">
                                  <Typography>
                                    {mapKeys("Stats from")}:{" "}
                                  </Typography>
                                  <Typography sx={{ fontSize: "0.875rem" }}>
                                    {formatFoodName(
                                      editData[key].Nutrients
                                        .StatsFrom as string
                                    )}
                                  </Typography>
                                </Paper>
                              </ListItem>
                            ) : (
                              <Typography sx={{ pl: 1, fontSize: "0.875rem" }}>
                                {mapKeys("No stats found for this food.")}
                              </Typography>
                            )}
                            <Typography className="flex justify-center">
                              {mapKeys("Search")}
                            </Typography>
                            <ListItem className="flex gap-2">
                              <Button
                                className="flex justify-center  w-28 h-10"
                                variant="outlined"
                              >
                                <Link
                                  href={generateSearchQuery(
                                    editData[key].editName
                                  )}
                                  target="_blank" // Open in a new tab
                                  rel="noopener noreferrer" // Security for opening links in a new tab
                                  className="cursor-pointer"
                                >
                                  <FontAwesomeIcon
                                    icon={faSearch}
                                    className="pr-1"
                                  />
                                  {mapKeys("browse")}
                                </Link>
                              </Button>
                              <Button
                                className="flex justify-center  w-24 h-10"
                                variant="outlined"
                              >
                                <Button
                                  onClick={() => {
                                    openSearchStatsDialog(key);
                                  }}
                                  className="flex items-center justify-center"
                                >
                                  <FontAwesomeIcon icon={faSearch} />
                                  <span className="ml-2">{"DB"}</span>
                                </Button>
                              </Button>
                            </ListItem>
                            <ListItem sx={{ pl: 1, pr: 0, py: 2 }}>
                              <ListItemText primary={mapKeys("Per 100g")} />
                            </ListItem>
                            <TransitionGroup
                              childFactory={(child) => {
                                return React.cloneElement(child, {
                                  // Modify the exiting child's style to decrease opacity
                                  onExit: (node: {
                                    style: { opacity: string };
                                  }) => {
                                    node.style.opacity = "0";
                                  },
                                  // Apply additional modifications as needed
                                });
                              }}
                            >
                              {order
                                .filter(
                                  (
                                    nutrient //key in foodValues
                                  ) =>
                                    (nutrient === "calories" &&
                                      editData[key].caloriesOnly) ||
                                    (nutrient !== "calories" &&
                                      !editData[key].caloriesOnly)
                                )
                                .map((nutrient) => (
                                  <Collapse appear key={key + nutrient}>
                                    <ListItem
                                      disablePadding
                                      sx={{
                                        pr: 2,
                                      }}
                                    >
                                      <ListItemText
                                        primary={mapKeys(nutrient)}
                                        primaryTypographyProps={{
                                          sx: {
                                            fontSize: "14px",
                                            textTransform: "none",
                                            pl: 1,
                                          },
                                        }}
                                      />
                                      <Input
                                        spellCheck={false}
                                        placeholder={mapKeys(nutrient)}
                                        value={
                                          editData[key].Nutrients.Macros[
                                          nutrient
                                          ][0]
                                        }
                                        onChange={(e) => {
                                          const newValue = useNumberValidation(
                                            e.target.value
                                          );
                                          if (newValue === undefined) {
                                            return;
                                          }
                                          handleNutrientChange(
                                            key,
                                            nutrient,
                                            newValue
                                          );
                                        }}
                                        sx={{
                                          borderRadius: "4px",
                                          px: 1,
                                          width: "100px",
                                          border: "1px solid #ddd",
                                          "&::before": {
                                            transform: "scaleX(0)",
                                            left: "2.5px",
                                            right: "2.5px",
                                            bottom: 0,
                                            top: "unset",
                                            transition:
                                              "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
                                            borderRadius: 0,
                                          },
                                          "&:focus-within::before": {
                                            transform: "scaleX(1)",
                                          },
                                        }}
                                        endAdornment={
                                          <InputAdornment position="end">
                                            {editData[key].Nutrients.Macros[
                                              nutrient
                                            ][1].toLowerCase()}
                                          </InputAdornment>
                                        }
                                      />
                                    </ListItem>
                                  </Collapse>
                                ))}
                            </TransitionGroup>
                          </List>
                        </Paper>
                      </Grow>
                    )
                )}
              </>
            )}
          </div>
        </div>
        <DialogActions>
          <Button
            onClick={() => {
              handleDeleteFood();
            }}
            fullWidth
          >
            {mapKeys("Ignore")}
          </Button>
          <Button
            onClick={() => {
              handleAddFood();
            }}
            fullWidth
            variant="contained"
          >
            {mapKeys("Add")}
          </Button>

          {editData && (
            <LinearProgress
              variant="determinate"
              value={
                (totalLength - Object.keys(editData).length) *
                (100 / totalLength)
              }
            />
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NotFoundFoodsDialog;
