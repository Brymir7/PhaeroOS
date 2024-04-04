import { useContext } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { JournalNoteContext } from '../contexts/JournalNoteContext';
import { useWindowWidth } from '../utils/CustomHooks';
import { MapKeysContext } from '../contexts/MapKeysContext';
import { useNavigate } from 'react-router';

const MessagingToggleButton = () => {
  const { messages, messagingView, setMessagingView, canProcess } = useContext(JournalNoteContext);
  const { mapKeys } = useContext(MapKeysContext);
  const windowWidth = useWindowWidth();
  const navigate = useNavigate();
  const handleToggle = (_: any, newView: boolean | null) => {
    if (newView !== null) {
      setMessagingView(newView);
    } else {
      navigate("/home/edit-entry/");
    };
  };
  return (
    <ToggleButtonGroup
      value={messagingView}
      color="primary"
      exclusive
      onChange={handleToggle}
      fullWidth={windowWidth < 768}
      style={{ minWidth: windowWidth < 768 ? "100%" : "60%", minHeight: "50px" }}
    >
      <ToggleButton value={true} disabled={messages.length === 0 || !canProcess} >
        {mapKeys("Chat") }
      </ToggleButton>
      <ToggleButton value={false} disabled={messages.length === 0 || !canProcess} >
        {mapKeys("Daily Entry")}
      </ToggleButton>
    </ToggleButtonGroup>
  );
};

export default MessagingToggleButton;
