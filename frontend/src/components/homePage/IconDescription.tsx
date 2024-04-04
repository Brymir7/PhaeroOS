import { Paper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
interface IconDescriptionProps {
  secondaryText: string;
  primaryText: string | number;
  icon: React.ReactNode;
  disablePrecision?: boolean;
}

const IconDescription = ({ secondaryText, primaryText, icon, disablePrecision }: IconDescriptionProps) => {
  const theme = useTheme();
  return (
    <div className="flex items-center gap-2">
      <Paper style={{ borderRadius: 999, width: theme.iconSize.large + 2, height: theme.iconSize.large + 2, color: theme.palette.primary.main }} className="flex justify-center items-center">
        {icon}
      </Paper>
      <div className="flex flex-col">
        <Typography
          variant="body2"
          sx={{ color: theme.palette.primary.secondaryText }}
        >
          {secondaryText}
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: theme.palette.primary.text }}
        >
          {typeof primaryText === "number" && !disablePrecision ? primaryText.toFixed(1) : primaryText}
        </Typography>
      </div>
    </div>
  );
};

export default IconDescription;
