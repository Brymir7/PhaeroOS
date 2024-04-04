import React from "react";
import { Box, Slider, useTheme } from "@mui/material";
import { EmojiHappy, EmojiNormal, EmojiSad } from "iconsax-react";
interface Props {
  value: number;
  setValue: (newValue: number) => void;
  viewOnly?: boolean;
}

export const WellbeingSlider = ({ value, setValue, viewOnly }: Props) => {
  const [dislpayValue, setDisplayValue] = React.useState(value);
    const theme = useTheme();
  const handleChange = (newValue: number | number[]) => {
    setDisplayValue(newValue as number);
    setValue(newValue as number);
  };

  const customMarks = [
    { value: 1, icon: <EmojiSad  color={theme.palette.primary.verysad} /> },
    { value: 3, icon: <EmojiSad     color={theme.palette.primary.sad}  /> },
    { value: 5, icon: <EmojiNormal   color={theme.palette.primary.medium} /> },
    { value: 7, icon: <EmojiHappy   color={theme.palette.primary.happy} /> },
    { value: 9, icon: <EmojiHappy   color={theme.palette.primary.veryhappy} /> },
  ];

  const generateMarks = () => {
    const marks = [];
    for (let i = 0; i <= 10; i++) {
      const customMark = customMarks.find((mark) => mark.value === i);
      if (customMark) {
        marks.push({
          value: i,
          label: (
            <Box component="div" className="flex items-center justify-center w-8 h-8">
              {customMark.icon}
            </Box>
          ),
        });
      } else {
        marks.push({ value: i, label: `${""}` });
      }
    }
    return marks;
  };

  const getCurrentThumbColor = () => {
    let hexColor;

    if (dislpayValue < 3) {
      hexColor = theme.palette.primary.verysad;
    } else if (dislpayValue < 5) {
      hexColor = theme.palette.primary.sad;
    } else if (dislpayValue < 7) {
      hexColor = theme.palette.primary.medium;
    } else if (dislpayValue < 9) {
      hexColor = theme.palette.primary.happy;
    } else {
      hexColor = theme.palette.primary.veryhappy;
    }
    return hexColor;
  };

  return (
    <Box
      component="div"
      width={"100%"}
      sx={{
        "& .MuiSlider-rail": {
          opacity: 0.4, // Slightly transparent rail
        },
        "& .MuiSlider-track": {
          border: "none", // Remove default border
        },
      }}
    >
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
              boxShadow: `0 2px 4px ${getCurrentThumbColor()}`, // Reduced shadow effect when active
            },
            "&.Mui-active": {
              boxShadow: `0 4px 8px ${getCurrentThumbColor()}`, // Reduced shadow effect when active
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
        }}
        defaultValue={value}
        step={1}
        valueLabelDisplay="off"
        disabled={viewOnly}
        marks={generateMarks()}
        value={dislpayValue}
        onChange={(e, newValue) => {
          e.preventDefault();
          handleChange(newValue);
        }}
        min={0}
        max={10}
      // slots={{ thumb: CustomThumb }}
      />
    </Box>
  );
};

export default WellbeingSlider;
