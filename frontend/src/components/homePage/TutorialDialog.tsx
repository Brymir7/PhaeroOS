import React, { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  LinearProgress,
  useMediaQuery,
  useTheme,
  IconButton,
  Modal,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface TutorialStep {
  image: string;
  headline: string;
  explanation: string;
}

interface TutorialDialogProps {
  steps: TutorialStep[];
  open: boolean;
  onClose: () => void;
}
// @ts-ignore
import PhaeroCompanion from "/Phaero.png";
import { MapKeysContext } from "../contexts/MapKeysContext";

const TutorialDialog: React.FC<TutorialDialogProps> = ({
  steps,
  open,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const { mapKeys } = useContext(MapKeysContext);

  const allSteps = [
    {
      image: (
        <img
          src={PhaeroCompanion}
          alt="Phaero Companion"
          style={{ width: "auto", height: "auto", borderRadius: 50 }}
        />
      ),
      headline: mapKeys("Welcome to Phaero!"),
      explanation: mapKeys(
        "Hello and thank you for signing up! Meet your new buddy, Phaero - the lion. We're excited to guide you through our amazing features!"
      ),
    },
    ...steps,
  ];

  const handleNext = () => {
    if (currentStep < allSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };


  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : "16px",
            overflow: "hidden",
            height: fullScreen ? "100%" : "auto",
            maxHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <Box
          sx={{
            position: "relative",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>

          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              alignItems: "center",
              padding: isSmallScreen ? 2 : 4,
              overflow: "hidden", // Prevent overall content from scrolling
            }}
          >
            {currentStep === 0 ? (
              <Typography
                variant="h5"
                align="center"
                sx={{
                  fontWeight: "bold",
                  fontSize: isSmallScreen ? "1.2rem" : "1.5rem",
                  mb: 2,
                }}
              >
                {allSteps[currentStep].headline}
              </Typography>
            ) : (
              <Button onClick={() => setIsFullscreen(true)} variant="outlined">
                {mapKeys("Expand")}
              </Button>
            )}
            <Box
              sx={{
                width: "100%",
                flexGrow: 1,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                my: 2,
              }}
            >
              {currentStep !== 0 ? (
                <Box
                  sx={{
                    width: "100%",
                    height: "100%",
                    maxWidth: window.innerWidth < 400 ? window.innerWidth - 100 : 300,
                    maxHeight: "60vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundImage: `url(${allSteps[currentStep].image})`,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    borderRadius: "24px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    border: "10px solid #333",
                    aspectRatio: "9 / 16",
                  }}
                  onClick={handleToggleFullscreen}
                />
              ) : (
                <Box
                  sx={{
                    width: "auto",
                    height: "auto",
                    maxWidth: "100%",
                    maxHeight: "60vh",
                  }}
                >
                  {allSteps[currentStep].image}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                width: "100%",
                maxHeight: "30vh", // Limit the height of the text container
                overflowY: "auto", // Allow vertical scrolling
                mb: 2,
                position: "relative",
                "&::after": {
                  content: '""',
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "20px",
                  background: "linear-gradient(to top, rgba(255,255,255,0.6), rgba(255,255,255,0.5))",
                  pointerEvents: "none",
                },
              }}
            >
              <Typography
                variant="body2"
                align="center"
                sx={{
                  maxWidth: "90%",
                  fontSize: isSmallScreen ? "0.9rem" : "1rem",
                  lineHeight: 1.6,
                  mx: "auto", // Center the text
                  pb: 3, // Add padding at the bottom to show the gradient
                }}
              >
                {allSteps[currentStep].explanation}
              </Typography>
            </Box>
          </DialogContent>

          <Box sx={{ px: isSmallScreen ? 2 : 3, py: 2 }}>
            <LinearProgress
              variant="determinate"
              value={(currentStep * 100) / (allSteps.length - 1)}
              sx={{
                height: 6,
                borderRadius: 3,
                "& .MuiLinearProgress-bar": {
                  borderRadius: 3,
                },
              }}
            />
          </Box>

          <DialogActions
            sx={{
              justifyContent: "space-between",
              px: isSmallScreen ? 2 : 3,
              py: isSmallScreen ? 1 : 2,
            }}
          >
            {currentStep === 0 ? (
              <Button
                onClick={handleSkip}
                color="inherit"
                size={isSmallScreen ? "small" : "medium"}
              >
                {mapKeys("Skip")}
              </Button>
            ) : (
              <Button
                onClick={handleBack}
                variant="outlined"
                size={isSmallScreen ? "small" : "medium"}
              >
                {mapKeys("Back")}
              </Button>
            )}
            <Button
              onClick={handleNext}
              variant="contained"
              color="primary"
              size={isSmallScreen ? "small" : "medium"}
            >
              {currentStep === allSteps.length - 1
                ? mapKeys("Finish")
                : mapKeys("Next")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      <Modal
        open={isFullscreen}
        onClose={handleToggleFullscreen}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(0, 0, 0, 0.8)",
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            maxWidth: 450,
            maxHeight: 800,
            backgroundImage: `url(${allSteps[currentStep].image})`,
            backgroundSize: "contain",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            outline: 0,
            border: "20px solid #333", // Add a thicker border for fullscreen mode
            borderRadius: "36px", // Increase border radius for fullscreen mode
            aspectRatio: "9 / 16", // Maintain aspect ratio in fullscreen
          }}
        >
          <IconButton
            onClick={handleToggleFullscreen}
            sx={{
              position: "absolute",
              top: 4,
              right: 4,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </Modal>
    </>
  );
};

export default TutorialDialog;
