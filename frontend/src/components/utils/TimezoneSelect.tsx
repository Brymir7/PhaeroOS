import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useContext } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";

interface Props {
  timezone: string;
  setTimezone: (timezone: string) => void;
  timezones: string[];
}

const TimezoneSelect = ({ timezone, setTimezone, timezones }: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <FormControl color="primary" sx={{ m: 1, width: 180 }} size="small">
      <InputLabel id="timezone-select-label">{mapKeys("Timezone")}</InputLabel>
      <Select
        labelId="timezone-select-label"
        id="timezone-select"
        value={timezone}
        onChange={(e) => {
          setTimezone(e.target.value);
        }}
        label="Timezone"
      >
        {timezones.map((timezone) => (
          <MenuItem key={timezone} value={timezone}>
            {timezone}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default TimezoneSelect;
