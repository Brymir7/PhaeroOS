import React, { useContext } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";

type ConfirmationPopupProps = {
  message: string;
  message2?: string;
  onConfirm: () => void;
  onCancel: () => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  hideCancel?: boolean;
};

function ConfirmationPopup({
  message,
  message2,
  setIsOpen,
  onConfirm,
  onCancel,
  hideCancel = false,
}: ConfirmationPopupProps): JSX.Element {
  const { mapKeys } = useContext(MapKeysContext);

  const handleConfirm = (): void => {
    setIsOpen(false);
    onConfirm();
  };

  const handleCancel = (): void => {
    setIsOpen(false);
    onCancel();
  };

  return (
    <Dialog
      open={true} // You might want to control this with a state
      onClose={handleCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{mapKeys(message)}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message2 ? mapKeys(message2) : ""}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        {!hideCancel && (
          <Button onClick={handleCancel} variant="outlined" color="primary">
            {mapKeys("Cancel")}
          </Button>
        )}
        <Button variant="contained" onClick={handleConfirm} color="primary">
          {mapKeys("Confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationPopup;
