import { useContext, useEffect, useState } from "react";

import { Paper, Badge, Typography, Button, useTheme } from "@mui/material";
import { useBadges } from "../contexts/BadgeContext";

import { HambergerMenu, Moon, Setting2 } from "iconsax-react";
import SettingsUi from "./SettingsUi";
import { MapKeysContext } from "../contexts/MapKeysContext";
// @ts-ignore
import PhaeroLogo from "/phaero_logo.svg";
import { useThemeContext } from "../../ThemeContext";
import Icon from "@mdi/react";
import { mdiWeatherSunny } from "@mdi/js";
interface Props {
  heading: string;
  toggleMobileNavbar: () => void;
  windowWidth: number;
  navbarOpen: boolean;
}

const Header = ({ toggleMobileNavbar, navbarOpen }: Props) => {
  const [, setShowBadge] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const theme = useTheme();
  // const { streak } =
  //   useContext(StreakContext);
  const { badges } = useBadges();

  const isThereActiveBadgeNotMatchingCurrentPath = (): boolean => {
    return Object.values(badges).some(
      (badge) => badge.active && badge.path !== window.location.pathname
    );
  };
  useEffect(() => {
    setShowBadge(isThereActiveBadgeNotMatchingCurrentPath());
  }, [badges, window.location.pathname]);
  const currentPage = window.location.pathname;
  const { mapKeys } = useContext(MapKeysContext);
  const { toggleDarkMode, isDarkMode } = useThemeContext();
  // const { displayFlame, getStreakNumberColor } = useContext(StreakContext);
  return (
    <Paper
      elevation={4}
      className="flex w-full h-12 box-content justify-between mb-[0.1em]"
      sx={{ borderRadius: 0 }}
    >
      <div className="w-14 h-12 flex items-center justify-center">
        <Badge
          invisible={true} // show badge
          overlap="circular"
          color="primary"
          variant="dot"
        >
          <div
            onClick={(e) => { toggleMobileNavbar(); e.stopPropagation(); }}
            className="flex items-center justify-center w-10 h-10 flex-shrink-0 ml-1 cursor-pointer  rounded-md"
          >
            <div
              className={`transition-all duration-300 p-2 aspect-square ${navbarOpen ? "-rotate-90" : "rotate-0"
                }`}
            >
              <HambergerMenu size={theme.iconSize.large} color={isDarkMode ? "#ffffff" : "#333"} />
            </div>
          </div>
        </Badge>
      </div>
      {!currentPage.startsWith("/home/edit-entry") ? <div className="flex items-center gap-2 justify-center">
        <Button onClick={() => toggleDarkMode()} >
          {isDarkMode ? <Moon size={theme.iconSize.large} color={!isDarkMode ? "#333" : "#fff"} /> : <Icon path={mdiWeatherSunny} size={1.3} color={!isDarkMode ? "#333" : "#fff"} />}
        </Button>
      </div> : (
        <div className="flex items-center gap-2 justify-center">
          <Button onClick={() => window.history.back()} sx={{ textTransform: "none", borderRadius: 20 }} variant="contained" >
            <Typography className="text-lg font-bold ">
              {mapKeys("Back to chat")}
            </Typography>
          </Button>
        </div>
      )}
      <div className="flex justify-center align-middle items-center">

        <Button onClick={() => setSettingsOpen(true)} >
          <Setting2 size={theme.iconSize.large} color={!isDarkMode ? "#333" : "#fff"} />
        </Button>
      </div>
      <SettingsUi
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
      />
    </Paper>
  );
};

export default Header;
