import React, { useContext, useEffect, useState } from "react";
import { useApi } from "../../../modules/apiAxios";
import { EntryData, Nutrients } from "../../../pages/EditEntryPage";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../../contexts/HandleAllErrors";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Paper,
  Input,
  CircularProgress,
  Divider,
  Button,
  Grid,
  useMediaQuery,
  Typography,
  useTheme,
} from "@mui/material";

import AddNewFoodPopup from "./AddNewFoodPopup";
import RangeSlider from "../RangeSlider";
import { CollapsibleTable } from "./FoodTable";
import SearchList from "./SearchList";
import { useFormattedFoodName } from "../../utils/CustomHooks";
import SupplementsList from "./SupplementsList";
import NotFoundFoodsDialog from "./NotFoundFoodsDialog";
import EditCustomFoods from "./EditCustomFoods";
import { getMostUsedLocalStorage } from "../../utils/FoodLocalStorage";
import NoFoodDisplay from "./NoFoodsFound";
import { DiagramDataType } from "../../../pages/StatisticsPage";
import UniversalChart from "../../statisticsPage/UniversalChart";
import UniversalPieChart from "../../statisticsPage/UniversalPieChart";
import { sum } from "mathjs";
import Icon from "@mdi/react";
import { mdiWaterOutline } from "@mdi/js";

interface Props {
  data: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  RecommendationMap: { [key: string]: [number, string] };
  viewOnly?: boolean;
  handleSliderChange: (
    value: number,
    slider: "wellbeing" | "fluid" | "steps"
  ) => void;
  setIsEmblaActive: (isactive: boolean) => void;
  diagramData?: DiagramDataType;
}

