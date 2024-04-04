import { useNavigate } from "react-router";
import { ArrowButton } from "../utils/Buttons";
import { useContext } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGears } from "@fortawesome/free-solid-svg-icons";
import LoadingButton from "@mui/lab/LoadingButton";
import { JournalNoteContext } from "../contexts/JournalNoteContext";
import { Badge, LinearProgress, Box, Typography, useTheme } from "@mui/material";

const RedirectStatsButton = () => {
  const navigate = useNavigate();
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();
  const {
    isProcessing,
    hasNewEditEntry,
    setHasNewEditEntryToFalse,
    processAllowance,
    wordCount,
    minWordCount,
    canProcess,
  } = useContext(JournalNoteContext);

  // Calculate the percentage of allowance left
  const allowanceLeftPercentage = (processAllowance / 50) * 100; // Assuming processAllowance is a value out of 100

  return (
    <Box
      component={"div"}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      {isProcessing ? (
        <LoadingButton
          loading
          startIcon={<FontAwesomeIcon icon={faGears} />}
          loadingPosition="start"
          variant="outlined"
        >
          {mapKeys("Loading...")}
        </LoadingButton>
      ) : canProcess ? (
        <Badge badgeContent={hasNewEditEntry ? <span style={{ color: theme.palette.info.text }}>{"!"} </span> : undefined} color={"primary"}>
          <ArrowButton
            text={mapKeys("Go to Stats")}
            onClick={() => {
              navigate("/home/edit-entry");
              setHasNewEditEntryToFalse();
            }}
          />
        </Badge>
      ) : (
        <Box component={"div"} width="100%" textAlign="center">
          <Typography variant="body1">
            {mapKeys("Write some more!")}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(wordCount / minWordCount) * 100}
            color="primary"
          />
        </Box>
      )}
      <Box
        component={"div"}
        mt={0.5}
        display="flex"
        alignItems="center"
        width="100%"
      >
        {allowanceLeftPercentage > 0 && canProcess && (
          <Box component={"div"} width="100%">
            <LinearProgress
              variant="determinate"
              value={allowanceLeftPercentage}
              color={allowanceLeftPercentage <= 20 ? "error" : "primary"}
            />
          </Box>
        )}
        {processAllowance === 0 && wordCount > minWordCount && (
          <Box component={"div"} width="100%" textAlign="center">
            <Typography variant="caption">
              {mapKeys("Auto-processing exhausted")}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RedirectStatsButton;
