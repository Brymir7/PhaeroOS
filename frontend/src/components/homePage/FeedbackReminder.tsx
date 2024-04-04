import { useContext, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { AuthContext } from "../contexts/AuthContext";
import { Button, Paper, Typography } from "@mui/material";
import { faArrowRight, faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import AdviceWithCards from "../feedbackPage/AdviceWithCards";
import FeedbackIcon from "../../assets/notes.svg";

function FeedbackReminder() {
  const [feedbackString, setFeedbackString] = useState("");
  const [loading, setLoading] = useState(true);
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  const api = useApi();

  useEffect(() => {
    if (hasAccess) {
      api
        .get("/predictions/feedback/")
        .then((response) => {
          if (response.data.length > 0) {
            setFeedbackString(response.data[0].advice_best_days);
          }
          setLoading(false);
        })
        .catch((error) => {
          handleAllErrors(error);
        });
    }
  }, [hasAccess]);

  return (
    <Paper className="relative flex flex-col flex-grow h-full w-full rounded-md">
      <div className="flex items-center justify-between text-xl pt-2 px-4 ">
        <Typography variant="h6">
          <FontAwesomeIcon icon={faMessage} className="mr-2" />
          {mapKeys("Your last feedback")}
        </Typography>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          component={RouterLink}
          to="/home/feedback"
          endIcon={<FontAwesomeIcon size="sm" icon={faArrowRight} />}
        >
          {mapKeys("more")}
        </Button>
      </div>
      <div className="flex w-full h-full justify-center ">
        {!loading &&
          (feedbackString !== "" ? (
            <Paper
              elevation={2}
              className={`flex  pt-2 px-6 mt-1 mb-3  items-center align-middle`}
              sx={{
                minWidth: "fit-content",
              }}
            >
              <AdviceWithCards
                manualMaxChars={250}
                adviceText={feedbackString}
                delayAppearance={true}
                handleEndOfCards={() => {}}
              />
            </Paper>
          ) : (
            <div className="flex flex-col m-auto pb-6 items-center space-y-2">
              <img className="w-28" src={FeedbackIcon} alt="feedback" />

              <p className="text-lg">{mapKeys("No feedback found")}</p>
              <p className="text-center text-gray-700">
                {mapKeys("Keep using Phaero to receive your first feedback")}
              </p>
            </div>
          ))}
      </div>
    </Paper>
  );
}

export default FeedbackReminder;
