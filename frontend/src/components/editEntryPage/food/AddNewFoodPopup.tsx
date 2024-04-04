import { useContext, useEffect, useState } from "react";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";
import { AnimatedCheckbox } from "../../utils/Buttons";
import { Language, MapKeysContext } from "../../contexts/MapKeysContext";
import {
  Button,
  Collapse,
  Dialog,
  Divider,
  Input,
  InputAdornment,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  useTheme,
} from "@mui/material";
import React from "react";
import { useNumberValidation } from "../../utils/CustomHooks";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Nutrients } from "../../../pages/EditEntryPage";
import { TransitionGroup } from "react-transition-group";
import FoodStatsDialog from "./FoodStatsDialog";
import { NutrientValues } from "./foodTypes";
import { Trash } from "iconsax-react";

type AddNewFoodPopupProps = {
  onConfirm: (
    foodValues: { [key: string]: number | string },
    portionSize: number
  ) => void;
  addToList: (foodName: string, foodValues: Nutrients) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  initialFoodName: string;
  foodNameList: string[];
  editCustomFoodValues:
  | { [key: string]: [number | string, string] }
  | undefined;
  deleteCustomFood: (name: string) => void;
  open: boolean;
  onBlur?: () => void;
};

function AddNewFoodPopup({
  setIsOpen,
  onConfirm,
  initialFoodName,
  addToList,
  foodNameList,
  editCustomFoodValues,
  deleteCustomFood,
  open,
  onBlur,
}: AddNewFoodPopupProps): JSX.Element {
  const [foodValues, setFoodValues] = useState<{
    [key: string]: [number | string, string];
  }>({});

  const customFoodIsCaloriesOnly = () => {
    if (editCustomFoodValues) {
      if (
        (editCustomFoodValues.calories[0] as number) > 0 &&
        editCustomFoodValues.fat[0] === 0 &&
        editCustomFoodValues.carbs[0] === 0 &&
        editCustomFoodValues.sugar[0] === 0 &&
        editCustomFoodValues.protein[0] === 0
      ) {
        return true;
      }
    }
    return false;
  };
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [caloriesOnlyView, setCaloriesOnlyView] = useState<boolean>(false);
  const [foodName, setFoodName] = useState<string>(initialFoodName);
  const [portionSize, setPortionSize] = useState<number | string>(
    editCustomFoodValues ? editCustomFoodValues.amount[0] : 100
  );
  const { mapKeys, language } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const order = ["calories", "fat", "carbs", "sugar", "protein"];
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
  useEffect(() => {
    if (!hasMounted) return;
    if (customFoodIsCaloriesOnly()) {
      setCaloriesOnlyView(true);
    } else if (caloriesOnlyView) {
      setFoodValues({
        calories: [calculateCalories(), "kcal"],
      });
    } else if (editCustomFoodValues) {
      setFoodValues(editCustomFoodValues);
    } else {
      setFoodValues({
        fat: [0, "g"],
        carbs: [0, "g"],
        sugar: [0, "g"],
        protein: [0, "g"],
      });
    }
  }, [caloriesOnlyView]);

  useEffect(() => {
    if (editCustomFoodValues && customFoodIsCaloriesOnly()) {
      setCaloriesOnlyView(true);
      setFoodValues({
        calories: [editCustomFoodValues.calories[0], "kcal"],
      });
    } else if (editCustomFoodValues) {
      setFoodValues(editCustomFoodValues);
    } else
      setFoodValues({
        fat: [0, "g"],
        carbs: [0, "g"],
        sugar: [0, "g"],
        protein: [0, "g"],
      });
    setHasMounted(true);
  }, []);

  const calculateCalories = () => {
    const { fat, protein, carbs } = foodValues;
    return Math.round(
      Number(fat[0]) * 9.0 + Number(protein[0]) * 4.0 + Number(carbs[0]) * 4.0
    );
  };

  useEffect(() => {
    if (
      !caloriesOnlyView &&
      foodValues.fat &&
      foodValues.protein &&
      foodValues.carbs
    ) {
      setFoodValues({
        ...foodValues,
        calories: [calculateCalories(), "kcal"],
      });
    }
  }, [foodValues]);

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleConfirm = (): void => {
    if (!foodName) {
      handleAllErrors(mapKeys("Food name cannot be empty!"));
      return;
    }
    if (editCustomFoodValues) {
      const foodDict: { [key: string]: string | number } = {
        name: foodName,
      };
      Object.keys(foodValues).forEach((key) => {
        foodDict[key] = foodValues[key][0];
      });
      onConfirm(foodDict, Number(portionSize));
      return;
    }

    const foodNameCapitalized =
      foodName.charAt(0).toUpperCase() + foodName.slice(1).toLowerCase();
    if (foodNameList.includes(foodNameCapitalized)) {
      handleAllErrors(mapKeys("Food already exists in the list!"));
      return;
    }

    const foodDict: { [key: string]: string | number } = {
      name: foodName,
      amount: 100,
    };
    setIsOpen(false);

    if (!caloriesOnlyView) {
      foodValues["calories"] = [calculateCalories(), "kcal"];
      Object.keys(foodValues).forEach((key) => {
        foodDict[key] = Number(foodValues[key][0]);
      });
      const relativeFoodValues: { [key: string]: [number, string] } = {
        amount: [Number(portionSize), "g"],
      };
      Object.keys(foodValues).forEach((key) => {
        relativeFoodValues[key] = [
          Number(foodValues[key][0]),
          foodValues[key][1],
        ];
      });

      addToList(foodName, {
        Macros: relativeFoodValues,
        Micros: {},
      });
    } else {
      addToList(foodName, {
        Macros: {
          amount: [Number(portionSize), "g"],
          calories: [Number(foodValues.calories[0]), "kcal"],
          fat: [0, "g"],
          carbs: [0, "g"],
          sugar: [0, "g"],
          protein: [0, "g"],
        },
        Micros: {},
      });
      foodDict["amount"] = 100;
      foodDict["calories"] = foodValues["calories"][0];
      foodDict["fat"] = 0;
      foodDict["carbs"] = 0;
      foodDict["sugar"] = 0;
      foodDict["protein"] = 0;
    }
    onConfirm(foodDict, Number(portionSize));
  };
  const [searchStatsDialogOpen, setSearchStatsDialogOpen] = useState(false);
  const openSearchStatsDialog = () => {
    setSearchStatsDialogOpen(true);
  };
  const theme = useTheme();
  return (
    <Dialog open={open} onClose={handleCancel} onBlur={onBlur}>
      {searchStatsDialogOpen && (
        <FoodStatsDialog
          open={searchStatsDialogOpen}
          onClose={() => setSearchStatsDialogOpen(false)}
          initialSearchTerm={foodName}
          onAddFood={(_: string, stats: NutrientValues) => {
            setFoodValues({
              calories: [stats.calories, "kcal"],
              fat: [stats.fat, "g"],
              carbs: [stats.carbs, "g"],
              sugar: [stats.sugar, "g"],
              protein: [stats.protein, "g"],
            });
          }}
        ></FoodStatsDialog>
      )}
      <div className="p-4">
        <p className="mb-3 font-bold text-xl">{mapKeys("Add a new food")}</p>
        <Paper
          className="flex flex-col flex-grow mx-auto"
          elevation={2}
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
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur(); // Cast to HTMLInputElement to call blur
                  }
                }}
                error={foodName === ""}
                helperText={foodName === "" ? mapKeys("Food name cannot be empty!") : ""}
                variant="standard"
                fullWidth
                multiline
                autoFocus
                maxRows={2}
              />

            </ListItem>
            <ListItem disablePadding>
              <ListItemButton
                sx={{ pl: 1 }}
                onClick={() => setCaloriesOnlyView(!caloriesOnlyView)}
              >
                <ListItemText primary={mapKeys("Only calories")} />
                <AnimatedCheckbox
                  extraClasses="mr-10 border-gray-400"
                  isChecked={caloriesOnlyView}
                />
              </ListItemButton>
            </ListItem>
            <ListItem sx={{ pl: 1 }}>
              <ListItemText primary={mapKeys("Size 1 portion")} />
              <Input
                spellCheck={false}
                placeholder={mapKeys("Portion size")}
                value={portionSize}
                onChange={(e) => {
                  const newValue = useNumberValidation(e.target.value);
                  if (newValue === undefined) {
                    return;
                  }
                  setPortionSize(newValue);
                }}
                error={Number(portionSize) === 0}
                endAdornment={<InputAdornment position="end">g</InputAdornment>}
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
                    transition: "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
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
            <ListItem className="flex gap-2">
              <Paper className="flex justify-center p-2 w-24 h-10">
                <Link
                  href={generateSearchQuery(foodName)}
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
                  (
                    key //key in foodValues
                  ) => key in foodValues
                )
                .map((key) => (
                  <Collapse appear key={key}>
                    <ListItem disablePadding sx={{ pr: 2 }}>
                      <ListItemText
                        primary={mapKeys(key)}
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
                        placeholder={mapKeys(key)}
                        value={foodValues[key][0]}
                        disabled={key === "calories" && !caloriesOnlyView}
                        onChange={(e) => {
                          const newValue = useNumberValidation(e.target.value);
                          if (newValue === undefined) {
                            return;
                          }
                          const newFoodValues = { ...foodValues };

                          newFoodValues[key][0] = newValue;
                          if (key === "carbs") {
                            newFoodValues.sugar[0] = Math.min(
                              newFoodValues.carbs[0] as number,
                              newFoodValues.sugar[0] as number
                            );
                          } else if (key === "sugar") {
                            newFoodValues.carbs[0] = Math.max(
                              newFoodValues.carbs[0] as number,
                              newFoodValues.sugar[0] as number
                            );
                          }
                          console.log(
                            newFoodValues[key][0],
                            key,
                            newFoodValues
                          );
                          setFoodValues(newFoodValues);
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
                      // endAdornment={
                      //   <InputAdornment position="end">
                      //     {foodValues[key][1].toLowerCase()}
                      //   </InputAdornment>
                      // }
                      />
                    </ListItem>
                  </Collapse>
                ))}
            </TransitionGroup>
          </List>

          {editCustomFoodValues && (
            <>
              <Divider />
              <div className="mt-auto w-full ">
                <Button
                  style={{
                    paddingTop: "0.8rem",
                    paddingBottom: "0.8rem",
                  }}
                  color="error"
                  onClick={() => {
                    deleteCustomFood(initialFoodName);
                    handleCancel();
                  }}
                  className="w-full"
                >
                  <p className="">
                    {mapKeys("Delete Item")}
                    <Trash size={theme.iconSize.large} color={theme.palette.primary.error} />
                  </p>
                </Button>
              </div>
            </>
          )}
        </Paper>
        <div className="flex space-x-4  justify-center">
          <Button variant="outlined" onClick={handleCancel}>
            {mapKeys("Cancel")}
          </Button>
          <Button variant="contained" onClick={handleConfirm}>
            {mapKeys("Confirm")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default AddNewFoodPopup;
