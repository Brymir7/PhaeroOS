import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import dayjs from "dayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import "dayjs/locale/de";

interface Props {
  value: dayjs.Dayjs | null;
  onChange: (newValue: dayjs.Dayjs | null) => void;
  maxDate?: dayjs.Dayjs;
  disablePast?: boolean;
  label: string;
}

const RenderDatePicker = ({
  value,
  onChange,
  maxDate,
  disablePast = false,
  label,
}: Props) => {
  return (
    <DemoContainer components={["DatePicker"]}>
      <DatePicker
        disablePast={disablePast}
        value={value}
        onChange={(newValue) => {
          onChange(newValue);
        }}
        maxDate={maxDate}
        sx={{
          ".MuiInputBase-root": { height: "auto", fontSize: "0.875rem" },
          ".MuiInputBase-input": { padding: "16px" },
        }}
        label={label}
      />
    </DemoContainer>
  );
};

export default RenderDatePicker;
