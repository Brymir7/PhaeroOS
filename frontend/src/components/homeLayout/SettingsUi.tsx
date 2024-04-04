import React, { useContext, useEffect, useState } from "react";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useApi } from "../../modules/apiAxios";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
} from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { AuthContext } from "../contexts/AuthContext";
import moment from "moment-timezone";
import TimezoneSelect from "../utils/TimezoneSelect";
// import { TutorialContext } from "../contexts/TutorialContext";
import { useThemeContext } from "../../ThemeContext";

interface Props {
  setSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  settingsOpen: boolean;
}
let deferredPrompt: any;
function SettingsUi({ setSettingsOpen, settingsOpen }: Props) {
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const { mapKeys, language } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  // const { startTutorial } = useContext(TutorialContext);

  const api = useApi();

  const timezones = moment.tz.names();

  const [installable, setInstallable] = useState(false);
  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      deferredPrompt = e;
      // Update UI notify the user they can install the PWA
      setInstallable(true);
    });

    window.addEventListener("appinstalled", () => {
      // Log install to analytics
      console.log("INSTALL: Success");
    });
  }, []);
  const handleInstallClick = () => {
    // Hide the app provided install promotion
    setInstallable(false);
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
    });
  };
  useEffect(() => {
    if (hasAccess) getTimezone();
  }, [hasAccess]);

  const getTimezone = () => {
    api
      .get("/settings/")
      .then((response) => {
        setSelectedTimezone(response.data.timezone);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const updateTimezone = (timezone: string) => {
    api
      .post("/settings/timezone/", {
        timezone: timezone,
      })
      .then(() => { })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const updateLanguage = async (language: string) => {
    api
      .post("/settings/language/", { language: language })
      .then(() => {
        location.reload();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const { changeTheme } = useThemeContext();
  return (
    <Dialog
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      className={`flex flex-col  rounded-md `}
    >
      <div className="flex justify-between items-center px-4 mb-4 mt-4 font-roboto text-xl">
        <p>{mapKeys("Settings")}</p>{" "}
        <p onClick={() => setSettingsOpen(false)} className="cursor-pointer ">
          <FontAwesomeIcon icon={faXmark} size="lg" />
        </p>
      </div>
      {installable && (
        <Button onClick={handleInstallClick}>
          {" "}
          {mapKeys("Click here to install Phaero")}
        </Button>
      )}
      <div className="flex justify-center gap-2">
        {/* <Button
          onClick={() => {
            startTutorial();
            setSettingsOpen(false);
          }}
          sx={{ m: 1 }}
          color="primary"
          endIcon={<FontAwesomeIcon icon={faCircleQuestion} size="lg" />}
        >
          {mapKeys("Help")}
        </Button> */}
        <Button sx={{ m: 1 }} onClick={() => changeTheme(undefined)} variant="outlined">{mapKeys("Theme")}</Button>
      </div>
      <div className="space-y-2 mb-4">
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
              updateLanguage(e.target.value);
            }}
          >
            <MenuItem value={"english"}>{mapKeys("English")}</MenuItem>
            <MenuItem value={"german"}>{mapKeys("German")}</MenuItem>
          </Select>
        </FormControl>
        <TimezoneSelect
          timezone={selectedTimezone}
          setTimezone={(timezone) => {
            setSelectedTimezone(timezone);
            updateTimezone(timezone);
          }}
          timezones={timezones}
        />

        <div>
          <Button
            sx={{ m: 1 }}
            size="large"
            variant="outlined"
            color="primary"
            component="a"
            href="https://billing.stripe.com/p/login/eVa9DT9Eud9w36M000"
            target="_blank"
            rel="noopener noreferrer"
          >
            {mapKeys("Manage Subscription")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default SettingsUi;
