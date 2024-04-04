import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";

interface Props {
  text: string;
}

const FeedbackGoals = ({ text }: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [goal, setGoal] = useState<string>("");
  const api = useApi();

  const getGoal = () => {
    api
      .get("/settings/goal/")
      .then((response) => {
        setGoal(response.data[0].goal);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  useEffect(() => {
    getGoal();
  }, []);

  useEffect(() => {
    updateGoal();
  }, [goal]);

  const updateGoal = () => {
    api
      .post("/setup_user/goal/", { goal_text: goal })
      .then((response) => {
        if (response.status === 200) {
          getGoal();
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  return (
    <div className="max-w-lg mx-auto mb-auto mt-14">
      <p className="pt-4">{text}</p>
      <Typography sx={{ fontSize: 20 }} className="pt-8">
        {mapKeys("Change your goal")}
      </Typography>
      <FormControl
        color="primary"
        sx={{ mt: 2, width: 180 }}
        size="small"
      >
        <InputLabel id="demo-select-small-label">{mapKeys("Goal")}</InputLabel>
        <Select
          // labelId="demo-select-small-label"
          id="demo-select-small"
          value={goal}
          label="Nutrients"
          onChange={(e) => {
            setGoal(e.target.value);
          }}
        >
          <MenuItem value={"cutting"}>{mapKeys("lose weight")}</MenuItem>
          <MenuItem value={"maintenance"}>
            {mapKeys("maintain weight")}
          </MenuItem>
          <MenuItem value={"bulking"}>{mapKeys("gain weight")}</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};

export default FeedbackGoals;
