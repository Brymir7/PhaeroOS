import Button from "@mui/material/Button";
import { styled } from "@mui/material/styles";

// Enum for days to make it easier to reference and avoid magic numbers
export enum Days {
  Sunday = 0,
  Monday,
  Tuesday,
  Wednesday,
  Thursday,
  Friday,
  Saturday,
}
interface HabitDaySelectorProps {
  selectedDays: Days[];
  setSelectedDays: (days: Days[]) => void;
  disabled?: boolean;
}
const DayButton = styled(Button)({
  borderRadius: "50%", // Circular shape
  minWidth: "40px", // Minimum width
  width: "40px", // Width of the button
  height: "40px", // Height of the button
  margin: "5px", // Margin around the button
});

function HabitDaySelector({
  selectedDays,
  setSelectedDays,
  disabled,
}: HabitDaySelectorProps) {
  const toggleDay = (day: Days) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const renderDayButton = (day: Days) => {
    const isSelected = selectedDays.includes(day);
    return (
      <DayButton
        disabled={disabled}
        key={day}
        onClick={() => toggleDay(day)}
        sx={{
          backgroundColor: isSelected ? "primary.main" : "inherit",
          color: isSelected ? "white" : "black",
          "&:hover": {
            backgroundColor: isSelected ? "primary.dark" : "primary.light",
          },
        }}
      >
        {Days[day].substring(0, 2)}
      </DayButton>
    );
  };

  return (
    <div className="flex justify-center space-x-1">
      {Object.values(Days)
        .filter((day) => !isNaN(Number(day)))
        .map((day) => renderDayButton(day as Days))}
    </div>
  );
}

export default HabitDaySelector;
