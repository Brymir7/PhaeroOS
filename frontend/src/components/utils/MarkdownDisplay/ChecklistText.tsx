import { Box, Typography, useTheme } from "@mui/material";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

import { CodeBlock } from "./CodeBlock";
interface ChecklistTextProps {
  title: string;
  description: string;
}
const ChecklistText = ({ title, description }: ChecklistTextProps) => {
  const theme = useTheme();
  return (
    <Box
      display="flex"
      component="div"
      flexDirection="column"
      alignItems="start"
      width="100%"
      sx={{ gap: 0.25 }}
    >
      <Box
        component="div"
        display="flex"
        flexDirection="row"
        alignItems="center"
        sx={{ gap: 1 }}
      >
        <div className="p-1 h-5 w-5 flex justify-center items-center">
          <FontAwesomeIcon icon={faCheck} color={theme.palette.primary.main} size="sm" />
        </div>
        <Typography variant="body2" noWrap component="span">
          {title}
        </Typography>{" "}
      </Box>
      {description.length > 0 && (
        <div className="mb-1">
          <CodeBlock>{description}</CodeBlock>
        </div>
      )}
    </Box>
  );
};

export default ChecklistText;
