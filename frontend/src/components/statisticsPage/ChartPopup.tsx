import { useState, useEffect, useContext } from "react";
import { DiagramDataType } from "../../pages/StatisticsPage";
import UniversalChart from "./UniversalChart";
import { AnimatePresence, motion } from "framer-motion";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  IconButton,
  DialogActions,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import { MapKeysContext } from "../contexts/MapKeysContext";


interface Props {
  data: DiagramDataType;
  isExercise?: boolean;
}

const ChartPopup = ({ data, isExercise = false }: Props) => {
  const [open, setOpen] = useState(false); //if this diagram shows extra info
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [timeframe, setTimeframe] = useState<number>(7);
  const { mapKeys, mapExercises } = useContext(MapKeysContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [orderedKeys, setOrderedKeys] = useState<string[]>([]);

  useEffect(() => {
    const keys = data.data.length > 0 ? Object.keys(data.data[0]) : [];
    const yKeys = keys.filter((key) => key !== "date");
    setOrderedKeys(yKeys);
  }, [data]);

  useEffect(() => {
    setSelectedKey(orderedKeys[0]);
  }, [orderedKeys]);

  //calculate extra information
  const splicedData: { [x: string]: number }[] = data.data.slice(
    data.data.length - timeframe
  );
  const maxValue = (valueName: string) => {
    let max = 0;
    splicedData.forEach((datum: { [x: string]: number }) => {
      if (datum[valueName] > max) {
        max = datum[valueName];
      }
    });
    return max;
  };
  const minValue = (valueName: string) => {
    let min = Infinity;
    splicedData.forEach((datum: { [x: string]: number }) => {
      if (datum[valueName] < min) {
        min = datum[valueName];
      }
    });
    return min;
  };
  const average = (valueName: string) => {
    let sum = 0;
    splicedData.forEach((datum: { [x: string]: number }) => {
      sum += datum[valueName];
    });
    return sum / splicedData.length;
  };
  const deviation = (valueName: string) => {
    let sum = 0;
    splicedData.forEach((datum: { [x: string]: number }) => {
      sum += Math.pow(datum[valueName] - average(valueName), 2);
    });
    return Math.sqrt(sum / splicedData.length);
  };

  const mapExerciseTitle = (title: string) => {
    const words = title.split(" ");
    if (words.length > 1) {
      const lastWord = words.pop();
      return mapExercises(words.join(" ")) + " " + mapKeys(lastWord ?? "");
    } else {
      return mapKeys(title);
    }
  };
  const [fullScreenView, setFullScreenView] = useState(false);

  return (
    <>
      <Dialog
        open={fullScreenView}
        onClose={() => setFullScreenView(false)}
        fullScreen={true}
      >
        <Typography variant="h5" className="flex justify-center pt-7">
          {isExercise ? mapExerciseTitle(data.title) : mapKeys(data.title)}
        </Typography>
        <div className="flex h-screen w-[92%] m-2 mt-4">
          <UniversalChart
            timeframe={timeframe}
            diagramData={data}
            chartType={"line"}
            overWriteWidth="w-full"
          />
        </div>
        <div className="flex relative w-full justify-center pt-4">
          <FormControl
            color="primary"
            sx={{
              m: 1,
              width: 180,
            }}
            size="small"
          >
            <InputLabel id="demo-select-small-label">
              {mapKeys("Category")}
            </InputLabel>
            <Select
              labelId="demo-select-small-label"
              id="demo-select-small"
              value={selectedKey}
              label="Nutrients"
              onChange={(e) => {
                setSelectedKey(e.target.value);
              }}
            >
              {orderedKeys.map((key) => (
                <MenuItem key={key} value={key}>
                  {key}
                </MenuItem>
              ))}
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

        <div
          className={
            !isMobile
              ? "flex justify-center gap-x-3 gap-y-3 text-xs"
              : "grid grid-cols-2 mx-auto gap-3"
          }
        >
          <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
            {mapKeys("Average")}: {average(selectedKey).toFixed(2)}
          </p>
          <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
            {mapKeys("Deviation")}: {deviation(selectedKey).toFixed(2)}
          </p>
          <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
            {mapKeys("Peak")}: {maxValue(selectedKey).toFixed(2)}
          </p>
          <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
            {mapKeys("Lowest")}: {minValue(selectedKey).toFixed(2)}
          </p>
        </div>

        <div className="h-4"></div>
        <DialogActions>
          {" "}
          <IconButton
            onClick={() => setFullScreenView(false)}
            size="large"
            sx={{ position: "absolute", right: 0, top: 0 }}
          >
            <Typography>{mapKeys("Close")}</Typography>
            <FullscreenExitIcon />
          </IconButton>
        </DialogActions>
      </Dialog>
      <Paper elevation={2} className="flex flex-col mx-auto overflow-hidden">
        <div
          className="flex flex-col cursor-pointer"
          onClick={() => setOpen(!open)}
        >
          <div className="flex justify-between">
            <Typography variant="h5" className="flex justify-center pt-3 px-4 pb-2">
              {isExercise ? mapExerciseTitle(data.title) : mapKeys(data.title)}
            </Typography>

            <IconButton
              onClick={() => setFullScreenView(true)}
              size="large"
              sx={{ display: "flex", gap: 0.25, paddingRight: 1 }}
            >
              {isExercise
                ? mapExerciseTitle(data.title).length < 13 && (
                  <Typography>{mapKeys("Expand")}</Typography>
                )
                : mapKeys(data.title).length < 13 && (
                  <Typography>{mapKeys("Expand")}</Typography>
                )}
              {fullScreenView ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </div>

          <div className="flex h-64 mt-4" id="myChart">
            <UniversalChart
              timeframe={timeframe}
              diagramData={data}
              chartType={"line"}
            />
          </div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col px-3 xsm:px-2 -4 border-[#e8e8e8]"
            >
              <div className="flex relative w-full justify-between pt-4">
                <FormControl
                  color="primary"
                  sx={{
                    m: 1,
                    width: 180,
                  }}
                  size="small"
                >
                  <InputLabel id="demo-select-small-label">
                    {mapKeys("Category")}
                  </InputLabel>
                  <Select
                    labelId="demo-select-small-label"
                    id="demo-select-small"
                    value={selectedKey}
                    label="Nutrients"
                    onChange={(e) => {
                      setSelectedKey(e.target.value);
                    }}
                  >
                    {orderedKeys.map((key) => (
                      <MenuItem key={key} value={key}>
                        {key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

              <div className="grid mt-4 grid-cols-2 gap-x-2 xsm:gap-x-4 gap-y-3 text-xs">
                <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
                  {mapKeys("Average")}: {average(selectedKey).toFixed(2)}
                </p>
                <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
                  {mapKeys("Deviation")}: {deviation(selectedKey).toFixed(2)}
                </p>
                <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
                  {mapKeys("Peak")}: {maxValue(selectedKey).toFixed(2)}
                </p>
                <p className="toggle_data" style={{ backgroundColor: theme.palette.background.paper }}>
                  {mapKeys("Lowest")}: {minValue(selectedKey).toFixed(2)}
                </p>
              </div>

              <div className="h-4"></div>
            </motion.div>
          )}
        </AnimatePresence>
      </Paper>
    </>
  );
};

export default ChartPopup;
