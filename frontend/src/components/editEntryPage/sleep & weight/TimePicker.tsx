import { useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import Picker from "react-mobile-picker";

interface Props {
  editDate: Date;
  setEditDate: React.Dispatch<React.SetStateAction<Date>>;
  viewOnly?: boolean;
  handleDateEdit: (newDate: Date) => void;
}

function TimePicker({
  editDate,
  setEditDate,
  handleDateEdit,
  viewOnly = false,
}: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pickerValue, setPickerValue] = useState<any>({
    day: editDate.getDate(),
    hour: editDate.getHours(),
    minute: editDate.getMinutes(),
  });

  const daySelections = viewOnly
    ? [editDate.getUTCDate()]
    : [new Date().getDate(), new Date().getDate() - 1];
  const loopedHourSelections = [
    ...Array.from({ length: 200 }, (_, i) => i - 100),
  ];
  const loopedMinuteSelections = [
    ...Array.from({ length: 60 }, (_, i) => i),
  ];

  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) {
      const { day, hour, minute } = pickerValue;
      const newDate = new Date(editDate);
      newDate.setUTCDate(day);
      newDate.setUTCHours(((hour % 24) + 24) % 24);
      newDate.setUTCMinutes(((minute % 60) + 60) % 60);
      setEditDate(newDate);
      handleDateEdit(newDate);
    }
    isMounted.current = true;
  }, [pickerValue]);

  const displayHours = (hour: number) => {
    const hrString = ((hour % 24) + 24) % 24;
    return hrString < 10 ? `0${hrString}` : hrString;
  };

  const displayMinutes = (minute: number) => {
    const minString = ((minute % 60) + 60) % 60;
    return minString < 10 ? `0${minString}` : minString;
  };

  const displayDays = (day: number) => {
    if (day === new Date().getDate()) return "Today";
    if (day === new Date().getDate() - 1) return "Yesterday";
    return day;
  }
  const theme = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const createPickerColumn = (name: string, options: any[]) => (
    <Picker.Column key={name} name={name} className="px-2">
      {options.map((option) => (
        <Picker.Item key={[name, option].join("-")} value={option}>
          {({ selected }) => (
            /* Use the `selected` state ti conditionally style the selected item */
            <div style={{ color: selected ? theme.palette.primary.main : theme.palette.primary.secondaryText }}>
              {name === "day"
                ? displayDays(option)
                : name === "hour"
                  ? displayHours(option)
                  : displayMinutes(option)}
            </div>
          )}
        </Picker.Item>
      ))}
    </Picker.Column>
  );
  return (
    <div className={`flex flex-col ${viewOnly && "pointer-events-none"} `}>
      <Picker
        itemHeight={40}
        className="text-2xl"
        value={pickerValue}
        onChange={setPickerValue}
        wheelMode={viewOnly ? "off" : "normal"}
        height={90}
      >
        {createPickerColumn("day", daySelections)}
        <p className="pb-1 my-auto">.</p>
        {createPickerColumn("hour", loopedHourSelections)}
        <p className="pb-1 my-auto">:</p>
        {createPickerColumn("minute", loopedMinuteSelections)}
      </Picker>
    </div>
  );
}
export default TimePicker;
