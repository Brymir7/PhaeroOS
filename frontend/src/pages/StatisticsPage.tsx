import { useContext, useEffect, useState } from "react";
import { useApi } from "../modules/apiAxios";
import ChartPopup from "../components/statisticsPage/ChartPopup";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import SearchStatistics from "../components/statisticsPage/SearchStatistics";
import { MapKeysContext } from "../components/contexts/MapKeysContext";
import StatisticsIcon from "../assets/statistics.svg";
import { motion } from "framer-motion";
import { AuthContext } from "../components/contexts/AuthContext";
import TutorialStep from "../components/utils/TutorialStep";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UniversalPieChart from "../components/statisticsPage/UniversalPieChart";
import { Add, Minus } from "iconsax-react";
import { useWindowWidth } from "../components/utils/CustomHooks";
import JoinedUniversalChart from "../components/statisticsPage/JoinedUniversalChart";
export interface DiagramDataType {
  title: string;
  id?: number;
  unit?: string;
  user_id?: number;
  data: { [key: string]: number }[];
}
export interface NutritionDiagramDataType {
  listOfFoodsEveryDay: [];
  basedOnPercentageOfDailyCalories: [];
  basedOnPercentageOfDailyCarbs: [];
  basedOnPercentageOfDailyFat: [];
  basedOnPercentageOfDailyProtein: [];
  basedOnPercentageOfDailySugar: [];
}
function StatisticsPage() {
  const api = useApi();
  const [loading, setLoading] = useState<boolean>(true);
  const [thresholdForOther, setThresholdForOther] = useState<number>(0.05);
  const [showDailyOrTotal, setShowDailyOrTotal] = useState<boolean>(false);
  const [diagramData, setDiagramData] = useState<DiagramDataType[]>([]);
  const [exerciseDiagramData, setExerciseDiagramData] = useState<
    DiagramDataType[]
  >([]);
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
  const [dataKeys, setDataKeys] = useState<string[]>([]);
  const [exerciseDataKeys, setExerciseDataKeys] = useState<string[]>([]);
  const [titleToIndexMap, setTitleToIndexMap] = useState<{
    [key: string]: number;
  }>({});
  const [exerciseTitleToIndexMap, setExerciseTitleToIndexMap] = useState<{
    [key: string]: number;
  }>({});
  const [diagramType, setDiagramType] = useState<string>("general");
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys, mapExercises } = useContext(MapKeysContext);
  const { hasAccess } = useContext(AuthContext);
  const [nutritionData, setNutritionData] =
    useState<NutritionDiagramDataType>();
  useEffect(() => {
    if (hasAccess) {
      diagramRequest();
      nutritionDataRequest();
    }
  }, [hasAccess]);
  const mapExerciseKeys = (key: string) => {
    const words = key.split(" ");
    console.log(words);
    if (words.length > 1) {
      const lastWord = words.pop();
      return mapExercises(words.join(" ")) + " " + mapKeys(lastWord ?? "");
    } else {
      return mapKeys(key);
    }
  };
  const diagramRequest = async () => {
    const apiEndpoint = `/diagrams/`;

    api
      .get(apiEndpoint)
      .then((response) => {
        setDiagramData([]);
        const newDiagramData: DiagramDataType[] = [];
        const newDataKeys: string[] = [];
        const newTitleToIndexMap: { [key: string]: number } = {};
        const newExerciseDiagramData: DiagramDataType[] = [];
        const newExerciseDataKeys: string[] = [];
        const newExerciseTitleToIndexMap: { [key: string]: number } = {};

        let generalCount = 0;
        let exerciseCount = 0;

        response.data.data
          .filter(
            (data: DiagramDataType) => data.title !== "Relative Activity Level"
          )
          .forEach((data: DiagramDataType) => {
            if (generalDiagramTitles.includes(data.title)) {
              newDiagramData.push(data);
              const key = mapKeys(data.title);
              newDataKeys.push(key);
              newTitleToIndexMap[key] = generalCount;
              generalCount++;
            } else {
              newExerciseDiagramData.push(data);
              const key = data.title;
              const mappedKey = mapExerciseKeys(key);
              newExerciseDataKeys.push(mappedKey);
              newExerciseTitleToIndexMap[mappedKey] = exerciseCount;
              exerciseCount++;
            }
          });

        setDiagramData(newDiagramData);
        setDataKeys(newDataKeys);
        setTitleToIndexMap(newTitleToIndexMap);
        setExerciseDiagramData(newExerciseDiagramData);
        setExerciseDataKeys(newExerciseDataKeys);
        setExerciseTitleToIndexMap(newExerciseTitleToIndexMap);
        setLoading(false);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const nutritionDataRequest = async () => {
    const apiEndpoint = `/diagrams/nutrition/`;
    api
      .post(apiEndpoint, { last_x_days: timeframe })
      .then((response) => {
        setNutritionData(response.data);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const motionDivAttributes = isMobile
    ? {}
    : {
      layout: true,
      transition: { duration: 0.35, type: "easeInOut" },
    };
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [advancedView, setAdvancedView] = useState<boolean>(false);
  const convertNutritionDataIntoPercentages = (
    data: { [key: string]: number }[]
  ): { [key: string]: number } => {
    const result: { [key: string]: number } = {};
    const amountOfFood: { [key: string]: number } = {};
    console.log(data.filter((foodDict) => Object.keys(foodDict).length > 0));
    if (data) {
      data.forEach((foodDict) => {
        Object.entries(foodDict).forEach(([key, value]) => {
          if (result[key] === undefined) {
            result[key] = value;
            amountOfFood[key] = 1;
          } else {
            amountOfFood[key] += 1;
            result[key] += value;
          }
        });
      });
      if (!showDailyOrTotal) {
        Object.entries(result).forEach(([key, value]) => {
          result[key] =
            value /
            data.filter((foodDict) => Object.keys(foodDict).length > 0).length;
        });
      } else if (showDailyOrTotal) {
        Object.entries(result).forEach(([key, value]) => {
          result[key] = value / amountOfFood[key]; // avg per day where the food appeared
        });
      }
    }
    return result;
  };
  const convertListOfFoodsIntoPercentages = (
    data: string[][]
  ): { [key: string]: number } => {
    const result: { [key: string]: number } = {};
    let totalFoods = 0;
    if (data) {
      data.forEach((foodList) => {
        foodList.forEach((food) => {
          if (result[food] === undefined) {
            result[food] = 1;
            totalFoods += 1;
          } else {
            totalFoods += 1;
            result[food] += 1;
          }
        });
      });
      if (totalFoods === 0) {
        return result;
      }
      Object.entries(result).forEach(([key, value]) => {
        result[key] = value / totalFoods;
      });
    }
    console.log(result);
    return result;
  };
  const [currentlySelectedNutrition, setCurrentlySelectedNutrition] = useState<
    | "basedOnPercentageOfDailyCalories"
    | "basedOnPercentageOfDailyCarbs"
    | "basedOnPercentageOfDailyFat"
    | "basedOnPercentageOfDailyProtein"
    | "basedOnPercentageOfDailySugar"
    | "listOfFoodsEveryDay"
  >("basedOnPercentageOfDailyCalories");
  const handleChange = (
    _: any,
    newValue:
      | "basedOnPercentageOfDailyCalories"
      | "basedOnPercentageOfDailyCarbs"
      | "basedOnPercentageOfDailyFat"
      | "basedOnPercentageOfDailyProtein"
      | "basedOnPercentageOfDailySugar"
      | "listOfFoodsEveryDay"
  ) => {
    setCurrentlySelectedNutrition(newValue);
  };
  const [timeframe, setTimeframe] = useState<number>(7);
  useEffect(() => {
    if (hasAccess) {
      nutritionDataRequest();
    }
  }, [timeframe]);
  const tabProps = (
    index: number
  ): { id: string; "aria-controls": string } => ({
    id: `nutrition-tab-${index}`,
    "aria-controls": `nutrition-tabpanel-${index}`,
  });
  const windowWidth = useWindowWidth();
  return (
    <div className="flex w-full flex-col justify-center ">
      <div className="flex justify-center ">
        <Button
          className="w-full max-w-xl"
          variant="contained"
          color="primary"
          onClick={() => setAdvancedView(!advancedView)}
        >
          {advancedView ? mapKeys("Default") : mapKeys("Advanced")}
        </Button>
      </div>
      <TutorialStep step={7} extraClasses="w-full max-w-xl mx-auto mb-4 mt-1">
        {!advancedView && (
          <SearchStatistics
            diagramType={diagramType}
            dataKeys={dataKeys}
            setDataKeys={setDataKeys}
            exerciseKeys={exerciseDataKeys}
            setExerciseKeys={setExerciseDataKeys}
            setDiagramType={setDiagramType}
            setIsSearching={setIsSearching}
          />
        )}
      </TutorialStep>

      {!loading &&
        !advancedView &&
        (diagramType === "general" ? (
          diagramData.length > 0 ? (
            <>
              <motion.div
                layout
                className={`flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-4 ${windowWidth > 768 ? "max-w-[85vw]" : "max-w-[91%]"
                  } mx-auto gap-4 w-full flex-grow overflow-y-auto max-h-[80vh] pb-32`}
              >

                {dataKeys.map((dataKey) => (
                  <motion.div
                    key={dataKey}
                    layout
                    transition={{
                      layout: { duration: 0.35, type: "easeInOut" },
                    }}
                  >
                    <ChartPopup
                      key={dataKey.length < 10 ? dataKey + "" : dataKey}
                      data={diagramData[titleToIndexMap[dataKey]]}
                    />
                  </motion.div>
                ))}             <JoinedUniversalChart
                  diagramData={diagramData}
                  isExercise={false}
                />
              </motion.div>
            </>
          ) : (
            <div className="flex items-center justify-center w-full flex-grow rounded-md px-4">
              <div className="flex flex-col items-center space-y-2">
                <img
                  className="w-44 h-44"
                  src={StatisticsIcon}
                  alt="statistics"
                />

                <p className="text-lg">{mapKeys("No statistics found")}</p>
                <p className="text-center text-gray-700">
                  {mapKeys("Start using Phaero to see your statistics")}
                </p>
              </div>
            </div>
          )
        ) : exerciseDiagramData.length > 0 ? (
          <motion.div
            layout
            className={`flex flex-col lg:grid lg:grid-cols-2 xl:grid-cols-4 ${windowWidth > 768 ? "max-w-[65vw]" : "max-w-[91%]"
              } mx-auto gap-4 w-full flex-grow overflow-y-auto max-h-[80vh] pb-32`}
          >
            {/* <JoinedUniversalChart
              diagramData={
                diagramData.concat(exerciseDiagramData) as DiagramDataType[]
              }
              isExercise={diagramType !== "general"}
            /> */}
            {exerciseDataKeys
              .sort((a, b) => {
                if (isSearching) return 0;
                if (a < b) return -1;
                if (a > b) return 1;
                return 0;
              })
              .map((dataKey) => (
                <motion.div key={dataKey} {...motionDivAttributes}>
                  <ChartPopup
                    key={dataKey}
                    data={exerciseDiagramData[exerciseTitleToIndexMap[dataKey]]}
                    isExercise={true}
                  />
                </motion.div>
              ))}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center w-full flex-grow rounded-md px-4">
            <div className="flex flex-col items-center space-y-2">
              <img
                className="w-44 h-44"
                src={StatisticsIcon}
                alt="statistics"
              />

              <p className="text-lg">{mapKeys("No statistics found")}</p>
              <p className="text-center text-gray-700">
                {mapKeys("Start using Phaero to see your statistics")}
              </p>
            </div>
          </div>
        ))}
      {!advancedView && <div className="h-32 flex-shrink-0" />}
      <div className="flex justify-center">
        <Paper className="w-full max-w-xl px-4">
          {advancedView && nutritionData && (
            <Box
              component="div"
              sx={{
                width: "100%",
                overflowY: "auto",
                maxHeight: "90vh",
                marginX: "auto",
                maxWidth: "60vh",
                pb: 4,
              }}
            >
              <div className="flex items-center gap-2">
                <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
                  {mapKeys("Nutrition")}
                </Typography>
                <div className="flex relative w-full justify-between pt-4">
                  <FormControl
                    color="primary"
                    sx={{ m: 1, width: 180 }}
                    size="small"

                  >
                    <InputLabel id="demo-select-small-label">
                      {mapKeys("Timeframe")}
                    </InputLabel>
                    <Select
                      labelId="demo-select-small-label"
                      id="demo-select-small"
                      value={timeframe}
                      label="Nutrients"
                      onChange={(e) => {
                        setTimeframe(Number(e.target.value));
                      }}
                    >
                      <MenuItem value={7}>
                        {mapKeys("Last")} 7 {mapKeys("days")}
                      </MenuItem>
                      <MenuItem value={14}>
                        {mapKeys("Last")} 14 {mapKeys("days")}
                      </MenuItem>
                      <MenuItem value={30}>
                        {mapKeys("Last")} 30 {mapKeys("days")}
                      </MenuItem>
                      <MenuItem value={90}>
                        {mapKeys("Last")} 90 {mapKeys("days")}
                      </MenuItem>
                    </Select>
                  </FormControl>
                </div>
              </div>
              <Tabs
                value={currentlySelectedNutrition}
                onChange={handleChange}
                aria-label="Nutrition data tabs"
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab
                  label={mapKeys("Calories")}
                  value="basedOnPercentageOfDailyCalories"
                  {...tabProps(0)}
                />
                <Tab
                  label={mapKeys("Carbs")}
                  value="basedOnPercentageOfDailyCarbs"
                  {...tabProps(1)}
                />
                <Tab
                  label={mapKeys("Fat")}
                  value="basedOnPercentageOfDailyFat"
                  {...tabProps(2)}
                />
                <Tab
                  label={mapKeys("Protein")}
                  value="basedOnPercentageOfDailyProtein"
                  {...tabProps(3)}
                />
                <Tab
                  label={mapKeys("Sugar")}
                  value="basedOnPercentageOfDailySugar"
                  {...tabProps(4)}
                />
                <Tab
                  label={mapKeys("List of foods")}
                  value="listOfFoodsEveryDay"
                  {...tabProps(5)}
                />
              </Tabs>
              <Typography
                variant="h6"
                sx={{ mt: 2, mb: 1, display: "flex", justifyContent: "center" }}
              >
                {currentlySelectedNutrition === "listOfFoodsEveryDay"
                  ? mapKeys("Based on frequency of foods")
                  : `${mapKeys("Nutrition based on")} ${mapKeys(
                    showDailyOrTotal ? "daily" : "total"
                  )} ${mapKeys(
                    currentlySelectedNutrition.split("OfDaily")[1]
                  )}`}
              </Typography>
              <div className="justify-center grid grid-col-2">
                <div className="max-w-[250px] flex">
                  {" "}
                  <div className="flex ">
                    <Button
                      onClick={() =>
                        setThresholdForOther(thresholdForOther + 0.005)
                      }
                    >
                      <Add
                        size={theme.iconSize.medium}
                        color={theme.palette.primary.main}
                      />
                    </Button>
                    <Button
                      onClick={() =>
                        setThresholdForOther(thresholdForOther - 0.005)
                      }
                    >
                      <Minus size={theme.iconSize.medium} color={theme.palette.primary.error} />
                    </Button>
                  </div>
                  <TextField
                    label={mapKeys("Threshold for 'Other'")}
                    type="number"
                    value={thresholdForOther.toFixed(3)}
                    onChange={(e) =>
                      setThresholdForOther(Number(e.target.value))
                    }
                    sx={{ m: 1, width: 150 }}
                    size="small"
                  />
                </div>
                {currentlySelectedNutrition !== "listOfFoodsEveryDay" && (
                  <Paper className="max-h-10 flex justify-center align-middle">
                    <Button
                      onClick={() => setShowDailyOrTotal(!showDailyOrTotal)}
                    >
                      {showDailyOrTotal
                        ? mapKeys("Show total")
                        : mapKeys("Show daily")}
                    </Button>
                  </Paper>
                )}
              </div>
              <motion.div
                layout
                transition={{
                  layout: { duration: 0.35, type: "easeInOut" },
                }}
                className="flex justify-center"
              >
                <UniversalPieChart
                  percentages={
                    currentlySelectedNutrition === "listOfFoodsEveryDay"
                      ? convertListOfFoodsIntoPercentages(
                        nutritionData[currentlySelectedNutrition]
                      )
                      : convertNutritionDataIntoPercentages(
                        nutritionData[currentlySelectedNutrition]
                      )
                  }
                  thresholdForOther={thresholdForOther}
                />
              </motion.div>
            </Box>
          )}
        </Paper>
      </div>
    </div>
  );
}

export default StatisticsPage;
