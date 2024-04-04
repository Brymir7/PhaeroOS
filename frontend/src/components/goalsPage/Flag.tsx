import {  faFlag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Button } from "@mui/material";

const GoalFlag = ({ achieved, onCheck }: { achieved: boolean, onCheck: () => void }) => {
  return (
    <Button style={{padding: 0, transform: "translateX(-30%)"}} onClick={onCheck}>
      <FontAwesomeIcon className="" icon={faFlag} size="2xl" color={achieved ? "" : "lightgrey"}></FontAwesomeIcon>
    </Button>
  );
}; 
export default GoalFlag;
