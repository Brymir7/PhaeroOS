import { useEffect, useState } from "react";
import {
  Card,
  CardMedia,
  Typography,
  CardContent,
  Box,
  CardHeader,
  IconButton,
} from "@mui/material";
import {
  faBurger,
  faCloudArrowUp,
  faFileLines,
  faPaperclip,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LoadingButton from "@mui/lab/LoadingButton";
interface Props {
  file: File;
  setFile: React.Dispatch<React.SetStateAction<File | undefined>>;
  convertFileToText: (file: File) => void;
  convertFoodImageToText: (file: File) => void;
  attachImageToText: (file: File) => void;
  uploadType: "handwriting" | "food"| "attachment";
  fileUploadLoading: boolean;
}
const DisplayFile = ({
  file,
  setFile,
  convertFileToText,
  convertFoodImageToText,
  attachImageToText,
  uploadType,
  fileUploadLoading,
}: Props) => {
  const [imageURL, setImageURL] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (file) {
      // Create a URL for the file
      const url = URL.createObjectURL(file);
      setImageURL(url);

      // Clean up the URL on unmount
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const getHeading = () => {
    switch (uploadType) {
      case "handwriting":
        return "Add Handwritten";
      case "food":
        return "Add Food from Image";
      case "attachment":
        return "Add Attachment";
    }
  };
  const getFunctionToCall = () => {
    switch (uploadType) {
      case "handwriting":
        return convertFileToText;
      case "food":
        return convertFoodImageToText;
      case "attachment":
        return attachImageToText;
    }
  };
  const getIcon = () => {
    switch (uploadType) {
      case "handwriting":
        return <FontAwesomeIcon icon={faFileLines} size="2x" color="#0284c7" />;
      case "food":
        return <FontAwesomeIcon icon={faBurger} size="2x" color="#0284c7" />;
      case "attachment":
        return <FontAwesomeIcon icon={faPaperclip} size="2x" color="#0284c7" />;
    }
  };
  const removeFile = () => {
    setFile(undefined);
    setImageURL(undefined);
  };

  return (
    <Card
      elevation={2}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "auto",
      }}
    >
      <CardHeader
        sx={{ flexShrink: 0, borderBottom: 1, borderColor: "divider" }}
        avatar={
          <Box
          component="div"  margin={"auto"}
            display={"flex"}
            justifyContent={"center"}
            alignItems={"center"}
          >
            {getIcon()}
          </Box>
        }
        title={
          <Typography variant="h5" component="div">
            {getHeading()}
          </Typography>
        }
        action={
          <IconButton onClick={removeFile} aria-label="delete">
            <FontAwesomeIcon icon={faXmark} />
          </IconButton>
        }
      />
      <CardMedia
        image={imageURL}
        component="img"
        sx={{ flex: 1, height: 0 }} // Make the image flex and set its initial height to 0        image={imageURL}
        alt="Selected file"
      />
      <CardContent sx={{ flexShrink: 0, borderTop: 1, borderColor: "divider" }}>
        <Box component="div" display="flex" justifyContent="space-between" alignItems="center">
          <Typography gutterBottom variant="h5" component="div">
            Selected File
          </Typography>
          <LoadingButton
            loading={fileUploadLoading}
            onClick={() => getFunctionToCall()(file)}
            role={undefined}
            variant="contained"
            tabIndex={-1}
            startIcon={<FontAwesomeIcon icon={faCloudArrowUp} />}
            loadingPosition="start"
          >
            Upload file
          </LoadingButton>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {file.name}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DisplayFile;
