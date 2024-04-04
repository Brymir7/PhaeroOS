// OutlinedIconButton.tsx
import React from 'react';
import Button from '@mui/material/Button';

interface OutlinedIconButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  icon: React.ReactNode;
  disabled?: boolean;
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
}

const OutlinedIconButton: React.FC<OutlinedIconButtonProps> = ({ onClick, icon, disabled = false, color = 'default' }) => {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      disabled={disabled}
      color={color as any}
      startIcon={icon}
      style={{ padding: '8px 16px', minWidth: 'auto' }}
    >
      {icon}
    </Button>
  );
};

export default OutlinedIconButton;
