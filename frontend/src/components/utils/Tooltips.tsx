import Tooltip, { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";

export const SkyTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip
    {...props}
    title={props.title}
    enterTouchDelay={100}
    enterDelay={500}
    classes={{ popper: className }}
  />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: "#ffffff", // White background color
    border: "1px solid #36bdf8", // Blue border
    color: "#333", // Dark text color for readability
    boxShadow: theme.shadows[1], // Apply shadow to mimic Paper elevation
    fontSize: 13, // Set font size
  },
}));
