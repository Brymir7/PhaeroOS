import { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import UniversalChart from "../statisticsPage/UniversalChart";
import { DiagramDataType } from "../../pages/StatisticsPage";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import StatisticsIcon from "../../assets/statistics.svg";
import { AuthContext } from "../contexts/AuthContext";
import { faArrowRight, faChartSimple } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button, Paper, Typography } from "@mui/material";

function HomePageChart() {
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [diagramData, setDiagramData] = useState<DiagramDataType[] | undefined>(
    undefined
  );
  const [displayedData, setDisplayedData] = useState<
    DiagramDataType | undefined
  >(undefined);
  const api = useApi();
  const { hasAccess } = useContext(AuthContext);

  useEffect(() => {
    if (hasAccess) diagramRequest();
  }, [hasAccess]);

  const generalDiagramTitles = [
    "Wellbeing",
    // "Sleep",
    // "Activity Level",
    // "Steps",
    // "Calories",
    // "Nutrition",
    // "Hydration",
    // "Weight",
  ];

  useEffect(() => {
    if (diagramData && diagramData.length > 0) {
      const randomTitle =
        generalDiagramTitles[
          Math.floor(Math.random() * generalDiagramTitles.length)
        ];
      const foundData = diagramData.find((data) => data.title === randomTitle);

      if (foundData) {
        setDisplayedData(foundData);
      } else {
        setDisplayedData(
          diagramData.find((data) => data.title === "Wellbeing") ||
            diagramData[0]
        );
      }
    }
  }, [diagramData]);

  const diagramRequest = async () => {
    const apiEndpoint = `/diagrams/`;

    api
      .get(apiEndpoint)
      .then((response) => {
        setDiagramData([]);
        response.data.data.forEach((data: DiagramDataType) => {
          setDiagramData((diagramData) => {
            if (diagramData) {
              return [...diagramData, data];
            } else return [data];
          });
        });
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  return (
    <Paper elevation={2} className="flex flex-col w-full h-full">
      {diagramData &&
        (displayedData ? (
          <>
            <div className="flex items-center justify-between text-xl pt-2 px-4 ">
              <Typography variant="h6">
                <FontAwesomeIcon icon={faChartSimple} className="mr-2" />
                {mapKeys(displayedData.title)}
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                component={RouterLink}
                to="/home/statistics"
                endIcon={<FontAwesomeIcon size="sm" icon={faArrowRight} />}
              >
                {mapKeys("more")}
              </Button>
            </div>
            <Paper
              className="flex min-h-[86%] max-w-[92%] mx-auto p-1"
              id="myChart"
              elevation={2}
            >
              <UniversalChart timeframe={14} diagramData={displayedData} />
            </Paper>
          </>
        ) : (
          <div className="flex flex-col my-auto items-center space-y-2">
            <img className="w-44" src={StatisticsIcon} alt="statistics" />
            <p className="text-lg">{mapKeys("No statistics found")}</p>
            <p className="text-center text-gray-800">
              {mapKeys("Start using Phaero to see your statistics")}
            </p>
          </div>
        ))}
    </Paper>
  );
}

export default HomePageChart;
