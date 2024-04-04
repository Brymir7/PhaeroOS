import { Slider, Box, Paper, Typography, useTheme } from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";
import React, { useState, useContext } from "react";


interface Props {
  value: number;
  handleSliderChange: (value: number) => void;
  heading: string;
  range?: [number, number];
  unit?: string;
  viewOnly?: boolean;
  markStepSize?: number;
  icon?: React.ReactNode;
}


export default function DiscreteSlider({
  value,
  handleSliderChange,
  heading,
  range = [0, 10],
  unit,
  viewOnly = false,
  markStepSize = 1000,
  icon,
}: Props) {
  const [dislpayValue, setDisplayValue] = useState(value);
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();
  const handleChange = (newValue: number | number[]) => {
    setDisplayValue(newValue as number);
    handleSliderChange(newValue as number);
  };

  // Generate marks
  const marks = Array.from(
    { length: (range[1] - range[0]) / markStepSize + 1 },
    (_, index) => ({
      value: range[0] + index * markStepSize,
      label: unit
        ? `${range[0] + (index * markStepSize) / 1000} ${unit}`
        : `${range[0] + (index * markStepSize) / 1000}`,
    })
  );
  const getCurrentThumbColor = () => {
    let hexColor;
    const ratio = (dislpayValue - range[0]) / (range[1] - range[0]);
    if (ratio < 0.25) {
      hexColor = theme.palette.primary.verysad;
    } else if (ratio < 0.4) {
      hexColor = theme.palette.primary.sad;
    } else {
      hexColor = theme.palette.primary.happy;
    }
    return hexColor;
  };
  return (
    <Paper elevation={2}>
      {icon ? (
        <div className="flex justify-center items-center align-middle">
          {icon}
          <Typography className="flex justify-center" sx={{ px: 0 }}>
            {mapKeys("slider_" + heading)}
          </Typography>
        </div>
      ) : (
        <Typography className="flex justify-center" sx={{ px: 4, pt: 1 }}>
          {mapKeys("slider_" + heading)}
        </Typography>
      )}

      <div className="flex w-full px-6 justify-center items-center">
        <Box component="div" sx={{ width: 350 }}>
          <Slider
            sx={{
              color: "#3a8589",
              height: 3,
              padding: "13px 0",
              "& .MuiSlider-thumb": {
                height: 18,
                width: 18,
                backgroundColor: "#fff",
                border: "4px solid",
                borderColor: getCurrentThumbColor(),
                "&:hover": {
                  boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2)`, // Reduced shadow effect when active
                },
                "&.Mui-active": {
                  boxShadow: `0 4px 8px rgba(0, 0, 0, 0.2)`, // Reduced shadow effect when active
                },
              },
              "& .MuiSlider-track": {
                height: 3,
                color: getCurrentThumbColor(),
              },
              "& .MuiSlider-rail": {
                color: "#55c22e",
                height: 3,
              },
              "& .MuiSlider-valueLabel": {
                lineHeight: 1.2,
                fontSize: "12px",
                background: "unset",
                p: 0.5,
                boxShadow: `0 2px 4px rgba(0, 0, 0, 0.2)`,
                border: "2px solid #38bdf8",
                borderRadius: "6px",
                backgroundColor: "white",
                color: "black",
                transformOrigin: "bottom center",
                transform: "translate(0, -100%) scale(0)",
                "&::before": { display: "none" }, // Removes the default arrow
                "&.MuiSlider-valueLabelOpen": {
                  transform: "translate(0, -100%) scale(1)", // Ensures the label scales up when open
                },
              },
            }}
            disabled={viewOnly}
            valueLabelFormat={(value) =>
              unit ? `${(value / 1000).toFixed(1)} ${unit}` : `${value}`
            }
            defaultValue={value}
            valueLabelDisplay={viewOnly ? "on" : "auto"}
            value={dislpayValue}
            onChange={(_e, newValue) => {

              handleChange(newValue);
            }}
            color="primary"
            step={1}
            marks={marks}
            min={range[0]}
            max={range[1]}
          />
        </Box>
      </div>
    </Paper>
  );
}
