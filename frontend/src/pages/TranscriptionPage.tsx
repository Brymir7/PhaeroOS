import { useContext } from "react";
import Transcription from "../components/homePage/Journal";
import { JournalNoteContext } from "../components/contexts/JournalNoteContext";
import MessageView from "./MessageView";

function HomePage() {
  const { messagingView } = useContext(JournalNoteContext);
  return (
    <div className="h-full">
      {!messagingView ? (
        <Transcription />
      ) : (
        <MessageView
        />
      )}
    </div>
  );
}

export default HomePage;