const EditFoodList = ({
  data,
  updateEntryData,
  RecommendationMap,
  viewOnly = false,
  handleSliderChange,
  setIsEmblaActive,
  diagramData,
}: Props) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [searchList, setSearchList] = useState<[string[], string[], string[]]>([
    [],
    [],
    [],
  ]);
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(
    getMostUsedLocalStorage()
  );

  const [isOpen, setIsOpen] = useState<boolean>(false); // add new food popup
  const [editCustomFoodValues, setEditCustomFoodValues] = useState<
    | {
        [key: string]: [number | string, string];
      }
    | undefined
  >(undefined); // editing or adding new custom food
  const [activeRequest, setActiveRequest] = useState<boolean>(false);
  const [customFoodList, setCustomFoodList] = useState<string[]>([]);
  const [currEditingCustomFood, setCurrEditingCustomFood] =
    useState<string>(""); // food name of the custom food being edited
  const formatFoodName = useFormattedFoodName();
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);

  const api = useApi();

  const sortByRelevance = (query: string, list: string[]) => {
    return list.sort((a, b) => {
      const aIndex = a.toLowerCase().indexOf(query.toLowerCase());
      const bIndex = b.toLowerCase().indexOf(query.toLowerCase());
      if (aIndex === bIndex) {
        return a.localeCompare(b);
      }
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  };
  // Function to handle food search
  const searchFood = async (searchTerm: string, signal: AbortSignal) => {
    try {
      const response = await api.post(
        `/food/search/`,
        { name: searchTerm },
        { signal }
      );
      setSearchList([response.data[0], response.data[1], response.data[2]]);
      setRecentlyUsed(sortByRelevance(searchTerm, recentlyUsed));
      setActiveRequest(false);
    } catch (error) {
      handleAllErrors(error);
    } finally {
      setActiveRequest(false);
    }
  };
  // UseEffect for searching food database
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

  const editCustomFoodStats = (name: string) => {
    api
      .post(`/food/search/stats/`, { name: name })
      .then((response) => {
        setEditCustomFoodValues(
          response.data.Nutrition[name.trim().toUpperCase()].Macros
        );
        setCurrEditingCustomFood(name);
        setIsOpen(true);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  interface backendFoodValues {
    name: string;
    amount: string;
    portion_size: string;
    protein: string;
    fat: string;
    carbs: string;
    sugar: string;
    calories: string;
  }
  const convertFoodValuesToBackendFoodValues = (
    foodValues: { [key: string]: number | string },
    portion_size: number
  ): backendFoodValues => {
    // Initialize the backendFood object with default values
    const backendFood: backendFoodValues = {
      name: "", // Assuming name needs to be provided or set elsewhere
      amount: "0", // Assuming amount needs to be provided or set elsewhere
      portion_size: portion_size.toString(), // Setting portion_size from the function argument
      protein: "0",
      fat: "0",
      carbs: "0",
      sugar: "0",
      calories: "0",
    };

    // Loop through the keys of foodValues to update the backendFood object
    interface backendFoodValues {
      name: string;
      amount: string;
      portion_size: string;
      protein: string;
      fat: string;
      carbs: string;
      sugar: string;
      calories: string;
      [key: string]: string;
    }

    for (const key of Object.keys(foodValues)) {
      // Ensure that the key exists in backendFood before trying to set it
      if (key in backendFood) {
        backendFood[key] = foodValues[key].toString(); // Convert number to string
      }
    }

    return backendFood;
  };
console.log("data", data.result.Nutrition.Total)
  const updateCustomFoodStats = (
    foodValues: {
      [key: string]: number | string;
    },
    portionSize: number
  ) => {
    if (portionSize === 0) {
      handleAllErrors(mapKeys("Portion size cannot be 0!"));
      return;
    }
    setIsOpen(false);

    const convertedFoodValues = convertFoodValuesToBackendFoodValues(
      foodValues,
      portionSize
    );
    api.post("/food/custom_foods/", convertedFoodValues).catch((error) => {
      handleAllErrors(error);
    });
  };

  const deleteCustomFood = (name: string) => {
    api
      .post(`/food/delete/`, { name: name })
      .then(() => {
        setEditCustomFoodValues(undefined);
        console.log(name, "deleted");
        setSearchTerm("");
        fetchCustomFoods();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const handleCreateFood = (
    foodValues: { [key: string]: number | string },
    portionSize: number
  ) => {
    if (portionSize === 0) {
      handleAllErrors(mapKeys("Portion size cannot be 0!"));
      return;
    }
    const apiEndpoint = `/food/custom_foods/create/`;
    const data = { ...foodValues, portion_size: portionSize };
    api
      .post(apiEndpoint, data)
      .then(() => {
        fetchCustomFoods();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
    setSearchTerm("");
  };

  const fetchCustomFoods = () => {
    api
      .get("/food/custom_foods/")
      .then((response) => {
        setCustomFoodList(response.data);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const getUpdatedTotalNutrition = (newFoodList: {
    [key: string]: Nutrients;
  }): {
    Macros: { [key: string]: [number, string] };
    Micros: { [key: string]: [number, string] };
  } => {
    const totalNutrition: {
      [key: string]: { [key: string]: [number, string] };
    } = {
      Macros: {
        amount: [0, "G"],
        calories: [0, "G"],
        fat: [0, "G"],
        carbs: [0, "G"],
        sugar: [0, "G"],
        protein: [0, "G"],
        fluid: data.result.Nutrition.Total.Macros.fluid,
      },
      Micros: {},
    };
    Object.values(newFoodList).forEach((foodItem: Nutrients) => {
      Object.keys(foodItem.Macros).forEach((nutrient) => {
        if (
          !Object.prototype.hasOwnProperty.call(totalNutrition.Macros, nutrient) // prevent undefined error when foodItme gets a new column
        ) {
          totalNutrition.Macros[nutrient] = [0, foodItem.Macros[nutrient][1]];
        }
        totalNutrition.Macros[nutrient] = [
          totalNutrition.Macros[nutrient][0] + foodItem.Macros[nutrient][0],
          totalNutrition.Macros[nutrient][1],
        ];
      });
    });
    return {
      Macros: totalNutrition.Macros,
      Micros: totalNutrition.Micros,
    };
  };
  const updateTotalMacros = (newFoodList: { [key: string]: Nutrients }) => {
    const totalNutrition: {
      [key: string]: { [key: string]: [number, string] };
    } = {
      Macros: {
        amount: [0, "G"],
        calories: [0, "G"],
        fat: [0, "G"],
        carbs: [0, "G"],
        sugar: [0, "G"],
        protein: [0, "G"],
        fluid: data.result.Nutrition.Total.Macros.fluid,
      },
      Micros: {},
    };
    Object.values(newFoodList).forEach((foodItem: Nutrients) => {
      Object.keys(foodItem.Macros).forEach((nutrient) => {
        if (
          !Object.prototype.hasOwnProperty.call(totalNutrition.Macros, nutrient) // prevent undefined error when foodItme gets a new column
        ) {
          totalNutrition.Macros[nutrient] = [0, foodItem.Macros[nutrient][1]];
        }
        totalNutrition.Macros[nutrient] = [
          totalNutrition.Macros[nutrient][0] + foodItem.Macros[nutrient][0],
          totalNutrition.Macros[nutrient][1],
        ];
      });
    });
    const updatedData = JSON.parse(JSON.stringify(data));
    updatedData.result.Nutrition.Total = totalNutrition;
    updatedData.result.Food.FoodList = newFoodList;
    updateEntryData(updatedData);
  };
  useEffect(() => {
    fetchCustomFoods();
  }, []);
  // Function to check if food is in searchlist and handle backend request
  const handleSearchTerm = (item?: string) => {
    const localSearchTerm = item ?? searchTerm;
    if (activeRequest || localSearchTerm === "") return;

    const searchTermCapitalized = formatFoodName(localSearchTerm);
    if (
      Object.prototype.hasOwnProperty.call(
        data.result.Food.FoodList,
        searchTermCapitalized
      )
    ) {
      handleAllErrors(mapKeys("Food already exists in the list!"));
      return;
    }

    if (
      searchList[0].some(
        (element) => element.toUpperCase() === localSearchTerm.toUpperCase()
      ) ||
      searchList[1].some(
        (element) => element.toUpperCase() === localSearchTerm.toUpperCase()
      ) ||
      recentlyUsed.some(
        (element) => element.toUpperCase() === localSearchTerm.toUpperCase()
      )
    ) {
      postFoodSearchStats(localSearchTerm);
    }
  };

  // Function for posting food search statistics
  const postFoodSearchStats = async (searchTerm: string) => {
    console.log(searchTerm);
    try {
      const response = await api.post<{
        Nutrition: { [key: string]: Nutrients };
      }>(`/food/search/stats/`, {
        name: searchTerm,
      });
      addFoodToList(
        Object.keys(response.data.Nutrition)[0].toUpperCase(),
        Object.values(response.data.Nutrition)[0]
      );
      setSearchTerm("");
    } catch (error) {
      handleAllErrors(error);
    }
  };

  const addFoodToList = (foodName: string, foodValues: Nutrients) => {
    const updatedData = { ...data };
    if (
      Object.prototype.hasOwnProperty.call(
        updatedData.result.Food.FoodList,
        foodName
      )
    ) {
      handleAllErrors(mapKeys("Food already exists in the list!"));
      return;
    }
    const relativeTo100g = foodValues.Macros.amount[0] / 100;
    Object.keys(foodValues.Macros).forEach((key) => {
      if (key === "amount") return;
      foodValues.Macros[key] = [
        foodValues.Macros[key][0] * relativeTo100g,
        foodValues.Macros[key][1],
      ];
    });
    updatedData.result.Food.FoodList[foodName] = {
      Macros: foodValues.Macros,
      Micros: foodValues.Micros,
    };
    updatedData.result.Nutrition.Total = getUpdatedTotalNutrition(
      updatedData.result.Food.FoodList
    );
    updateEntryData(updatedData);
  };
  const theme = useTheme();
  const [accurateCalorieData, setAccurateCalorieData] = useState<
    DiagramDataType | undefined
    >(diagramData);
  
  useEffect(() => {
    if (diagramData) {
      setAccurateCalorieData(diagramData);
    }
  }, [diagramData]);

  const updateCalorieData = (newValue: number) => {
    if (!accurateCalorieData) return;
    const updatedCalorieData: DiagramDataType = {
      ...accurateCalorieData,
    };
    updatedCalorieData.data[updatedCalorieData.data.length - 1] = {
      date: updatedCalorieData.data[updatedCalorieData.data.length - 1]["date"],
      Calories: newValue,
    };
    setAccurateCalorieData(updatedCalorieData);
  };

  useEffect(() => {
    if (data.result.Nutrition.Total.Macros.calories[0] !== 0) {
      updateCalorieData(data.result.Nutrition.Total.Macros.calories[0]);
    }
  }, [data.result.Nutrition.Total.Macros.calories[0]]);
  const [macroPercents, setMacroPercents] = useState<{
    protein: number;
    fat: number;
    carbs: number;
  }>({ protein: 0, fat: 0, carbs: 0 });

  useEffect(() => {
    const totalCalories = data.result.Nutrition.Total.Macros.calories[0];
    const proteinCalories = data.result.Nutrition.Total.Macros.protein[0] * 4;
    const fatCalories = data.result.Nutrition.Total.Macros.fat[0] * 9;
    const carbCalories = data.result.Nutrition.Total.Macros.carbs[0] * 4;
    setMacroPercents({
      protein: proteinCalories / totalCalories,
      fat: fatCalories / totalCalories,
      carbs: carbCalories / totalCalories,
    });
  }, [data.result.Nutrition.Total.Macros]);

  const isLarge = useMediaQuery(theme.breakpoints.up("lg"));
  return (
    <div className="mx-auto " style={{ marginTop: "0.25rem" }}>
      <Typography variant="h4" className="pb-2 flex justify-center"> {mapKeys("Foods")}</Typography>
      <Grid
        container
        sx={{
          maxWidth: "98vw",
          px: 2,
          maxHeight: "95vh",
          pb: 23,
          overflowY: "auto",
          marginX: "auto",
        }}
        spacing={isLarge ? 2 : 0}
      >
        <Grid item xs={12} md={12} lg={6} className="pb-2">
          {Object.keys(data.result.Food.FoodList).length !== 0 ? (
            <Paper elevation={2}>
              <CollapsibleTable
                viewOnly={viewOnly}
                data={data}
                updateTotalMacros={updateTotalMacros}
                deleteFood={(foodName: string) => {
                  const updatedData = { ...data };
                  delete updatedData.result.Food.FoodList[foodName];
                  updatedData.result.Nutrition.Total = getUpdatedTotalNutrition(
                    updatedData.result.Food.FoodList
                  );
                  delete data.result.Food.FoodList[foodName];
                  console.log(updatedData.result.Food.FoodList);
                  updateEntryData(updatedData);
                }}
                recommendations={RecommendationMap}
              />
            </Paper>
          ) : (
            <NoFoodDisplay />
          )}
        </Grid>
        <Grid item xs={12} md={12} lg={6}>
          <div
            className={`flex flex-col space-y-2 max-w-[400px] ${
              !isLarge ? "mx-auto" : ""
            }`}
          >
            {!viewOnly && (
              <>
                <Paper elevation={2}>
                  <div className="flex flex-col w-full relative py-2">
                    <div className="flex justify-between items-center h-10 px-3">
                      <div className="pr-4">
                        <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
                      </div>
                      <Input
                        spellCheck={false}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearchTerm();
                          }
                          if (e.key === "Escape") {
                            setSearchList([[], [], []]);
                            setSearchTerm("");
                          }
                        }}
                        placeholder={mapKeys("Search for foods")}
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value),
                            setCurrEditingCustomFood("");
                        }}
                        fullWidth
                        sx={{
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

                      <div className="flex justify-center w-24 mx-auto">
                        {searchList[0].length === 0 &&
                          searchList[1].length === 0 &&
                          activeRequest && (
                            <div className="flex justify-end w-10 h-10">
                              <CircularProgress color="primary" />
                            </div>
                          )}
                      </div>
                      <Button onClick={() => setSearchTerm("")}>
                        {mapKeys("Clear")}
                      </Button>
                    </div>
                    <div
                      className={`flex flex-col w-full mt-2 overflow-hidden rounded-md ${
                        searchList[0].length === 0 &&
                        searchList[1].length === 0 &&
                        recentlyUsed.length === 0 &&
                        "hidden"
                      } `}
                    >
                      <Divider />
                      <SearchList
                        collapsedDefault={true}
                        searchList={searchList}
                        searchTerm={searchTerm}
                        localStorageList={recentlyUsed}
                        handleSearchTerm={handleSearchTerm}
                        editCustomFoodStats={editCustomFoodStats}
                      />
                    </div>
                  </div>
                </Paper>

                <EditCustomFoods
                  editCustomFoodStats={editCustomFoodStats}
                  setIsOpen={setIsOpen}
                  setEditCustomFoodValues={setEditCustomFoodValues}
                  foodNameList={customFoodList}
                  addCustomFoodToList={postFoodSearchStats}
                />
              </>
            )}
            {isOpen && (
              <AddNewFoodPopup
                addToList={addFoodToList}
                setIsOpen={setIsOpen}
                initialFoodName={formatFoodName(
                  currEditingCustomFood.length > 0
                    ? currEditingCustomFood
                    : searchTerm
                )}
                onConfirm={
                  editCustomFoodValues === undefined
                    ? handleCreateFood
                    : updateCustomFoodStats
                }
                foodNameList={Object.keys(data.result.Food.FoodList)}
                editCustomFoodValues={editCustomFoodValues}
                deleteCustomFood={deleteCustomFood}
                open={isOpen}
              />
            )}
            <div
              onMouseDown={() => setIsEmblaActive(false)}
              onMouseUp={() => setIsEmblaActive(true)}
              onTouchStart={() => setIsEmblaActive(false)}
              onTouchEnd={() => setIsEmblaActive(true)}

            >
              <RangeSlider
                viewOnly={viewOnly}
                value={data.result.Nutrition.Total.Macros.fluid[0]}
                unit={"L"}
                heading={"Hydration"}
                range={[0, 5000]}
                handleSliderChange={(newValue) => {
                  handleSliderChange(newValue, "fluid");
                  updateEntryData(data);
                }}
                icon={
                  <Icon path={mdiWaterOutline} size={1} color={theme.palette.primary.main} />
                }
              />
            </div>
            <NotFoundFoodsDialog
              data={data}
              updateEntryData={updateEntryData}
              handleCreateCustomFood={handleCreateFood}
              addFoodToList={addFoodToList}
            />

            {Object.keys(macroPercents).length > 0 &&
              sum(Object.values(macroPercents)) > 0 && (
                <Paper className="py-1">
                  <Typography variant="h6" className="flex justify-center pl-4">
                    {mapKeys("Macronutrient Distribution")}
                  </Typography>
                  <UniversalPieChart
                    percentages={macroPercents}
                    thresholdForOther={0.0}
                    useMapKeys={true}
                  ></UniversalPieChart>
                </Paper>
              )}

            <SupplementsList
              data={data}
              viewOnly={viewOnly}
              updateEntryData={updateEntryData}
            />

            {!viewOnly && diagramData && (
              <Paper>
                <Typography variant="h6" className="flex pt-2 pl-4">
                  {mapKeys("Calories")}
                </Typography>
                <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
                  <UniversalChart
                    timeframe={7}
                    diagramData={accurateCalorieData}
                  />
                </div>
              </Paper>
            )}
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default EditFoodList;
