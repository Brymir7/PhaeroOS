import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Button, Paper, Typography } from "@mui/material";
import StatisticsIcon from "../../assets/statistics.svg";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";

interface DiagramDataPoints {
  week: number;
  [key: string]: number;
}

export interface DeltaDiagramData {
  wellbeing: [DiagramDataPoints, DiagramDataPoints];
  exercise: [DiagramDataPoints, DiagramDataPoints];
  nutrition: [DiagramDataPoints, DiagramDataPoints];
  sleep: [DiagramDataPoints, DiagramDataPoints];
  [key: string]: [DiagramDataPoints, DiagramDataPoints];
}

interface Props {
  text: string;
  diagramData: DeltaDiagramData | undefined;
}

const FeedbackDeltaInformation = ({ text, diagramData }: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  const [relativeDiagramData, setRelativeDiagramData] = useState<
    DeltaDiagramData | undefined
  >(diagramData);
  const dataKeys = ["wellbeing", "exercise", "nutrition", "sleep"];
  const [currentDataKey, setCurrentDataKey] = useState<string>("wellbeing");
  const colorArray = [
    "#22C55e",
    "#36bdf8",
    "#F4E04D",
    "#ED6A5A",
    "#6E2594",
    "#E11D72",
  ];

  const getRelativeDiagramData = () => {
    if (!diagramData) return;
    const newRelativeDiagramData: DeltaDiagramData = {
      wellbeing: [{ week: 0 }, { week: 1 }],
      exercise: [{ week: 0 }, { week: 1 }],
      nutrition: [{ week: 0 }, { week: 1 }],
      sleep: [{ week: 0 }, { week: 1 }],
    };

    Object.keys(diagramData).forEach((category) => {
      const categoryData = diagramData[category];
      const totalValues: { [key: string]: number } = {};
      Object.keys(categoryData[0]).forEach((key) => {
        if (key !== "week") {
          totalValues[key] = categoryData[0][key] + categoryData[1][key];
          newRelativeDiagramData[category][0][key] =
            categoryData[0][key] / totalValues[key];
          newRelativeDiagramData[category][1][key] =
            categoryData[1][key] / totalValues[key];
        }
      });
    });

    return newRelativeDiagramData;
  };

  useEffect(() => {
    if (diagramData) setRelativeDiagramData(getRelativeDiagramData);
  }, [diagramData]);

  const mapKeysToUnit: { [key: string]: string } = {
    calories: "kcal",
    protein: "g",
    fat: "g",
    carbs: "g",
    sugar: "g",
    fluid: "l",
    duration: "h",
  };

  const RenderUnit = ({ item }: { item: string }) => {
    if (item in mapKeysToUnit) {
      return <p className="text-gray-700 ml-1">{mapKeysToUnit[item]}</p>;
    }
    return <></>;
  };

  const TooltipContent = (props: {
    active: unknown;
    payload: { payload: { [key: string]: number } }[];
    label: string;
  }) => {
    if (!props || !props.active || !props.payload || !diagramData) {
      return;
    } else {
      const data = props.payload[0].payload;
      return (
        <Paper className="p-2 flex flex-col space-y-2" elevation={2}>
          <p>{mapKeys(data.week === 1 ? "Current week" : `Last week`)}</p>
          <div className=" px-2 space-y-1">
            {Object.keys(data)
              .filter((key) => key !== "week")
              .map((key) => (
                <div className="flex justify-between" key={key}>
                  <p className="text-gray-700 w-full">{`${mapKeys(key)}: `}</p>
                  <p className="text-gray-900  font-bold ml-2">
                    {diagramData[currentDataKey][data.week][key].toFixed(
                      key === "duration" ? 1 : 0
                    )}
                  </p>
                  <RenderUnit item={key} />
                </div>
              ))}
          </div>
        </Paper>
      );
    }
  };

  const CustomLegend = (props: {
    payload: { color: string; value: string }[] | undefined;
  }) => {
    const { payload } = props;

    return (
      <ul
        className="grid grid-cols-2 text-sm"
        style={{ listStyle: "none", margin: 0, padding: 0 }}
      >
        {payload?.map(
          (entry: { color: string; value: string }, index: unknown) => (
            <li
              key={`item-${index}`}
              style={{ display: "flex", alignItems: "center", marginBottom: 0 }}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  backgroundColor: entry.color,
                  marginRight: 10,
                }}
              />
              <span>{mapKeys(entry.value)}</span>
            </li>
          )
        )}
      </ul>
    );
  };

  return (
    <div className="flex flex-col w-full h-full max-w-lg mx-auto pt-4 px-2">
      <div className="flex h-full w-full max-w-md">
        <Paper className="flex w-full h-full items-center justify-center">
          {text === "0" ? (
            <div>
              <img
                className="w-44 h-44"
                src={StatisticsIcon}
                alt="statistics"
              />
            </div>
          ) : (
            relativeDiagramData && (
              <div className="flex w-full h-full">
                <div className="flex w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={relativeDiagramData[currentDataKey]}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis
                        dataKey={"week"}
                        height={40}
                        tickMargin={10}
                        axisLine={false}
                        tickLine={false}
                        color="gray"
                        tickFormatter={(str) => {
                          return str === 1
                            ? mapKeys("Current week")
                            : mapKeys("Last week");
                        }}
                      />
                      {Object.keys(relativeDiagramData[currentDataKey][0])
                        .filter((key) => key !== "week")
                        .map((key, index) => (
                          <Bar
                            key={key}
                            dataKey={key}
                            fill={colorArray[index]}
                            maxBarSize={25}
                            radius={[2, 2, 0, 0]}
                          />
                        ))}

                      <CartesianGrid
                        stroke="gray"
                        opacity={0.3}
                        vertical={false}
                      />
                      <Legend
                        align="right"
                        verticalAlign="top"
                        content={<CustomLegend payload={undefined} />}
                      />

                      <Tooltip
                        // isAnimationActive={false}
                        cursor={{
                          stroke: "grey",
                          strokeWidth: 3,
                          opacity: 0.2,
                        }}
                        content={
                          <TooltipContent
                            active={undefined}
                            payload={[]}
                            label={""}
                          />
                        }
                      ></Tooltip>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col flex-shrink-0 h-full justify-center">
                  {dataKeys.map((key) => (
                    <Button
                      color="primary"
                      sx={{
                        px: currentDataKey === key ? "9px" : "8px",
                        borderRadius: "10px",
                        m: 1,
                      }}
                      variant={
                        currentDataKey === key ? "contained" : "outlined"
                      }
                      key={key}
                      onClick={() => setCurrentDataKey(key)}
                    >
                      <Typography sx={{ fontSize: 14 }}>
                        {mapKeys(key)}
                      </Typography>
                    </Button>
                  ))}
                </div>
              </div>
            )
          )}
        </Paper>
      </div>
      <div className="flex flex-shrink-0 py-4">
        <Typography>
          {text === "0"
            ? mapKeys("No weekly delta")
            : mapKeys("Has weekly delta")}
        </Typography>
      </div>
    </div>
  );
};

export default FeedbackDeltaInformation;
