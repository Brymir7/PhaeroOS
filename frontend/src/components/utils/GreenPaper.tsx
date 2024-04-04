// GreenPaper.tsx
import React from 'react';
import { Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { PaperProps } from '@mui/material/Paper';

const CustomGreenPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderColor: theme.palette.primary.main,
  borderStyle: 'solid',
  borderWidth: 1,
  boxShadow: `0px 1px 2px ${theme.palette.primary.main}, 0px -1px 2px ${theme.palette.primary.main}`, // Adjusted to have symmetrical shadows top and bottom
  color: theme.palette.getContrastText(theme.palette.background.paper),
}));

const GreenPaper: React.FC<PaperProps> = (props) => {
  return <CustomGreenPaper {...props} />;
};

export default GreenPaper;
