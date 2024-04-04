import React, { useContext, useState } from "react";
import {
  Grid,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  DialogTitle,
} from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";
interface FlagChangerProps {
  flag: string;
  setFlag: (flag: string, number?: number) => void;
  numberGoalProp?: number;
}
function FlagChanger({ flag, setFlag, numberGoalProp }: FlagChangerProps)  {
  const [open, setOpen] = useState(false);
  const [newFlag, setNewFlag] = useState(flag);
  const [numberGoal, setNumberGoal] = useState<number|undefined>(numberGoalProp)// Assuming you want to update the flag on each input change. You can also do this on form submit.
  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };
  const handleSave = () => {
    setFlag(newFlag, numberGoal);
    setOpen(false);
  }
  const handleUpdateText = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setNewFlag(event.target.value); 
  };
  const handleUpdateNumber = (event: {  
    target: { value: React.SetStateAction<string> };
  }) => {
    setNumberGoal(Number(event.target.value));
  }
  const {mapKeys} = useContext(MapKeysContext);
  return (

      <Grid item xs={4}>
        <Typography variant="body1" onClick={handleClickOpen}>
          {flag}
        </Typography>


      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{mapKeys("Change Flag")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
           {mapKeys(" Please enter the new flag value.")}
          </DialogContentText>
          <TextField
            
            margin="dense"
            id="name"
            label={mapKeys("New Flag")}
            type="text"
            fullWidth
            variant="outlined"
            defaultValue={flag}
            onChange={handleUpdateText}
          />
          <TextField
            margin="dense"
            id="name"
            label={mapKeys("Number Goal")}
            type="number"
            fullWidth
            variant="outlined"
            defaultValue={numberGoalProp?.toPrecision(4)}
            onChange={handleUpdateNumber}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{mapKeys("Cancel")}</Button>
          <Button onClick={handleSave}>{mapKeys("Update")}</Button>
        </DialogActions>
      </Dialog>
      </Grid>
  );
}

export default FlagChanger;
