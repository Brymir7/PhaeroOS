import { Grid, Typography } from "@mui/material";
import { getIntensityScaledColor } from "../goalsPage/types";
import { useThemeContext } from "../../ThemeContext";

type MonthDisplayProps = {
  monthCompletions: boolean[] | number[];
  color: string;
  maxValue?: number;
  showDays?: boolean;
};
const MonthDisplay = ({
  monthCompletions,
  color,
  maxValue,
  showDays,
}: MonthDisplayProps) => {
  const days = monthCompletions;
  const { isDarkMode } = useThemeContext();

  const defaultColor = isDarkMode ? "bg-white" : "bg-gray-300";
  const getColor = (day: number | boolean) => {
    if (typeof day === "boolean") {
      return day ? color : defaultColor;
    } else {
      return getIntensityScaledColor(day as number, maxValue as number, color);
    }
  };
  return (
    <Grid container spacing={1}>
      {days.map((day, index) => (
        <Grid item key={index}>
          <div
            className={`${getColor(day)} flex justify-center align-middle items-center`}
            style={{ width: "20px", height: "20px", borderRadius: "20%" }}
          >
            {showDays && <Typography fontSize={18} color={isDarkMode ? "#000" : "fff"}>{index + 1}</Typography>}
          </div>
        </Grid>
      ))}
    </Grid>
  );
};

export default MonthDisplay;
