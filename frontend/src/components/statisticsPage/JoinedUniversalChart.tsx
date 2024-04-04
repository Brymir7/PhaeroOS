import { useState, useEffect, useContext } from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Paper,
  IconButton,
  Dialog,
  DialogActions,
} from "@mui/material";
import UniversalChart from "./UniversalChart";
import { MapKeysContext } from "../contexts/MapKeysContext";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { DiagramDataType } from "../../pages/StatisticsPage";
import { Card, CardContent, Grid } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
interface JoinedUniversalChartProps {
  diagramData: DiagramDataType[];
  isExercise: boolean;
}

const JoinedUniversalChart = ({
  diagramData,
  isExercise,
}: JoinedUniversalChartProps) => {
  const { mapKeys, mapExercises } = useContext(MapKeysContext);
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [timeframe, setTimeframe] = useState<number>(7);
  const [normalizeData, setNormalizeData] = useState<boolean>(false);

  const [combinedData, setCombinedData] = useState<DiagramDataType>({
    title: "Combined Data",
    data: [],
  });
  const [correlations, setCorrelations] = useState<{ [key: string]: number }>(
    {}
  );
  useEffect(() => {
    const newCombinedData = combineSelectedData();
    setCombinedData(newCombinedData);
    calculateCorrelations(newCombinedData.data);
  }, [selectedTitles, normalizeData, timeframe]);

  const combineSelectedData = () => {
    const combined: { [date: string]: { [key: string]: number } } = {};
    const minMaxValues: { [key: string]: { min: number; max: number } } = {};

    // Initialize minMaxValues
    diagramData.forEach((diagram) => {
      if (selectedTitles.includes(diagram.title)) {
        diagram.data.forEach((datum, index) => {
          if (index < diagram.data.length - timeframe) {
            return
          }
          Object.keys(datum).forEach((key) => {
            if (key !== "date") {
              if (!minMaxValues[`${diagram.title} ${key}`]) {
                minMaxValues[`${diagram.title} ${key}`] = {
                  min: Infinity,
                  max: -Infinity,
                };
              }
              if (datum[key] < minMaxValues[`${diagram.title} ${key}`].min) {
                minMaxValues[`${diagram.title} ${key}`].min = datum[key];
              }
              if (datum[key] > minMaxValues[`${diagram.title} ${key}`].max) {
                minMaxValues[`${diagram.title} ${key}`].max = datum[key];
              }
            }
          });
        });
      }
    });

    diagramData.forEach((diagram) => {
      if (selectedTitles.includes(diagram.title)) {
        diagram.data.forEach((datum, index) => {
          if (index < diagram.data.length - timeframe) {
            return
          }
          const date = datum.date;
          if (!combined[date]) {
            combined[date] = { date };
          }
          Object.keys(datum).forEach((key) => {
            if (key !== "date") {
              const normalizedValue = normalizeData
                ? (datum[key] - minMaxValues[`${diagram.title} ${key}`].min) /
                (minMaxValues[`${diagram.title} ${key}`].max -
                  minMaxValues[`${diagram.title} ${key}`].min)
                : datum[key];
              combined[date][`${key}`] = normalizedValue;
            }
          });
        });
      }
    });

    return {
      title: "Combined Data",
      data: Object.values(combined),
    };
  };
  const calculateCorrelations = (data: any[]) => {
    const newCorrelations: { [key: string]: number } = {};
    if (data.length > 0) {
      const keys = Object.keys(data[0]).filter((key) => key !== "date");
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const key1 = keys[i];
          const key2 = keys[j];
          const correlation = computeCorrelation(data, key1, key2);
          newCorrelations[`${mapKeys(key1)} & ${mapKeys(key2)}`] = correlation;
        }
      }
    }
    setCorrelations(newCorrelations);
  };

  const computeCorrelation = (data: any[], key1: string, key2: string) => {
    let sum1 = 0,
      sum2 = 0,
      sum1Sq = 0,
      sum2Sq = 0,
      pSum = 0;
    const n = data.length;
    let currIdx = 0
    for (const item of data) {
      if (currIdx < data.length - timeframe) {
        currIdx++
        continue
      }
      const x = item[key1];
      const y = item[key2];
      sum1 += x;
      sum2 += y;
      sum1Sq += x * x;
      sum2Sq += y * y;
      pSum += x * y;
    }
    const num = pSum - (sum1 * sum2) / n;
    const den = Math.sqrt(
      (sum1Sq - (sum1 * sum1) / n) * (sum2Sq - (sum2 * sum2) / n)
    );
    return den ? num / den : 0;
  };
  const handleTitleChange = (event: any) => {
    const selectedValues = event.target.value;
    if (selectedValues.length > 2) {
      setIsFullScreenView(true);
    }

    // Calculate averages and check for normalization
    const averages = selectedValues.map((title: string) => {
      const data = diagramData.find((d) => d.title === title)?.data || [];
      const total = data.reduce((sum, item) => {
        // Extract numerical values from the item
        const numericalValues = Object.values(item).filter(
          (v): v is number => typeof v === "number"
        );
        // Sum up the numerical values
        const itemSum = numericalValues.reduce((a, b) => a + b, 0);
        return sum + itemSum;
      }, 0);
      const count = data.length;
      return count ? total / count : 0;
    });

    const maxAverage = Math.max(...averages);
    const minAverage = Math.min(...averages);
    if (maxAverage - minAverage > 100) {
      // Arbitrary threshold, if avgs are too far apart, normalize
      setNormalizeData(true);
    } else {
      setNormalizeData(false);
    }

    setSelectedTitles(selectedValues);
  };
  const [isFullScreenView, setIsFullScreenView] = useState<boolean>(false);
  const correlationDescription = (value: number) => {
    if (value > 0.7) return "Strong positive correlation";
    if (value > 0.3) return "Moderate positive correlation";
    if (value > -0.3) return "Weak or no correlation";
    if (value > -0.7) return "Moderate negative correlation";
    return "Strong negative correlation";
  };

  return (
    <>
      <Dialog
        fullScreen
        open={isFullScreenView}
        onClose={() => {
          setIsFullScreenView(false);
          setSelectedTitles([]);
        }}
      >
        <>
          <Typography variant="h5" className="flex justify-center pt-3 px-4">
            {mapKeys("Smart Chart")}
          </Typography>
          <FormControl fullWidth sx={{ m: 1, minWidth: 50 }}>
            <InputLabel id="select-multiple-titles-label">
              {mapKeys("Select Diagrams")}
            </InputLabel>
            <Select
              labelId="select-multiple-titles-label"
              id="select-multiple-titles"
              multiple
              value={selectedTitles}
              onChange={handleTitleChange}
              renderValue={(selected) => selected.join(", ")}
            >
              {diagramData.map((diagram) => (
                <MenuItem key={diagram.title} value={diagram.title}>
                  {isExercise
                    ? mapExercises(diagram.title)
                    : mapKeys(diagram.title)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="normalize-data-label">
              {mapKeys("Normalize Data")}
            </InputLabel>
            <Select
              labelId="normalize-data-label"
              id="normalize-data"
              value={normalizeData}
              onChange={(e) => setNormalizeData(e.target.value === "true")}
            >
              <MenuItem value={"true"}>{mapKeys("Yes")}</MenuItem>
              <MenuItem value={"false"}>{mapKeys("No")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl color="primary" sx={{ m: 1, width: 180 }} size="small">
            <InputLabel id="demo-select-small-label">
              {mapKeys("Timeframe")}
            </InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={timeframe}
              label="Timeframe"
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
          {combinedData.data.length > 0 && (
            <>
              <div className={`flex h-screen w-screen m-2 mt-4  ${window.innerWidth < 768 ? "flex-col" : ""}`}>
                <div className="h-full w-[95%] mx-auto flex min-h-[300px] ">
                  <UniversalChart
                    timeframe={timeframe}
                    diagramData={combinedData}
                    chartType="line"
                    overWriteWidth="w-full"
                  />
                </div>
                <Box component="div" sx={{ m: 2 }}>
                  <Typography variant="h6">
                    {mapKeys("Correlations")}
                  </Typography>
                  <div className="overflow-y-auto h-[50vh] max-w-[30vh] pr-4">
                    <Grid container spacing={2}>
                      {Object.entries(correlations).map(([keys, value]) => (
                        <Grid item xs={12} sm={12} md={12} key={keys}>
                          <Card
                            sx={{
                              backgroundColor:
                                value > 0.7
                                  ? "lightgreen"
                                  : value > 0.3
                                    ? "lightyellow"
                                    : value > -0.3
                                      ? "lightgray"
                                      : value > -0.7
                                        ? "lightcoral"
                                        : "lightpink",
                            }}
                          >
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                sx={{ fontWeight: "bold" }}
                              >
                                {keys}
                              </Typography>
                              <Typography variant="h6">
                                {value.toFixed(2)}{" "}
                                {value > 0.3 ? (
                                  <TrendingUpIcon color="info" />
                                ) : value < -0.3 ? (
                                  <TrendingDownIcon color="error" />
                                ) : (
                                  <TrendingFlatIcon color="action" />
                                )}
                              </Typography>
                              <Typography variant="body2">
                                {mapKeys(correlationDescription(value))}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </div>
                </Box>
              </div>
            </>
          )}

          <DialogActions>
            {" "}
            <IconButton
              onClick={() => {
                setIsFullScreenView(false);
                setSelectedTitles([]);
              }}
              size="large"
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <Typography>{mapKeys("Close")}</Typography>
              <FullscreenExitIcon />
            </IconButton>
          </DialogActions>
        </>
      </Dialog>

      <Paper elevation={2}>
        <Box
          component="div"
          sx={{ width: "100%", overflowY: "auto", maxHeight: "80vh", pb: 4 }}
        >
          <Typography
            variant="h5"
            sx={{
              pl: 2,
              mt: 1,
              mb: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {mapKeys("Smart Chart")}
            <IconButton
              onClick={() => setIsFullScreenView(true)}
              size="large"
              sx={{ display: "flex", gap: 0.25, paddingRight: 1 }}
            >
              {
                <>
                  <Typography>{mapKeys("Expand")}</Typography>
                  <FullscreenIcon />{" "}
                </>
              }
            </IconButton>
          </Typography>

          <FormControl fullWidth sx={{ m: 1, minWidth: 50, maxWidth: 200 }}>
            <InputLabel id="select-multiple-titles-label">
              {mapKeys("Select Diagrams")}
            </InputLabel>
            <Select
              labelId="select-multiple-titles-label"
              id="select-multiple-titles"
              multiple
              value={selectedTitles}
              onChange={handleTitleChange}
              renderValue={(selected) => selected.join(", ")}
            >
              {diagramData.map((diagram) => (
                <MenuItem key={diagram.title} value={diagram.title}>
                  {isExercise
                    ? mapExercises(diagram.title)
                    : mapKeys(diagram.title)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="normalize-data-label">
              {mapKeys("Normalize Data")}
            </InputLabel>
            <Select
              labelId="normalize-data-label"
              id="normalize-data"
              value={normalizeData}
              onChange={(e) => setNormalizeData(e.target.value === "true")}
            >
              <MenuItem value={"true"}>{mapKeys("Yes")}</MenuItem>
              <MenuItem value={"false"}>{mapKeys("No")}</MenuItem>
            </Select>
          </FormControl>
          <FormControl color="primary" sx={{ m: 1, width: 180 }} size="small">
            <InputLabel id="demo-select-small-label">
              {mapKeys("Timeframe")}
            </InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={timeframe}
              label="Timeframe"
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
          {combinedData.data.length > 0 ? (
            <>
              <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
                <UniversalChart
                  timeframe={timeframe}
                  diagramData={combinedData}
                  chartType="line"
                  overWriteWidth="w-full"
                />
              </div>
              <Box component="div" sx={{ m: 2 }}>
                <Typography variant="h6">{mapKeys("Correlations")}</Typography>
                {Object.entries(correlations).map(([keys, value]) => (
                  <Typography key={keys}>
                    {keys}: {value.toFixed(2)}
                  </Typography>
                ))}
              </Box>
            </>
          ) : (
            <Typography variant="h6" sx={{ textAlign: "center", mt: 2 }}>
              {mapKeys("No Diagram Selected")}
            </Typography>
          )}
        </Box>
      </Paper>
    </>
  );
};

export default JoinedUniversalChart;
