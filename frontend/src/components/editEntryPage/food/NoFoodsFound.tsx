import { useContext, useState } from 'react';
import { Paper, Typography } from '@mui/material';
// import FastfoodIcon from '@mui/icons-material/Fastfood';
// import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import { MapKeysContext } from '../../contexts/MapKeysContext';

const NoFoodDisplay = () => {
  const [isFasting, ] = useState(false);
  const {mapKeys} = useContext(MapKeysContext);
  return (
    <Paper elevation={2} className="flex flex-col items-center p-4">
      <Typography variant="h5" gutterBottom>
        {isFasting ? "Fasting Day" : mapKeys("No Foods Found")}
      </Typography>
      <Typography variant="body1" className="mb-4">
        {isFasting
          ? "Today is your fasting day. No meals have been added."
          : mapKeys("Looks like you haven't added any foods yet.")}
      </Typography>
      {/* {!viewOnly && (
        <ButtonGroup variant="outlined" aria-label="outlined button group">
          <Button
            startIcon={isFasting ? <RestaurantMenuIcon /> : <FastfoodIcon />}
            onClick={() => setIsFasting(!isFasting)}
          >
            {isFasting ? "Switch to Meal Plan" : "Mark as Fasting"}
          </Button>
        </ButtonGroup>
      )} */}
    </Paper>
  );
};

export default NoFoodDisplay;
