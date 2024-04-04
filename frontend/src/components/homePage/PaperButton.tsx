import React, { useContext } from 'react';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import { CircularProgress, useTheme } from '@mui/material';
import { MapKeysContext } from '../contexts/MapKeysContext';


interface PaperButtonProps {
  icon?: React.ReactNode;
  text?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  color?: 'primary' | 'secondary' | undefined;
  badgeContent?: string | number;
  badgeColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined;
  badgeInvisible?: boolean;
  customButton?: React.ReactNode;
  normalSize?: 'xs' | 'lg' | 'sm' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  mobileSize?: 'xs' | 'lg' | 'sm' | '1x' | '2x' | '3x' | '4x' | '5x' | '6x' | '7x' | '8x' | '9x' | '10x';
  width?: number; 
  height?: number;
  rounded?: boolean;
  showLoadingAnimation?: boolean;
  disabled?: boolean;
}

const PaperButton: React.FC<PaperButtonProps> = ({
  icon,
  text,
  onClick,
  color = 'primary',
  badgeContent,
  badgeColor = 'default',
  badgeInvisible = false,
  customButton,
  width,
  height,
  rounded,
  showLoadingAnimation,
  disabled,
}) => {
  const { mapKeys } = useContext(MapKeysContext);
      const theme = useTheme();
  const buttonContent = customButton ? (
    customButton
  ) : icon && !text ? (
    <Button
      variant="text"
      color={color}
      onClick={onClick}
      disabled={disabled}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
    >
      {icon}
    </Button>
  ) : (
    <Button
      variant="text"
      color={color}
      disabled={disabled}
      startIcon={icon ? icon : null}
      onClick={onClick}
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}
    >
      {text ? mapKeys(text) : null}
    </Button>
  );

  return (

    <Paper 
      elevation={3} 
      className={`flex justify-center items-center mb-2 pt-1${rounded ? ' rounded-md' : ''}`} 
      style={{ 
        display: 'inline-flex', 
        padding: '10px', 
        width: width ? `${width}px` : 'auto', 
        height: height ? `${height}px` : 'auto', 
        borderRadius: rounded ? 999 : 0,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="h-full w-full flex justify-center align-middle"onClick={(e) => {
        if (!disabled) {
          onClick && onClick(e as any);
        }
      }}>
      {badgeContent !== undefined ? (
        <Badge color={badgeColor} badgeContent={<span style={{ color: theme.palette.info.text}}>{badgeContent}</span>} invisible={badgeInvisible} >
          {buttonContent}
        </Badge>
      ) : !showLoadingAnimation ? (
        buttonContent
      ) : (
        <CircularProgress size={24} />
      )}</div>
    </Paper>
  );
};

export default PaperButton;
