import React, { useContext, useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  DialogActions,
  ListItem,
  ListItemText,
  Input,
  InputAdornment,
  List,
} from "@mui/material";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";
import { useApi } from "../../../modules/apiAxios";
import {
  useFormattedFoodName,
  useNumberValidation,
} from "../../utils/CustomHooks";
import SearchList from "./SearchList";
import { NutrientValues } from "./foodTypes";
import { Nutrients } from "../../../pages/EditEntryPage";
interface FoodSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  initialSearchTerm?: string;
  onAddFood: (food_name: string, stats: NutrientValues) => void; // Callback when food is added
}

const FoodSelectionDialog: React.FC<FoodSelectionDialogProps> = ({
  open,
  initialSearchTerm,
  onClose,
  onAddFood,
}) => {
  const [searchTerm, setSearchTerm] = useState(
    initialSearchTerm ? initialSearchTerm : ""
  );
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [stats, setStats] = useState<NutrientValues | null>(null);
  const handleAddFood = () => {
    if (selectedFood && stats) {
      onAddFood(selectedFood, stats);
      onClose(); // Close the dialog after adding
      setSearchTerm(""); // Reset search term
      setSelectedFood(null); // Reset selected food
    }
  };
  function isKeyOfNutrientValues(key: keyof NutrientValues): key is keyof NutrientValues {
    return ["carbs", "protein", "fat", "calories", "sugar"].includes(key.toString());
  }
  const getFoodStats = async (searchTerm: string) => {
    try {
      const response = await api.post<{
        Nutrition: { [key: string]: Nutrients };
      }>(`/food/search/stats/`, {
        name: searchTerm,
      });
      const stats: NutrientValues = {
        carbs: 0,
        protein: 0,
        fat: 0,
        calories: 0,
        sugar: 0,
      };
      Object.keys(response.data.Nutrition[searchTerm].Macros).forEach((key) => {
        if (isKeyOfNutrientValues(key)) {
          stats[key] = response.data.Nutrition[searchTerm].Macros[key][0];
        }
      });
      setStats(stats);
      setSearchTerm("");
    } catch (error) {
      handleAllErrors(error);
    }
  };
  const [, setActiveRequest] = useState<boolean>(false);
  const formatFoodName = useFormattedFoodName();
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [searchList, setSearchList] = useState<[string[], string[], string[]]>([[], [], []]);
  const api = useApi();
  useEffect(() => {
    if (selectedFood) {
      getFoodStats(selectedFood);
    }
  }, [selectedFood]);

  const searchFood = async (searchTerm: string, signal: AbortSignal) => {
    try {
      const response = await api.post(
        `/food/search/`,
        { name: searchTerm },
        { signal }
      );

      setSearchList([
        response.data[0],
        response.data[1],
        response.data[2],
      ]);
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

  const renderSearchResults = () => (
    <SearchList
      searchList={searchList} // Mocking search list structure based on selection
      searchTerm={searchTerm}
      handleSearchTerm={(item?: string) => {
        setSelectedFood(item ? item.toUpperCase() : "");
        setSearchTerm("");
      }}
      editCustomFoodStats={() => {}}
    />
  );
  const order = ["calories", "fat", "carbs", "sugar", "protein"];
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mapKeys("Add Food")}</DialogTitle>
      <DialogContent sx={{ overflowY: "unset" }}>
        <TextField
          margin="dense"
          id="search-food"
          label={mapKeys("Search food")}
          type="text"
          fullWidth
          variant="standard"
          value={searchTerm ? searchTerm : ""}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {renderSearchResults()}
      </DialogContent>
      <DialogContent>
        {selectedFood && stats ? (
          <List>
            <ListItem
              disablePadding
              sx={{
                pr: 2,
              }}
            >
              <ListItemText
                primary={formatFoodName(selectedFood)}
                primaryTypographyProps={{
                  sx: {
                    fontSize: "16px",
                    textTransform: "none",
                    pl: 0,
                  borderBottom: "1px solid black",
                  },
                }}
              />
            </ListItem>
            {order.map((key) => (
              <ListItem
                disablePadding
                key={key}
                sx={{
                  pr: 2,
                }}
              >
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
                  value={stats[key]}
                  onChange={(e) => {
                    let newValue = useNumberValidation(e.target.value);
                    if (
                      newValue === undefined
                    ) {
                      return;
                    }
                    if (typeof newValue === "string") {
                      newValue = 0; 
                    }
                    const newStats = { ...stats };
                    if (key !== "calories") {
                      const amountPerG =
                        key === "protein" ? 4 : key === "carbs" ? 4 : 9;
                      newStats.calories =
                        stats.calories + (newValue - stats[key]) * amountPerG;
                      if (key === "carbs") {
                        newStats.sugar = Math.min(stats.sugar, newValue);
                      }
                      if (key === "sugar") {
                        newStats.carbs = Math.max(stats.carbs, newValue);
                      }
                      setStats({
                        ...newStats,
                        [key]: newValue,
                      });
                    } else {
                      setStats({
                        ...stats,
                        [key]: newValue,
                      });
                    }
                  }}
                  endAdornment={
                    <InputAdornment position="end">
                      {key === "calories" ? "kcal" : "g"}
                    </InputAdornment>
                  }
                  sx={{
                    width: "50%",
                  }}
                />
              </ListItem>
            ))}
          </List>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{mapKeys("Cancel")}</Button>
        <Button onClick={handleAddFood} disabled={!selectedFood}>
          {mapKeys("Add")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FoodSelectionDialog;
