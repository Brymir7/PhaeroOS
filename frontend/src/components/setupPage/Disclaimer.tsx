import { Button } from "@mui/material";
import { useContext } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";

interface Props {
  onCancel: () => void;
  onSubmit: () => void;
}

function Disclaimer({ onCancel, onSubmit }: Props) {
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <div className="max-w-lg space-y-4">
      <p className="text-base">
        {mapKeys(`This information is provided for educational purposes only and is not
        intended to be a substitute for professional medical advice, diagnosis,
        or treatment. Always seek the advice of your physician or other
        qualified health provider with any questions you may have regarding a
        medical condition. Never disregard professional medical advice or delay
        in seeking it because of something you have read here. The content
        provided is for general informational purposes and is not intended to be
        a definitive guide or advice.`)}
      </p>
      <div className="flex items-center justify-around">
        <p>{mapKeys("Do you accept that?")}</p>
        <div className="flex space-x-4">
          <Button onClick={onCancel} variant="outlined">
            {mapKeys("No")}
          </Button>
          <Button onClick={onSubmit} variant="contained">
            {mapKeys("Yes")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Disclaimer;
