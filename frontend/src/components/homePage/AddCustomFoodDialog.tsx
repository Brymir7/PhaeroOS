import {
  Button,
  Collapse,
  Dialog,
  Divider,
  Grow,
  Input,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Snackbar,
  SnackbarContent,
  Paper,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import {
  useFormattedFoodName,
  useNumberValidation,
} from "../utils/CustomHooks";
import FoodStatsDialog from "../editEntryPage/food/FoodStatsDialog";
import { NutrientValues } from "../editEntryPage/food/foodTypes";
import { AnimatedCheckbox } from "../utils/Buttons";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { TransitionGroup } from "react-transition-group";
import React from "react";
import { useApi } from "../../modules/apiAxios";
interface CustomFoodData {
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
}

interface Props {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  addToNote: (food: { name: string; grams: number }) => void;
}

const AddCustomFoodDialog = ({ open, setOpen, addToNote }: Props) => {
  const [customFoodData, setCustomFoodData] = useState<
    CustomFoodData | undefined
  >(undefined);
  const [shouldAnimate, setShouldAnimate] = useState<boolean>(true);
  const [wantsToAddToNote, setWantsToAddToNote] = useState<boolean>(false);
  const order = ["calories", "fat", "carbs", "sugar", "protein"];
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { language } = useContext(MapKeysContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatsDialogOpen, setSearchStatsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };
  const openSearchStatsDialog = () => {
    if (customFoodData === undefined) return;
    setSearchTerm(customFoodData.editName);
    setSearchStatsDialogOpen(true);
  };
  const formatFoodName = useFormattedFoodName();
  useEffect(() => {
    setCustomFoodData({
      Nutrients: {
        Macros: {
          calories: [0, "kcal"],
          fat: [0, "g"],
          carbs: [0, "g"],
          sugar: [0, "g"],
          protein: [0, "g"],
        },
        Micros: {},
      },
      editName: "",
      caloriesOnly: false,
      portionSize: 100,
    });
  }, []);

  useEffect(() => {
    if (!shouldAnimate) {
      setTimeout(() => {
        setShouldAnimate(true);
      }, 200);
    }
  }, [shouldAnimate]);

  const handleNameChange = (name: string) => {
    if (!customFoodData) return;
    setCustomFoodData({
      ...customFoodData,
      editName: name,
    });
  };

  const handleCaloriesOnlyChange = () => {
    if (!customFoodData) return;
    setCustomFoodData({
      ...customFoodData,
      caloriesOnly: !customFoodData.caloriesOnly,
    });
  };

  const handlePortionSizeChange = (value: number | string) => {
    if (!customFoodData) return;
    setCustomFoodData({
      ...customFoodData,
      portionSize: value,
    });
  };
  const api = useApi();
  const handleCreateCustomFood = (
    foodValues: { [key: string]: number | string },
    portionSize: number
  ) => {
    if (portionSize === 0) {
      handleAllErrors(mapKeys("Portion size cannot be 0!"));
      return;
    }
    const apiEndpoint = `/food/custom_foods/create/`;
    const data = { ...foodValues, portion_size: portionSize };
    api.post(apiEndpoint, data).catch((error) => {
      handleAllErrors(error);
    });
    setSearchTerm("");
  };
  const handleNutrientChange = (nutrient: string, value: number | string) => {
    if (!customFoodData) return;
    if (nutrient === "calories" || nutrient === "amount") {
      setCustomFoodData({
        ...customFoodData,
        Nutrients: {
          ...customFoodData.Nutrients,
          Macros: {
            ...customFoodData.Nutrients.Macros,
            [nutrient]: [value, "kcal"],
          },
        },
      });
      return;
    }
    if (nutrient === "carbs") {
      setCustomFoodData({
        ...customFoodData,
        Nutrients: {
          ...customFoodData.Nutrients,
          Macros: {
            ...customFoodData.Nutrients.Macros,
            [nutrient]: [value, customFoodData.Nutrients.Macros[nutrient][1]],
            sugar: [
              Math.min(
                customFoodData.Nutrients.Macros["sugar"][0] as number,
                Number(value)
              ),
              customFoodData.Nutrients.Macros["sugar"][1],
            ],
          },
        },
      });
    } else if (nutrient === "sugar") {
      setCustomFoodData({
        ...customFoodData,
        Nutrients: {
          ...customFoodData.Nutrients,
          Macros: {
            ...customFoodData.Nutrients.Macros,
            [nutrient]: [value, customFoodData.Nutrients.Macros[nutrient][1]],
            carbs: [
              Math.max(
                customFoodData.Nutrients.Macros["carbs"][0] as number,
                Number(value)
              ),
              customFoodData.Nutrients.Macros["carbs"][1],
            ],
          },
        },
      });
    } else {
      setCustomFoodData({
        ...customFoodData,
        Nutrients: {
          ...customFoodData.Nutrients,
          Macros: {
            ...customFoodData.Nutrients.Macros,
            [nutrient]: [value, customFoodData.Nutrients.Macros[nutrient][1]],
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

  const handleAddFood = () => {
    if (!customFoodData) return;
    if (!customFoodData.editName) {
      handleAllErrors(mapKeys("Food name cannot be empty!"));
      return;
    }
    const foodDict: { [key: string]: string | number } = {
      name: customFoodData.editName,
      amount: customFoodData.portionSize,
      fat: 0,
      carbs: 0,
      sugar: 0,
      protein: 0,
    };

    if (!customFoodData.caloriesOnly) {
      order.forEach((key) => {
        foodDict[key] = Number(customFoodData.Nutrients.Macros[key][0]);
      });
      const relativeFoodValues: { [key: string]: [number, string] } = {
        amount: [Number(customFoodData.portionSize), "g"],
      };
      Object.keys(customFoodData.Nutrients.Macros).forEach((key) => {
        if (key === "amount") return;
        relativeFoodValues[key] = [
          Number(customFoodData.Nutrients.Macros[key][0]),
          customFoodData.Nutrients.Macros[key][1],
        ];
      });
      relativeFoodValues["calories"] = [
        relativeFoodValues["fat"][0] * 9 +
        relativeFoodValues["carbs"][0] * 4 +
        relativeFoodValues["protein"][0] * 4,
        "kcal",
      ];
    } else {
      foodDict["calories"] = customFoodData.Nutrients.Macros["calories"][0];
    }
    handleCreateCustomFood(foodDict, Number(customFoodData.portionSize));
    setCustomFoodData({
      Nutrients: {
        Macros: {
          calories: [0, "kcal"],
          fat: [0, "g"],
          carbs: [0, "g"],
          sugar: [0, "g"],
          protein: [0, "g"],
        },
        Micros: {},
      },
      editName: "",
      caloriesOnly: false,
      portionSize: 100,
    });
    if (wantsToAddToNote) {
      addToNote({
        name: customFoodData.editName,
        grams: customFoodData.portionSize as number,
      });
    }
    setSnackbarOpen(true);
  };

  return (
    <div>
      {searchStatsDialogOpen && (
        <FoodStatsDialog
          open={searchStatsDialogOpen}
          onClose={() => setSearchStatsDialogOpen(false)}
          initialSearchTerm={searchTerm}
          onAddFood={(food_name: string, stats: NutrientValues) => {
            if (!customFoodData) return;
            customFoodData.Nutrients.Macros.calories = [stats.calories, "kcal"];
            customFoodData.Nutrients.Macros.amount = [
              customFoodData.portionSize,
              "g",
            ];
            order.forEach((key) => {
              customFoodData.Nutrients.Macros[key] = [stats[key], "g"];
            });
            customFoodData.Nutrients.StatsFrom = food_name;
          }}
        ></FoodStatsDialog>
      )}
      <Button onClick={() => setOpen(true)}>
        {mapKeys("Add custom food")}
      </Button>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            setOpen(false);
          }
        }}
        disableEscapeKeyDown
      >
        <div className="flex flex-col p-4">
          <Typography variant={"h5"}>{mapKeys("Add custom food")}</Typography>
          <div className="pt-2 space-y-1">
            <p>
              {mapKeys(
                "Once approved, this item will be automatically recognized in the future."
              )}
            </p>
          </div>
          <div className="relative mx-auto mt-4 ">
            {customFoodData && (
              <>
                <Grow in={shouldAnimate}>
                  <Paper
                    className="flex flex-col flex-grow mx-auto"
                    elevation={2}
                    sx={{ my: 2, width: 260 }}
                  >
                    <List>
                      <ListItem sx={{ pl: 1 }}>
                        <TextField
                          label={mapKeys("Name")}
                          spellCheck={false}

                          value={customFoodData.editName}
                          onChange={(e) => handleNameChange(e.target.value)}
                          error={customFoodData.editName === ""}
                          helperText={
                            customFoodData.editName === ""
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
                          onClick={handleCaloriesOnlyChange}
                        >
                          <ListItemText primary={mapKeys("Only calories")} />
                          <AnimatedCheckbox
                            extraClasses="mr-10 border-gray-400"
                            isChecked={customFoodData.caloriesOnly}
                          />
                        </ListItemButton>
                      </ListItem>
                      <ListItem sx={{ pl: 1 }}>
                        <ListItemText primary={mapKeys("Size 1 portion")} />
                        <Input
                          spellCheck={false}
                          placeholder={mapKeys("Portion size")}
                          value={customFoodData.portionSize}
                          onChange={(e) => {
                            const newValue = useNumberValidation(
                              e.target.value
                            );
                            if (newValue === undefined) {
                              return;
                            }
                            handlePortionSizeChange(newValue);
                          }}
                          endAdornment={
                            <InputAdornment position="end">g</InputAdornment>
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
                      </ListItem>
                    </List>
                    <Divider />
                    <List>
                      {customFoodData.Nutrients.StatsFrom ? (
                        <ListItem sx={{ pr: 0, pl: 0, py: 0 }}>
                          <Paper className="pl-2 flex flex-col w-full pb-1">
                            <Typography>{mapKeys("Stats from")}: </Typography>
                            <Typography sx={{ fontSize: "0.875rem" }}>
                              {formatFoodName(
                                customFoodData.Nutrients.StatsFrom as string
                              )}
                            </Typography>
                          </Paper>
                        </ListItem>
                      ) : (
                        <Typography sx={{ pl: 1, fontSize: "0.875rem" }}>
                          {mapKeys("No stats found for this food.")}
                        </Typography>
                      )}

                      <ListItem className="flex gap-2">
                        <Paper className="flex justify-center p-2 w-24 h-10">
                          <Link
                            href={generateSearchQuery(customFoodData.editName)}
                            target="_blank" // Open in a new tab
                            rel="noopener noreferrer" // Security for opening links in a new tab
                            className="cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faSearch} className="pr-2" />
                            {mapKeys("browse")}
                          </Link>
                        </Paper>
                        <Paper className="flex justify-center w-24 h-10">
                          <Button
                            onClick={openSearchStatsDialog}
                            className="flex items-center justify-center"
                          >
                            <FontAwesomeIcon icon={faSearch} />
                            <span className="ml-2">{"DB"}</span>
                          </Button>
                        </Paper>
                      </ListItem>
                      <ListItem sx={{ pl: 1, pr: 0, py: 2 }}>
                        <ListItemText primary={mapKeys("Per 100g")} />
                      </ListItem>
                      <TransitionGroup
                        childFactory={(child) => {
                          return React.cloneElement(child, {
                            // Modify the exiting child's style to decrease opacity
                            onExit: (node: { style: { opacity: string } }) => {
                              node.style.opacity = "0";
                            },
                            // Apply additional modifications as needed
                          });
                        }}
                      >
                        {order
                          .filter(
                            (nutrient) =>
                              (nutrient === "calories" &&
                                customFoodData.caloriesOnly) ||
                              (nutrient !== "calories" &&
                                !customFoodData.caloriesOnly)
                          )
                          .map((nutrient) => (
                            <Collapse appear key={nutrient}>
                              <ListItem disablePadding sx={{ pr: 2 }}>
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
                                    customFoodData.Nutrients.Macros[nutrient][0]
                                  }
                                  onChange={(e) => {
                                    const newValue = useNumberValidation(
                                      e.target.value
                                    );
                                    if (newValue === undefined) {
                                      return;
                                    }
                                    handleNutrientChange(nutrient, newValue);
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
                                      {customFoodData.Nutrients.Macros[
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
              </>
            )}
          </div>
        </div>
        <div className="flex justify-center items-center">
          <Checkbox
            checked={wantsToAddToNote}
            onChange={(e) => setWantsToAddToNote(e.target.checked)}
          ></Checkbox>{" "}
          <Typography>{mapKeys("Add to daily note")}</Typography>
        </div>
        <div className="flex w-full  justify-between mt-4">
          <Button
            onClick={() => {
              setOpen(false);
            }}
            sx={{
              paddingTop: "0.8rem",
              paddingBottom: "0.8rem",
              borderRadius: "0",
            }}
            fullWidth
          >
            {mapKeys("Close")}
          </Button>
          <div className="border-l" />
          <Button
            onClick={handleAddFood}
            sx={{
              paddingTop: "0.8rem",
              paddingBottom: "0.8rem",
              borderRadius: "0",
            }}
            fullWidth
          >
            {mapKeys("Add")}
          </Button>
        </div>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <SnackbarContent
          sx={{
            backgroundColor: "green",
            color: "white",
          }}
          message={mapKeys("Food added successfully!")}
        />
      </Snackbar>
    </div>
  );
};

export default AddCustomFoodDialog;
