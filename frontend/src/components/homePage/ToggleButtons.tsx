import React, { useContext } from 'react';
import { Button, useTheme } from '@mui/material';
import { MapKeysContext } from '../contexts/MapKeysContext';

export interface ToggleButtonBluePrint {
  text: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  selected: boolean;
}

interface ToggleButtonGroupProps {
  buttons: ToggleButtonBluePrint[];
  onToggle?: (value: string) => void;
}

const CustomToggleButtonGroup: React.FC<ToggleButtonGroupProps> = ({ buttons, onToggle }) => {
  const handleToggle = (_: React.MouseEvent<HTMLElement>, newSelected: string) => {
    if (onToggle) {
      onToggle(newSelected);
    }
  };
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();
  return (
    <div style={{ borderRadius: '20px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      {buttons.map((button, index) => (
        <Button
          key={index}
          value={button.text}
          disabled={button.disabled}
          variant="outlined"
          onClick={(e) => handleToggle(e, button.text)}
          style={{
            margin: '0 5px',
            minHeight: '40px',
            minWidth: '50%',
            maxWidth: '50%',
            borderRadius: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: '0 10px',
            color: button.selected ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.87)',
            borderColor: button.selected ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.23)',
            borderWidth: button.selected ? '2px' : '1px',
            fontWeight: button.selected ? '600' : 'normal',
            transition: 'all 0.3s ease',
          }}
        >
          {button.icon && (
            <span style={{ marginRight: '5px', display: 'flex', alignItems: 'center' }}>
              {button.icon}
            </span>
          )}
          <span
            style={{
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              fontSize: 'small',
              textTransform: 'none',
              flex: 1,
            }}
          >
            {mapKeys(button.text)}
          </span>
        </Button>
      ))}
    </div>
  );
};

export default CustomToggleButtonGroup;
