import { LinearProgress } from '@mui/material';
interface Props {
  wordCount?: number;
  noteLengthRestriction: number[];
}

const WordCountIndicator = ({ wordCount, noteLengthRestriction }: Props) => {
  const progressValue = () => {
    if (!wordCount) return 0;
    if (wordCount < noteLengthRestriction[0]) {
      return (wordCount / noteLengthRestriction[0]) * 100;
    } else if (wordCount <= noteLengthRestriction[1]) {
      return (wordCount / noteLengthRestriction[1]) * 100;
    } else {
      return 100; // Capped at 100% when word count exceeds maximum
    }
  };

  const progressColor = () => {
    if (!wordCount) return 'error';
    if (wordCount < noteLengthRestriction[0]) {
      return 'primary';
    } else if (wordCount <= noteLengthRestriction[1]) {
      return 'secondary';
    } else {
      return 'error';
    }
  };

  return (
    <LinearProgress
      variant="determinate"
      value={progressValue()}
      color={progressColor()}
      sx={{ width: '100%' }}
    />
  );
};

export default WordCountIndicator;
