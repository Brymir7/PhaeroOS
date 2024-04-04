import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useContext } from "react";

// Register the required components and plugin
ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);
interface Props {
  percentages: { [key: string]: number; };
  backgroundColors?: string[];
  hoverBackgroundColors?: string[];
  thresholdForOther?: number;
  useMapKeys?: boolean;
}

const UniversalPieChart = ({
  percentages,
  backgroundColors = [
    "#b5093c",
    "#75c5ed",
    "#fab908",
    "#4BC0C0",
    "#9966FF", // 5 colors
    "#FF9F40",
    "#FF6384",
    "#4BC0C0",
    "#FFCD56",
    "#C9CB3A", // 10 colors
    "#FF9F80",
    "#FF6380",
    "#36A2EA",
    "#B9E3AE",
    "#B77BFF", // 15 colors
    "#9DB7F5",
    "#FF906B",
    "#B2912F",
    "#80D0C7",
    "#808080", // 20 colors
  ], // Yellow, Orange, Blue
  hoverBackgroundColors = [
    "#b5093c",
    "#75c5ed",
    "#fab908",
    "#4BC0C0",
    "#9966FF", // 5 colors
    "#FF9F40",
    "#FF6384",
    "#4BC0C0",
    "#FFCD56",
    "#C9CB3A", // 10 colors
    "#FF9F80",
    "#FF6380",
    "#36A2EA",
    "#B9E3AE",
    "#B77BFF", // 15 colors
    "#9DB7F5",
    "#FF906B",
    "#B2912F",
    "#80D0C7",
    "#808080", // 20 colors
  ],
  thresholdForOther = 0.05,
  useMapKeys = false,
}: Props) => {
  let othersTotal = 0;
  const filteredData = Object.keys(percentages).filter(key => {
    if (percentages[key] <= thresholdForOther) {
      othersTotal += percentages[key];
      return false;
    }
    return true;
  });
  const { mapKeys } = useContext(MapKeysContext);

  const labels = [...filteredData];
  if (othersTotal > 0) {
    labels.push(mapKeys("Other"));
  }
  const dataValues = filteredData.map(key => percentages[key]);
  if (othersTotal > 0) {
    dataValues.push(othersTotal);
  }
  const data = {
    labels: useMapKeys ? labels.map(label => mapKeys(label)) : labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        hoverBackgroundColor: hoverBackgroundColors,
      },
    ],
  };
  const options = {
    plugins: {
      // Configure datalabels plugin
      datalabels: {
        anchor: "end" as const,
        align: 'start' as const,
        color: "black", // Text color
        font: {
          size: 18, // Font size
        },
        formatter: (value: number, ) => {
          return (
            `${(Number(value.toFixed(2)) * 100).toFixed(0)}%`
          );
        },
      },
    },
  };

  return <Pie data={data} options={options} />;
};

export default UniversalPieChart;
