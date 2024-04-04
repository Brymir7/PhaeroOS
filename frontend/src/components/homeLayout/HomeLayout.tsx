import { useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { AuthContext } from "../contexts/AuthContext";
import { useApi } from "../../modules/apiAxios";
import { StreakProvider } from "../contexts/StreakContext";
import { useWindowWidth } from "../utils/CustomHooks";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";
import { Button, Dialog, DialogActions, Paper } from "@mui/material";
import { BadgesProvider } from "../contexts/BadgeContext";

import NavBar from "./NavBar";
import Header from "./Header";
import { usePossibleRoutes } from "../contexts/PossiblesRoutesContext";
import TutorialDialog from "../homePage/TutorialDialog";

function HomeLayout() {
  const windowWidth = useWindowWidth();
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [message, setMessage] = useState<JSX.Element | undefined>(undefined);
  const { isLoggedIn, login, refreshed } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const navigate = useNavigate();
  const api = useApi();
  const { hasAccess } = useContext(AuthContext);
  const { language } = useContext(MapKeysContext);

  useEffect(() => {
    api
      .get("/status/subscription/")
      .then(() => { })
      .catch((error) => {
        handleAllErrors(error);
      });
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  useEffect(() => {
    // we have to check for validity of access token every time we load the page
    const asyncLoginWrapper = async () => {
      const authenticationValid = await login();
      if (!authenticationValid) {
        navigate("/login");
      }
    };
    asyncLoginWrapper();
  }, [isLoggedIn, refreshed]);

  const initialLoad = () => {
    api
      .get("/setup_user/check/")
      .then((response) => {
        if (response.data == false) {
          navigate("/setup");
        } else {
          fetchUserMessage();
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const fetchUserMessage = () => {
    api.get("/current-message/").then((response) => {
      const messageId = 2
      if (messageId !== response.data.id) {
        if (language === Language.German) {
          setMessage(formatMessage(response.data.text_german));
        } else {
          setMessage(formatMessage(response.data.text_english));
        }
        localStorage.setItem("messageId", response.data.id);
      }
    });
  };

  const formatMessage = (str: string) => {
    const regex = /\n/;
    if (regex.test(str)) {
      const splitStr = str.split("\n");
      return (
        <div className="flex flex-col">
          <h2 className="text-xl mb-2">{splitStr[0]}</h2>
          {splitStr.map((item, index) => {
            if (index > 0) {
              return <p key={index}>{item}</p>;
            }
          })}
        </div>
      );
    } else {
      return <p>{str}</p>;
    }
  };
  const { currentPage } = usePossibleRoutes();
  const { mapKeys } = useContext(MapKeysContext);

  const [tutorialOpen, setTutorialOpen] = useState(true);
  useEffect(() => {
    if (localStorage.getItem("tutorial") === "false") {
      setTutorialOpen(false);
    }
  }, []);
  const saveTutorialFinished = () => {
    localStorage.setItem("tutorial", "false");
    setTutorialOpen(false);
  }
  return (
    <StreakProvider>
      <BadgesProvider>
        <TutorialDialog open={tutorialOpen} onClose={() => saveTutorialFinished()} steps={
          [
            {
              "image": language === Language.German ? "/germanTutorial1.webp" : "/englishTutorial1.webp",
              "headline": mapKeys("Tutorial"),
              "explanation": mapKeys("Phaero asks daily reflection questions like 'How did you sleep?'. Questions vary based on time of day to track different aspects of your life. You can just chat with Phaero too!")
            },
            {
              image: language === Language.German ? "/germanTutorial3.webp" : "/englishTutorial2.webp",
              headline: mapKeys("Tutorial"),
              explanation: mapKeys("You can tell Phaero anything about your sleep, food, exercise, and more. Phaero will analyze this and convert it to statistics.")
            },
            {
              image: language === Language.German ? "/germanTutorial4.webp" : "/englishTutorial3.webp",
              headline: mapKeys("Tutorial"),
              explanation: mapKeys("Whenever Phaero detects something that will get added to your statistics, he will tell you. You can always change it with the button below the message.")
            },
            {
              image: language === Language.German ? "/germanTutorial5.webp" : "/englishTutorial4.webp",
              headline: mapKeys("Tutorial"),
              explanation: mapKeys("While you chat with Phaero, he will create a journal entry for you. You can also choose to just write it yourself.")
            },
            {
              image: language === Language.German ? "/germanTutorial2.webp" : "/englishTutorial5.webp",
              headline: mapKeys("Tutorial"),
              explanation: mapKeys("Phaero will remember your answers and use them to give you personalized advice. You can also ask him for advice anytime.")
            },
          ]
        } />

        <div className={` relative w-screen  text-gray-900 `}>
          <Dialog
            open={false}
            onClose={() => setMessage(undefined)}
          >
            <div className="flex flex-col w-full space-y-4 rounded-lg shadow-sm py-4 px-6 justify-around">
              {message}
            </div>
            <DialogActions>
              <Button onClick={() => setMessage(undefined)}>{mapKeys("Close")}</Button>
            </DialogActions>
          </Dialog>

          <div className="">
            <Header
              windowWidth={windowWidth}
              heading={currentPage}
              toggleMobileNavbar={() => setNavbarOpen(!navbarOpen)}
              navbarOpen={windowWidth > 768 ? true : navbarOpen}
            />
          </div>
          <div className={`flex w-screen relative`}>
            <NavBar
              close={() => setNavbarOpen(false)}
              opened={windowWidth > 768 ? true : navbarOpen}
              currentPage={currentPage}
              windowWidth={windowWidth}
              setTutorialOpen={setTutorialOpen}
            />
            <motion.div
              initial={windowWidth >= 768 ? "open" : "closed"}
              animate={windowWidth >= 768 ? "open" : "closed"}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`relative page-height flex flex-grow  justify-center overflow-y-hidden `}
            >
              <Paper
                elevation={0}
                sx={{ borderRadius: 0 }}
                className={`w-full h-full  overflow-x-hidden`}
              >
                <Outlet />
              </Paper>
            </motion.div>
          </div>
        </div>

      </BadgesProvider>
    </StreakProvider>
  );
}

export default HomeLayout;
