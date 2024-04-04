import React, { useState, useEffect, useContext } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItemButton, ListItemIcon, ListItemText, Button, Paper, useTheme } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { AnimatedCheckbox } from '../utils/Buttons';
import { Moon } from 'iconsax-react';
import { MapKeysContext } from '../contexts/MapKeysContext';
interface SleepSurveyProps {
  display: string | undefined;
  sleepSurvey: boolean[] | undefined;
  sleepQuestions: string[];
  handleQuestionChange: (index: number) => void;
  navigate: (path: string) => void;
  paperWidth: number | null;
}

const SleepSurvey: React.FC<SleepSurveyProps> = ({
  display,
  sleepSurvey,
  sleepQuestions,
  handleQuestionChange,
  navigate,
  paperWidth,
}) => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();
  useEffect(() => {
    const savedState = localStorage.getItem('sleepSurveyExpanded');
    if (savedState !== null) {
      setExpanded(JSON.parse(savedState));
    } else {
      setExpanded(false);
    }
  }, []);

  const handleAccordionChange = () => {
    const newState = !expanded;
    setExpanded(newState);
    localStorage.setItem('sleepSurveyExpanded', JSON.stringify(newState));
  };
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <>
      {display && display === "sleep_survey" && sleepSurvey && (
        <Paper
          elevation={3}
          sx={{
            width: paperWidth !== null ? paperWidth : "",
            backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.default : '',
            color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '',
            borderRadius: '8px',
            padding: 'px',
            marginBottom: '16px',
          }}
          className="ml-10 max-w-[80%] min-w-[80%]"
        >
          <Accordion
            expanded={expanded}
            onChange={handleAccordionChange}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.mode === 'dark' ? '#fff' : '' }} />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>{mapKeys("Sleep Survey")}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ p: 0 }}>
                {sleepQuestions.map((question: string, index: number) => (
                  <ListItemButton
                    sx={{ pointerEvents: "auto", py: 2.5 }}
                    key={index}
                    onClick={() => handleQuestionChange(index)}
                  >
                    <ListItemIcon sx={{ p: 0 }}>
                      <AnimatedCheckbox xMark isChecked={sleepSurvey[index]} />
                    </ListItemIcon>
                    <ListItemText
                      primary={mapKeys(question)}
                      primaryTypographyProps={{
                        sx: { fontSize: "16px", textTransform: "none", pl: 1 },
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
              <div className="flex gap-2 align-middle items-center">
                <Typography variant="body2" sx={{ fontSize: "15px" }}>
                  {mapKeys("Don't forget to text me about your sleep!")}
                </Typography>
                <Button
                  onClick={() => navigate("/home/edit-entry/sleep")}
                  variant="outlined"
                  sx={{
                    borderRadius: "30px",
                    textTransform: "none",
                    minWidth: "140px",
                    marginBottom: "10px",
                  }}
                  startIcon={
                    <Moon
                      style={{ fontSize: theme.iconSize.medium, color: theme.palette.primary.main }}
                    />
                  }
                >
                  {mapKeys("View now")}
                </Button>
              </div>
            </AccordionDetails>
          </Accordion>
        </Paper>
      )}
    </>
  );
};

export default SleepSurvey;
