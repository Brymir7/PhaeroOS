import { Divider } from '@mui/material';

// Create the custom divider component
const GreenDivider = () => {
  return (
    <Divider
      sx={{
        height: '3px', // Increase the thickness
        backgroundColor: 'primary.main', // Change the color to the primary color
      }}
    />
  );
};

// Export the component
export default GreenDivider;
