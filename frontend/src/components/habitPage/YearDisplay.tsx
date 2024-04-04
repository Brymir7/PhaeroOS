import { useEffect, useRef } from "react";
import MonthDisplay from "./MonthDisplay";
import Grid from "@mui/material/Grid";
import { Typography } from "@mui/material";

type YearDisplayProps = {
  completions: boolean[] | number[];
  color: string;
  trackingStartDate: string; // New prop for the start date of tracking
  maxValue?: number;
  showDays?: boolean;
};

const YearDisplay = ({
  completions,
  color,
  trackingStartDate,
  maxValue,
  showDays,
}: YearDisplayProps) => {
  function splitCompletionsIntoMonths<T>(
    completions: T[],
    trackingStartDate: string
  ): T[][] {
    const months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const startedMonth = new Date(trackingStartDate).getMonth();
    const startDate = new Date(trackingStartDate).getDate();
    const fillValue = typeof completions[0] === "boolean" ? false : 0; // Adjust based on actual array type

    const monthsAfterStart = months.slice(startedMonth + 1);
    const monthArrays: T[][] = [];

    for (let i = 0; i < startedMonth; i++) {
      monthArrays[i] = new Array(months[i]).fill(fillValue);
    }

    monthArrays[startedMonth] = new Array(startDate - 1).fill(fillValue);
    monthArrays[startedMonth] = monthArrays[startedMonth].concat(
      completions.splice(0, months[startedMonth] - startDate + 1)
    );

    let start = 0;
    monthsAfterStart.forEach((daysInMonth) => {
      const monthData = completions.slice(start, start + daysInMonth);
      monthArrays.push(monthData);
      start += daysInMonth;
    });
    return monthArrays;
  }
  const months =
    typeof completions[0] === "boolean"
      ? splitCompletionsIntoMonths<boolean>(
        completions as boolean[],
        trackingStartDate
      )
      : splitCompletionsIntoMonths<number>(
        completions as number[],
        trackingStartDate
      );
  const MonthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const containerRef = useRef<HTMLDivElement>(null); // Ref for the container Grid
  const currentMonth = new Date().getMonth();
  useEffect(() => {
    if (containerRef.current) {
      // Assuming each Grid item is a direct child, you can get the first child's height as a reference
      const firstItem = containerRef.current.children[0] as HTMLElement;
      const gridItemHeight = firstItem ? firstItem.offsetHeight : 0;

      // Calculate the total scroll offset needed to bring the current month into view
      const scrollTo = gridItemHeight * currentMonth;
      containerRef.current.scrollTop = scrollTo;
    }
  }, [currentMonth]);

  return (
    <Grid
      container
      spacing={3}
      sx={{
        overflowY: "auto",
        maxHeight: { xs: "20vh", xl: "50vh" },
        paddingLeft: "4px",
        paddingRight: "4px",
      }}
      ref={containerRef}
    >
      {months.map((monthCompletions, index) => (
        <Grid item xs={12} sm={4} md={4} key={index}>
          <Typography variant="h6" align="center" gutterBottom>
            {MonthNames[index]}
          </Typography>
          <MonthDisplay monthCompletions={monthCompletions} color={color} maxValue={maxValue} showDays={showDays} />
        </Grid>
      ))}
    </Grid>
  );
};

export default YearDisplay;
