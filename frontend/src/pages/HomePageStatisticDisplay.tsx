import { useContext, useEffect, useState } from "react";
import { useApi } from "../modules/apiAxios";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import { MapKeysContext } from "../components/contexts/MapKeysContext";
import { AuthContext } from "../components/contexts/AuthContext";
import { Paper, Typography, Grid } from "@mui/material";
import { motion } from "framer-motion";
import UniversalChart from "../components/statisticsPage/UniversalChart";
import { DiagramDataType } from "./StatisticsPage";
import StatisticsIcon from "../assets/statistics.svg";
import { JournalNoteContext } from "../components/contexts/JournalNoteContext";
const HomePageStatisticDisplay = () => {
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);
  const { hasAccess } = useContext(AuthContext);
  const [loading, setLoading] = useState<boolean>(true);
  const { note, editEntry } = useContext(JournalNoteContext);
  const [diagramData, setDiagramData] = useState([]);
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

  useEffect(() => {
    if (hasAccess) {
      fetchData();
    }
  }, [hasAccess, note, editEntry]);

  const fetchData = async () => {
    const apiEndpoint = `/diagrams/`;
    api
      .get(apiEndpoint)
      .then((response) => {
        const filteredData = response.data.data.filter((data: DiagramDataType) =>
          generalDiagramTitles.includes(data.title)
        );
        setDiagramData(filteredData);
        setLoading(false);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  if (loading) {
    return (
      <Paper elevation={3} className="p-4">
        <Typography variant="h6">{mapKeys("Loading statistics...")}</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={3}
      className="w-full"
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "20px",
        padding: "16px",
        minHeight: window.innerWidth < 1900 ? window.innerHeight < 1000 ? "60%" : "67.8%" : "79%",
        maxHeight: "50%",
        minWidth: "400px",
        overflowY: "auto",
        paddingBottom: "16px",
        overflowX: "hidden",
      }}
    >
      {diagramData.length > 0 ? <Grid container spacing={2}>
        {diagramData.slice(0, 8).map((data: any, index) => (
          <Grid item sm={6} key={index}>
            <Paper elevation={4}>
              <motion.div
                layout
                transition={{ duration: 0.35, type: "easeInOut" }}
              >
                <div className="flex justify-between">
                  <Typography
                    variant="h5"
                    className="flex justify-center pt-3 px-4 pb-2"
                  >
                    {mapKeys(data.title)}
                  </Typography>
                </div>
                <div className="flex h-64 pr-3" id="myChart">
                  <UniversalChart
                    timeframe={7}
                    diagramData={data}
                    chartType={"line"}
                  />
                </div>
              </motion.div>
            </Paper>
          </Grid>
        ))}
      </Grid> : (
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
      )}
    </Paper>
  );
};

export default HomePageStatisticDisplay;
