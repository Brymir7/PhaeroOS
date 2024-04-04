import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
  ButtonGroup,
  ToggleButtonGroup,
  ToggleButton,
  ListItem,
  List,
  ListItemText,
  InputAdornment,
  ListItemSecondaryAction,
  ListItemButton,
  useTheme,
} from "@mui/material";
import SearchList from "./../editEntryPage/food/SearchList";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { useFormattedFoodName } from "../utils/CustomHooks";
import { useApi } from "../../modules/apiAxios";
import {
  addFoodToMostUsedLocalStorage,
  getFoodPortionFromLocalStorage,
  getMostUsedLocalStorage,
} from "../utils/FoodLocalStorage";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Edit2 } from "iconsax-react";
interface FoodSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFood: (food: { name: string; grams: number }) => void; // Callback when food is added
  onAddMultipleFoods: (foods: { name: string; grams: number }[]) => void;
}
enum FoodType {
  USERFOOD,
  OURFOOD,
}
interface PreviousFood {
  name: string;
  grams: number;
}
const FoodSelectionDialog: React.FC<FoodSelectionDialogProps> = ({
  open,
  onClose,
  onAddFood,
  onAddMultipleFoods,
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [grams, setGrams] = useState("");
  const [previousFoods, setPreviousFoods] = useState<PreviousFood[]>([]);
  const [selectedPreviousFoods, setSelectedPreviousFoods] = useState<
    PreviousFood[] | null
  >([]);
  const handleAddFood = () => {
    if (selectedFood && grams) {
      addFoodToMostUsedLocalStorage(selectedFood);
      localStorage.setItem(
        selectedFood,
        JSON.stringify({ portion_size: grams })
      );
      onAddFood({ name: selectedFood, grams: Number(grams) });
      onClose(); // Close the dialog after adding
      setSearchTerm(""); // Reset search term
      setSelectedFood(null); // Reset selected food
      setGrams(""); // Reset grams
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setActiveRequest] = useState<boolean>(false);
  const formatFoodName = useFormattedFoodName();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [searchList, setSearchList] = useState<[string[], string[], []]>([
    [],
    [],
    [],
  ]);
  const api = useApi();
  const searchFood = async (searchTerm: string, signal: AbortSignal) => {
    try {
      const response = await api.post(
        `/food/search/`,
        { name: searchTerm },
        { signal }
      );
      setSearchList([response.data[0], response.data[1], response.data[2]]);
      setActiveRequest(false);
    } catch (error) {
      handleAllErrors(error);
    } finally {
      setActiveRequest(false);
    }
  };
  useEffect(() => {
    let newController: AbortController | null = null;

    if (searchTerm.length < 2) {
      setSearchList([[], [], []]);
      setActiveRequest(false);
      return;
    }

    if (searchTerm) {
      newController = new AbortController();
      setActiveRequest(true);
      const timeoutId = setTimeout(() => {
        if (newController) {
          searchFood(searchTerm, newController.signal);
        }
      }, 200);

      return () => {
        if (newController) {
          newController.abort();
        }
        clearTimeout(timeoutId);
      };
    }
  }, [searchTerm]);
  const typeSelectedFood = (food: string) => {
    if (searchList[0].includes(food)) {
      return FoodType.USERFOOD;
    }
    return FoodType.OURFOOD;
  };
  const getPortionSize = (food: string) => {
    if (typeSelectedFood(food) === FoodType.OURFOOD) {
      const foodPortion = getFoodPortionFromLocalStorage(food);
      if (foodPortion !== null) {
        setGrams(foodPortion);
      }
      return;
    }
    api.post(`/food/search/portion_size`, { name: food }).then((response) => {
      setGrams(response.data.portion_size);
    });
  };
  const getPreviousFoods = async () => {
    try {
      const response = await api.get("/phaero_note/previous_foods/");
      setPreviousFoods(response.data.previous_foods);
      setSelectedPreviousFoods(response.data.previous_foods);
    } catch (error) {
      handleAllErrors(error);
    }
  };
  const removeFromSelectedPreviousFoods = (food: PreviousFood) => {
    const newPreviousFoods = selectedPreviousFoods?.filter(
      (previousFood) => previousFood !== food
    );
    setSelectedPreviousFoods(newPreviousFoods ?? []);
  };
  useEffect(() => {
    if (selectedFood) {
      getPortionSize(selectedFood);
    }
  }, [selectedFood]);
  useEffect(() => {
    getPreviousFoods();
  }, []);
  useEffect(() => {
    setSelectedPreviousFoods(
      previousFoods.map((previousFood) => ({
        name: formatFoodName(previousFood.name),
        grams: previousFood.grams,
      }))
    );
  }, [previousFoods]);
  const renderSearchResults = () => (
    <SearchList
      searchList={searchList} // Mocking search list structure based on selection
      searchTerm={searchTerm}
      localStorageList={getMostUsedLocalStorage()}
      handleSearchTerm={(item?: string) => {
        setSelectedFood(item ? formatFoodName(item) : "");
        setSearchTerm("");
      }}
      editCustomFoodStats={() => {}}
    />
  );
  const addToGram = (add: number) => {
    const currentGrams = parseInt(grams, 10);
    const safeGrams = isNaN(currentGrams) ? 0 : currentGrams;
    const newGrams = Math.max(safeGrams + add, 0);
    setGrams(newGrams.toString());
  };
  const [repeatFromYesterday, setRepeatFromYesterday] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editedGrams, setEditedGrams] = useState<number | string>("");
  const updateSelectedPreviousFoodGrams = (
    food: PreviousFood,
    newGrams: number | string
  ) => {
    const newPreviousFoods = selectedPreviousFoods?.map((previousFood) => {
      if (previousFood === food) {
        return { name: previousFood.name, grams: Number(newGrams) };
      }
      return previousFood;
    });
    setSelectedPreviousFoods(newPreviousFoods ?? []);
  };
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mapKeys("Add Food")}</DialogTitle>
      <ToggleButtonGroup
        sx={{ display: "flex", justifyContent: "center" }}
        value={repeatFromYesterday}
        exclusive
        onChange={(_, value) => {
          if (value === null) {
            setRepeatFromYesterday(false);
            return;
          }
          setRepeatFromYesterday(value);
        }}
      >
        <ToggleButton value={false}>{mapKeys("Search")}</ToggleButton>
        <ToggleButton value={true}>
          {mapKeys("Use from yesterday")}
        </ToggleButton>
      </ToggleButtonGroup>
      {!repeatFromYesterday ? (
        <DialogContent sx={{ overflowY: "unset" }}>
          <TextField
            
            margin="dense"
            id="search-food"
            label={mapKeys("Search food")}
            type="text"
            fullWidth
            variant="standard"
            value={searchTerm ? searchTerm : selectedFood || ""}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {renderSearchResults()}
          <TextField
            margin="dense"
            id="grams"
            label="Grams"
            type="number"
            fullWidth
            variant="standard"
            value={grams}
            onChange={(e) => setGrams(e.target.value)}
            disabled={!selectedFood}
          />
          {selectedFood && (
            <ButtonGroup>
              <Button color="error" onClick={() => setGrams("0")}>
                {" "}
                0
              </Button>
              <Button color="error" onClick={() => addToGram(-10)}>
                {" "}
                -10g
              </Button>
              <Button onClick={() => addToGram(10)}> +10g</Button>
              <Button onClick={() => addToGram(25)}> +25g</Button>
              <Button onClick={() => addToGram(50)}> +50g</Button>
            </ButtonGroup>
          )}
        </DialogContent>
      ) : (
        <DialogContent>
          <div className="flex justify-between">
            <div className="pt-1">{mapKeys("The following will be added")}</div>
            <div>
              <Button onClick={() => setSelectedPreviousFoods(previousFoods)}>
                {mapKeys("Reset")}
              </Button>
            </div>
          </div>
          <List sx={{ overflowY: "auto", maxHeight: "50vh" }}>
            {selectedPreviousFoods?.map((food, index) => (
              <ListItem key={index}>
                <ListItemButton
                  onClick={() => {
                    setEditingIndex(index);
                    setEditedGrams(food.grams);
                  }}
                >
                  <Edit2
                    size={theme.iconSize.medium}
                    color={theme.palette.primary.main}
                  />
                </ListItemButton>
                {!(index === editingIndex) ? (
                  <ListItemText
                    sx={{ width: "100%" }}
                    primary={food.name}
                    secondary={`${food.grams}g`}
                  />
                ) : (
                  <TextField
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateSelectedPreviousFoodGrams(food, editedGrams);
                        setEditingIndex(null);
                      }
                    }}
                    sx={{
                      maxWidth: "60%",
                      margin: "auto",
                      marginRight: "25px",
                    }}
                    margin="dense"
                    id="grams"
                    label={mapKeys("Grams")}
                    type="number"
                    variant="standard"
                    value={editedGrams}
                    onChange={(e) => setEditedGrams(e.target.value)}
                    onBlur={() => {
                      updateSelectedPreviousFoodGrams(food, editedGrams);
                      setEditingIndex(null);
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            onClick={() => {
                              updateSelectedPreviousFoodGrams(
                                food,
                                editedGrams
                              );
                              setEditingIndex(null);
                            }}
                          >
                            Save
                          </Button>
                        </InputAdornment>
                      ),
                    }}
                  />
                )}
                <ListItemSecondaryAction>
                  <Button
                    color="error"
                    onClick={() => {
                      removeFromSelectedPreviousFoods(food);
                    }}
                    sx={{
                      width: "20%",
                      paddingLeft: "0px",
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="ml-8"
                      size="lg"
                    />
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      )}
      <DialogActions sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button onClick={onClose} color="error">
          {mapKeys("Cancel")}
        </Button>
        {!repeatFromYesterday ? (
          <Button onClick={handleAddFood} disabled={!selectedFood || !grams}>
            {mapKeys("Add")}
          </Button>
        ) : (
          <Button
            onClick={() => onAddMultipleFoods(selectedPreviousFoods ?? [])}
            disabled={!selectedPreviousFoods}
          >
            {mapKeys("Add")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default FoodSelectionDialog;
