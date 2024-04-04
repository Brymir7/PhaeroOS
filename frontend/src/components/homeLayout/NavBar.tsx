import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { SkyTooltip } from "../utils/Tooltips";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useOutsideClick } from "../utils/CustomHooks";
import { useBadges } from "../contexts/BadgeContext";
import TutorialStep from "../utils/TutorialStep";
import { TutorialContext } from "../contexts/TutorialContext";
import {
  CardTick,
  ClipboardTick,
  Diagram,
  Flag,
  MessageQuestion,
  Microphone2,
  Note,
  // Notepad2,
} from "iconsax-react";
import { Paper, useTheme } from "@mui/material";
import { useThemeContext } from "../../ThemeContext";
interface Props {
  close: () => void;
  currentPage: string;
  windowWidth: number;
  opened: boolean;
  setTutorialOpen: (open: boolean) => void;
}

function MobileNavbar({
  currentPage,
  opened,
  windowWidth,
  close,
  setTutorialOpen,
}: Props) {
  const theme = useTheme();
  const { isDarkMode } = useThemeContext();
  const { mapKeys } = useContext(MapKeysContext);
  const { badges } = useBadges();
  const { navbarOpen, currentTutorialStep } = useContext(TutorialContext);
  const navbarRef = useOutsideClick(() => close(), 10);
  const getFillColor = (page: string) => {
    const fillColor =
      currentPage === page
        ? theme.palette.primary.main
        : isDarkMode
          ? "#ffffff"
          : "#000000";

    return fillColor;
  };

  const navbarIconsMobile = [
    {
      icon: (
        <TutorialStep step={0} zIndex={50}>
          <div className="h-10 w-10 flex items-center justify-center rounded-lg">
            <Microphone2
              size={theme.iconSize.large}
              color={getFillColor("Dashboard")}
            />
          </div>
        </TutorialStep>
      ),
      name: "Entry",
      badge: badges.processing,
      page: "Entry",
      link: "/home",
    },
    {
      icon: (
        <TutorialStep
          extraClasses=" h-10 w-10 flex items-center justify-center rounded-lg"
          zIndex={50}
          step={1}
        >
          <ClipboardTick
            size={theme.iconSize.large}
            color={getFillColor("Checklist")}
          />
        </TutorialStep>
      ),
      name: "Checklist",
      page: "Checklist",
      link: "/home/checklist",
    },
    {
      icon: (
        <TutorialStep
          extraClasses=" h-10 w-10 flex items-center justify-center rounded-lg"
          zIndex={50}
          step={2}
        >
          {" "}
          <CardTick
            size={theme.iconSize.large}
            color={getFillColor("Habits")}
          />
        </TutorialStep>
      ),
      name: "Habits",
      page: "Habits",
      link: "/home/habits",
    },
    {
      icon: (
        <div className=" h-10 w-10 flex items-center justify-center rounded-lg">
          <Diagram
            size={theme.iconSize.large}
            color={getFillColor("Statistics")}
          />
        </div>
      ),
      name: "Statistics",
      page: "Statistics",
      link: "/home/statistics",
    },
    {
      icon: (
        <TutorialStep
          extraClasses=" h-10 w-10 flex items-center justify-center rounded-lg"
          zIndex={50}
          step={4}
        >
          <Note size={theme.iconSize.large} color={getFillColor("Notes")} />
        </TutorialStep>
      ),
      name: "Notes",
      page: "Notes",
      link: "/home/notes",
    },
    // {
    //   icon: (
    //     <div className=" h-10 w-10 flex items-center justify-center rounded-lg">
    //       <FontAwesomeIcon
    //         className="h-6 w-6 transition-colors duration-150  py-1 px-1"
    //         icon={faLightbulb}
    //         color={getFillColor("Insights")}
    //         size="2xl"
    //       />
    //     </div>
    //   ),
    //   name: "Insights",
    //   page: "Insights",
    //   link: "/home/insights",
    // },
  ];
  const variants = {
    hidden: { x: "-100%" }, // Moves the navbar out of the screen to the right
    visible: { x: 0 }, // Places the navbar back to its original position
  };
  const windowHeight = window.outerHeight;
  return (
    <motion.div
      initial="hidden"
      animate={
        opened ||
          navbarOpen ||
          (windowWidth > 1800 &&
            windowHeight > 1000 &&
            currentPage !== "Dashboard")
          ? "visible"
          : "hidden"
      } // height and width swapped somehow?
      variants={variants}
      transition={{ duration: 0.6, ease: "easeInOut" }}
      className={`flex z-40 justify-center bg-transparent page-height  ${windowWidth > 1000 ? "" : "pb-2"
        } ${windowWidth > 768 ? "" : "absolute"}`}
    >
      <Paper
        ref={navbarRef}
        sx={{ borderRadius: 0 }}
        elevation={2}
        className="flex flex-col relative items-center justify-between flex-grow   overflow-hidden pb-2 pt-1 pr-6"
      >
        <div className="flex flex-col w-36 items-center space-y-3">
          {currentTutorialStep > -1 && (
            <div className="absolute h-full w-full bg-black bg-opacity-40 top-0 z-40" />
          )}
          {navbarIconsMobile.map(({ icon, name, link }) => (
            <div key={link} className="relative py-5">
              <Link to={link} className={``} onClick={close}>
                <div className="absolute top-2 right-5">{icon}</div>
                <div className="absolute top-4 -left-4">{mapKeys(name)}</div>
              </Link>
            </div>
          ))}
        </div>

        <div className="flex flex-col w-8 items-center relative">

          <div
            className="flex items-center gap-3 mr-5 cursor-pointer"
            onClick={() => setTutorialOpen(true)}
          >
            <MessageQuestion className="h-10 w-10 flex items-center justify-center rounded-lg" />
            <div>{mapKeys("Tutorial")}</div>
          </div>
          <div className="flex items-center gap-3">
            <SkyTooltip
              title={mapKeys("Report an issue")}
              placement="right"
              enterDelay={500}
            >
              <a
                href="mailto:gorillabrainai@gmail.com"
                className="h-10 w-10 items-center justify-center flex"
              >
                <Flag className="h-10 w-10 flex items-center justify-center rounded-lg" />
              </a>
            </SkyTooltip>
            <div
              onClick={() => window.open("mailto:PhaeroAI@gmail.com")}
              className="cursor-pointer"
            >
              {mapKeys("Report an issue")}
            </div>
          </div>
        </div>
      </Paper>
    </motion.div>
  );
}

export default MobileNavbar;
