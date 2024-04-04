import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Button,
  Box,
  Slider,
  ButtonGroup,
  TextField,
} from '@mui/material';
import { Add, Minus } from 'iconsax-react';
import { useTheme } from '@mui/material/styles';
import { MapKeysContext } from '../../contexts/MapKeysContext';

interface PortionSizeDialogProps {
  open: boolean;
  onClose: () => void;
  initialPortionSize: number;
  onSave: (newPortionSize: number) => void;
}

const PortionSizeDialog: React.FC<PortionSizeDialogProps> = ({
  open,
  onClose,
  initialPortionSize,
  onSave,
}) => {
  const theme = useTheme();
  const [portionSize, setPortionSize] = useState<number>(Math.round(initialPortionSize));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stepSizeRef = useRef<number>(1);
  const { mapKeys } = useContext(MapKeysContext);

  const handleChange = (_: Event, newValue: number | number[]) => {
    setPortionSize(Math.round(newValue as number));
  };

  const handleTextInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setPortionSize(Math.max(1, Math.min(5000, value)));
    }
  };

  const startIncrement = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setPortionSize(prev => Math.min(5000, Math.round(prev + stepSizeRef.current)));
      stepSizeRef.current = Math.min(100, stepSizeRef.current * 1.2);
    }, 100);
  };

  const startDecrement = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setPortionSize(prev => Math.max(1, Math.round(prev - stepSizeRef.current)));
      stepSizeRef.current = Math.min(100, stepSizeRef.current * 1.2);
    }, 100);
  };

  const stopIncrement = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      stepSizeRef.current = 1;
    }
  };

  const handleIncrease = () => {
    setPortionSize(prev => Math.min(5000, prev + 1));
  };

  const handleDecrease = () => {
    setPortionSize(prev => Math.max(1, prev - 1));
  };

  const handleSave = () => {
    onSave(Math.round(portionSize));
    onClose();
  };

  const handleQuickSet = (value: number) => {
    setPortionSize(value);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{mapKeys("Set Portion Size")}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, mb: 4 }}>
          <TextField
            value={portionSize}
            onChange={handleTextInputChange}
            type="number"
            inputProps={{ min: 1, max: 5000 }}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <Box display="flex" alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
            <IconButton
              onMouseDown={startDecrement}
              onMouseUp={stopIncrement}
              onMouseLeave={stopIncrement}
              onTouchStart={startDecrement}
              onTouchEnd={stopIncrement}
              onClick={handleDecrease}
              color="primary"
            >
              <Minus size={theme.iconSize.large} variant="Bold" />
            </IconButton>
            <Slider
              value={portionSize}
              onChange={handleChange}
              min={1}
              max={5000}
              sx={{ mx: 2, width: '60%' }}
            />
            <IconButton
              onMouseDown={startIncrement}
              onMouseUp={stopIncrement}
              onMouseLeave={stopIncrement}
              onTouchStart={startIncrement}
              onTouchEnd={stopIncrement}
              onClick={handleIncrease}
              color="primary"
            >
              <Add size={theme.iconSize.large} variant="Bold" />
            </IconButton>
          </Box>
          <ButtonGroup fullWidth variant="outlined" sx={{ mt: 2 }}>
            {[100, 200, 500, 1000, 2000].map((value) => (
              <Button key={value} onClick={() => handleQuickSet(value)}>
                {value}
              </Button>
            ))}
          </ButtonGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" fullWidth>{mapKeys("Cancel")}</Button>
        <Button onClick={handleSave} variant="contained" color="primary" fullWidth>{mapKeys("Save")}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default PortionSizeDialog;
