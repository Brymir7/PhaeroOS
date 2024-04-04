import { FormControl, InputLabel, Select, MenuItem, Typography } from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { ArrowButton } from "../utils/Buttons";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { AuthContext } from "../contexts/AuthContext";
import TimezoneSelect from "../utils/TimezoneSelect";
import moment from "moment-timezone";

interface Props {
  onSubmit: () => void;
}

function SetLanguageUi({ onSubmit }: Props) {
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [language, setLanguage] = useState<string>("english");
  const [refresh, setRefresh] = useState<boolean>(false);
  const api = useApi();
  const { hasAccess } = useContext(AuthContext);
  const [selectedTimezone, setSelectedTimezone] = useState(moment.tz.guess());

  const timezones = moment.tz.names();

  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  const initialLoad = () => {
    api
      .get("/settings/language/")
      .then((response) => {
        setLanguage(response.data);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  useEffect(() => {
    if (!refresh) return;
    api
      .post("/settings/language/", { language: language })
      .then(() => {
        setRefresh(false);
        location.reload();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  }, [refresh]);

  const sendTimezoneBackend = () => {
    api
      .post("/settings/timezone/", {
        timezone: selectedTimezone,
      })
      .then(() => {
        onSubmit();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  return (
    <>
      <Typography className="text-2xl">{mapKeys("Set your language")}</Typography>

      <div className="flex flex-col w-fit mx-auto text-base font-robotoSlap">
        <FormControl color="primary" sx={{ m: 1, width: 180 }} size="small">
          <InputLabel id="demo-select-small-label">
            {mapKeys("Language")}
          </InputLabel>
          <Select
            labelId="demo-select-small-label"
            id="demo-select-small"
            value={language}
            label="Nutrients"
            onChange={(e) => {
              setLanguage(e.target.value);
              setRefresh(true);
            }}
          >
            <MenuItem value={"english"}>{mapKeys("English")}</MenuItem>
            <MenuItem value={"german"}>{mapKeys("German")}</MenuItem>
          </Select>
        </FormControl>
      </div>

      <Typography className="text-2xl">{mapKeys("Set your timezone")}</Typography>
      <div className="flex flex-col w-fit mx-auto text-base font-robotoSlap">
        <TimezoneSelect
          timezone={selectedTimezone}
          setTimezone={setSelectedTimezone}
          timezones={timezones}
        />
      </div>
      <div className="flex justify-end px-2 pt-2">
        <ArrowButton
          onClick={() => {
            sendTimezoneBackend();
          }}
          text={mapKeys("Submit")}
        />
      </div>
    </>
  );
}

export default SetLanguageUi;
