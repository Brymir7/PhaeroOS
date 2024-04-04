import Transcription from "../components/homePage/Journal";
import { useContext } from "react";
import { JournalNoteContext } from "../components/contexts/JournalNoteContext";
import MessageView from "./MessageView";
import Streak from "../components/homePage/StreakDisplay";
import HomePageStatisticDisplay from "./HomePageStatisticDisplay";
import { useWindowWidth } from "../components/utils/CustomHooks";
import { Paper } from "@mui/material";

function HomePage() {
  const windowWidth = useWindowWidth();
  const { messagingView } = useContext(JournalNoteContext);
  if (windowWidth < 1350) {
    return (
      <div className="flex flex-col h-full items-center w-full pr-4">
        <div
          className={`flex w-full justify-around flex-grow max-h-[100%] mb-auto gap-x-4 ${windowWidth < 1080 ? "" : ""
            } `}
        >
          <div
            className={`flex flex-col items-center w-full h-full
              } "`}
          >
            {!messagingView ? <Transcription /> : <MessageView />}
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col h-full items-center w-full pr-4 pt-1 ">
      <div
        className={`flex w-full justify-around flex-grow max-h-[100%] mb-auto gap-x-4 
          }  `}
      >
        <Paper
          elevation={2}
          style={{ borderRadius: "20px" }}
          className={`p-3 m-1 ml-4 mr-0 flex flex-col items-center w-full h-[98%] ${windowWidth > 1450 ? windowWidth < 1900 ? "max-w-[58%] mr-auto" : "max-w-[50%] mr-auto" : "max-w-[55%] mr-auto"
            } "`}
        >
          {!messagingView ? <Transcription /> : <MessageView />}
        </Paper>
        <div className={`flex flex-col  mt-1 gap-2 h-[98%] ${windowWidth > 1450 ? windowWidth < 1900 ? "max-w-[42%] " : "max-w-[50%]" : "max-w-[45%] pb-2 mr-auto"}`}>
          <Streak />
          <HomePageStatisticDisplay />

        </div>
      </div>
    </div>
  );
}

export default HomePage;
