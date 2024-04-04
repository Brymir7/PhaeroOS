import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import RenderExerciseEdit from "../../homePage/RenderExerciseEdit";
import { ExerciseItem } from "../../utils/exerciseInterfaces";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import { useContext, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

interface EditExerciseDialogProps {
  exercise: ExerciseItem;
  onChange: (exercise: ExerciseItem) => void;
  onClose: () => void;
}
const EditExerciseDialog = ({
  exercise,
  onChange,
  onClose,
}: EditExerciseDialogProps) => {
  const { mapKeys } = useContext(MapKeysContext);
  const [exerciseData, setexerciseData] = useState<ExerciseItem>({
    ...exercise,
  });
  const handleSave = () => {
    onChange(exerciseData);
    onClose();
  };
  return (
    <Dialog open={true} onClose={handleSave} fullWidth maxWidth="sm">
      <DialogTitle>
        <div className="flex justify-between">
          <div className="pt-2 text-3xl">{mapKeys("Edit Exercise")}</div>
          <Button
          color="error">
            <FontAwesomeIcon
              
            icon={faXmark}
            size="3x"
            onClick={() => onClose()}
          ></FontAwesomeIcon></Button>
        </div>
      </DialogTitle>
      <DialogContent sx={{ overflowY: "unset" }}>
        <RenderExerciseEdit
          exercise={exerciseData}
          onChange={setexerciseData}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSave}>{mapKeys("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};
export default EditExerciseDialog;
