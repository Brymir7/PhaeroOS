import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  ReferenceDot,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useContext, useEffect, useState } from "react";
import { DiagramDataType } from "../../pages/StatisticsPage";
import { Paper, Typography, useTheme } from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useWindowWidth } from "../utils/CustomHooks";

interface Props {
  timeframe: number;
  diagramData: DiagramDataType | undefined;
  chartType?: "line" | "bar";
  overWriteWidth?: string;
}

const UniversalChart = ({
  timeframe = 7,
  diagramData,
  chartType = "line",
  overWriteWidth,
}: Props) => {
  const [slicedData, setSlicedData] = useState<{ [key: string]: number }[]>([]);
  const { mapKeys } = useContext(MapKeysContext);

  useEffect(() => {
    //convert object to array recharts understands
    diagramData &&
      setSlicedData(
        diagramData.data.slice(diagramData.data.length - timeframe)
      );
  }, [diagramData, timeframe]);
  const keys = diagramData ? Object.keys(diagramData.data[0]) : [];
  const yKeys = keys.filter((key) => key !== "date");
  const colorArray = ["#22C55e", "#36bdf8", "#F4E04D", "#ED6A5A", "#6E2594"];
  const theme = useTheme();
  const randomColorArray: string[] = [
    // "#22C55e",
    // "#6E2594",
    // "#FF6B6B",
    // "#6C5B7B",
    // "#FF5E5B",
    // "#FF0000",
    // "#0000FF",
    // "#191970",
    // "#36bdf8",
    // "#ED6A5A",
    // "#FF00FF",
    // "#556B2F",
    theme.palette.primary.main,
  ];
  const windowWidth = useWindowWidth();
  const mapNumberToYLabelWidth = (maxValue: number) => {
    const isSmall = windowWidth < 600;
    if (maxValue === 0) return isSmall ? 45 : 45;
    if (maxValue < 10) return isSmall ? 25 : 25;
    if (maxValue < 100) return isSmall ? 35 : 35;
    if (maxValue < 1000) return isSmall ? 45 : 55;
    if (maxValue < 10000) return isSmall ? 55 : 85;
    if (maxValue < 100000) return isSmall ? 65 : 85;
    return 90;
  }
  function getRandomColor(statistic: string): string {
    // if (localStorage.getItem(statistic)) {
    //   return localStorage.getItem(statistic) as string;
    // }
    const randomIndex = Math.floor(Math.random() * randomColorArray.length);
    localStorage.setItem(statistic, randomColorArray[randomIndex]);
    return randomColorArray[randomIndex];
  }
  const TooltipContent = (props: {
    active: unknown;
    payload: { payload: { [key: string]: number } }[];
    label: string;
  }) => {
    if (!props.active || !props.payload) {
      return;
    } else {
      const data = props.payload[0].payload;
      return (
        <Paper className="p-2 flex flex-col space-y-2" elevation={2}>
          <Typography>{format(parseISO(props.label), "eeee, d MMM")}</Typography>
          <div className=" px-2 space-y-1">
            {yKeys.map((key) => (
              <div className="flex justify-between" key={key}>
                <Typography className="pr-2">{`${mapKeys(key)}: `}</Typography>
                <Typography className=" font-bold ml-2">
                  {data[key].toFixed(2)}{" "}
                  {diagramData && diagramData.unit
                    ? mapKeys(diagramData.unit)
                    : ""}
                </Typography>
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
      <div className="py-2 px-2">
        <ul
          className="grid grid-cols-1 text-sm"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
        >
          {payload?.map(
            (entry: { color: string; value: string }, index: number) => (
              <li
                key={`item-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: "8px",
                  marginBottom: 0,
                }}
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
      </div>
    );
  };
  interface DataItem {
    [key: string]: number | string;
  }

  const findExtremes = (data: DataItem[], keys: string[]) => {
    if (keys.length > 1) {
      return {
        minDate: undefined,
        minValue: 0,
        maxDate: undefined,
        maxValue: 0,
      };
    }
    const key = keys[0];
    let minValue = Number.MAX_VALUE;
    let maxValue = Number.MIN_VALUE;
    let minDate: string | undefined, maxDate: string | undefined;

    // eslint-disable-next-line react/prop-types
    data.forEach((d: { [key: string]: number | string }) => {
      const value = Number(d[key]); // Convert the value to a number
      if (value < minValue) {
        minValue = value;
        minDate = String(d.date); // Convert the date to a string
      }
      if (value > maxValue) {
        maxValue = value;
        maxDate = String(d.date); // Convert the date to a string
      }
    });

    return { minDate, minValue, maxDate, maxValue };
  };

  const { minDate, minValue, maxDate, maxValue } = findExtremes(
    slicedData,
    yKeys
  );
  return (
    <div className={!overWriteWidth?.length ? "w-[500px] pr-2" : overWriteWidth}>
      <ResponsiveContainer
        width={"100%"}
        height={"100%"}
        className={"relative "}
      >
        {chartType === "line" ? (
          <LineChart data={slicedData}>
            {yKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={
                  yKeys.length > 1 && index < colorArray.length
                    ? colorArray[index]
                    : getRandomColor(key)
                }
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 1, stroke: "black" }}
                isAnimationActive={false}
              />
            ))}

            <XAxis
              dataKey="date"
              height={30}
              tickMargin={5}
              axisLine={false}
              tickLine={false}
              color="gray"
              tickFormatter={(str) => {
                const date = parseISO(str);
                return format(date, "d");
              }}
            // label={{
            //   value: mapKeys("Date"),
            //   angle: 0,
            //   position: "insideBottom",
            //   offset: -20,
            // }}
            // ticks={5}
            />
            <YAxis
              width={mapNumberToYLabelWidth(maxValue)}
              tickMargin={5}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            // label={{
            //   value: diagramData?.unit ? mapKeys(diagramData.unit) : "",
            //   angle: -45,
            //   position: "insideLeft",
            //   offset: 10,
            //   style: { textAnchor: "start" },
            // }}
            />
            {!(yKeys.length > 1) && slicedData.length >= 7 && (
              <>
                <ReferenceDot
                  x={minDate}
                  y={minValue}
                  r={4}
                  label={{
                    position: "top",
                    value: `${minValue.toFixed(2)}`,
                  }}
                  fill={
                    yKeys.length > 1 ? colorArray[0] : getRandomColor(yKeys[0])
                  }
                />
                <ReferenceDot
                  x={maxDate}
                  y={maxValue}
                  label={{
                    position: "top",
                    value: `${maxValue.toFixed(2)}`,
                  }}
                  r={4}
                  fill={
                    yKeys.length > 1 ? colorArray[0] : getRandomColor(yKeys[0])
                  }
                />
              </>
            )}
            <CartesianGrid stroke="gray" opacity={0.3} vertical={false} />
            <Legend
              verticalAlign="bottom"
              align="center"
              content={<CustomLegend payload={undefined} />}
            />
            <Tooltip
              // isAnimationActive={false}
              cursor={{ stroke: "grey", strokeWidth: 3, opacity: 0.2 }}
              content={
                <TooltipContent active={undefined} payload={[]} label={""} />
              }
            ></Tooltip>
          </LineChart>
        ) : (
          <BarChart data={slicedData}>
            {yKeys.map((key, index) => (
              <Bar
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colorArray[index]}
                strokeWidth={2}
                fill={colorArray[index]}
                stackId={"1"}
                isAnimationActive={false}
              />
            ))}
            <XAxis
              height={40}
              tickMargin={10}
              dataKey={"date"}
              axisLine={false}
              tickLine={false}
              tickFormatter={(str) => {
                const date = parseISO(str);
                return format(date, "d");
              }}
              tickCount={5}
            />
            <YAxis
              width={40}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              tickCount={5}
            />
            <CartesianGrid
              stroke="grey"
              strokeDasharray="3 3"
              opacity={0.3}
              vertical={false}
            />
            <Tooltip
              isAnimationActive={false}
              cursor={{ stroke: "grey", strokeWidth: 3, opacity: 0.2 }}
              content={
                <TooltipContent active={undefined} payload={[]} label={""} />
              }
            ></Tooltip>
            <Legend
              verticalAlign="top"
              align="right"
            // content={<CustomLegend payload={[]} />}
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default UniversalChart;
