import React, { useContext } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { MapKeysContext } from "../contexts/MapKeysContext";

type JournalGuideProps = {
  onClose: () => void;
};

const JournalGuide: React.FC<JournalGuideProps> = ({ onClose }) => {
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{mapKeys("Journaling Guide")}</DialogTitle>
      <DialogContent
        dividers={true}
        style={{ height: "80vh", overflow: "auto" }}
      >
        <Typography gutterBottom variant="h6">
          {mapKeys("Welcome to Journaling!")}
        </Typography>
        <Typography paragraph>
          {mapKeys(`Journaling is a powerful tool for self-reflection, planning, and capturing memories. This guide will help you get started and make the most of your journaling experience.`)}
        </Typography>
        <Typography paragraph>
          <strong>{mapKeys("Getting Started:")}</strong>
          {mapKeys(`Begin by writing about your day, your thoughts, feelings, or anything that's on your mind. There's no right or wrong way to journal—it's all about what works best for you.`)}
        </Typography>
        <Typography gutterBottom variant="h6">
          {mapKeys("Using Markdown")}
        </Typography>
        <Typography paragraph>
          {mapKeys(`Our journal supports Markdown, a simple way to format text. Here are some basics:`)}
        </Typography>
        <Typography paragraph component="div">
          <ul>
            <li>
              <strong>{mapKeys("Bold:")}</strong>{" "}
              <code>{mapKeys("**Put text you want bold here!**")}</code>
            </li>
            <li>
              <strong>{mapKeys("Italic:")}</strong> <code>{mapKeys("*text*")}</code>
            </li>
            <li>
              <strong>{mapKeys("Headings:")}</strong> <code>{mapKeys("# H1 ## H2 ### H3")}</code>
            </li>
            <li>
              <strong>{mapKeys("Lists:")}</strong> <code>{mapKeys("- item")}</code> {mapKeys("or")}{" "}
              <code>{mapKeys("1. item")}</code>
            </li>
            <li>
              <strong>{mapKeys("Links:")}</strong> <code>[title](https://)</code>
            </li>
            <li>
              <strong>{mapKeys("Images:")}</strong> <code>{mapKeys("(Will get implemented soon)")}</code>
            </li>
            <li>
              <strong>{mapKeys("Blockquotes:")}</strong> <code>&gt; {mapKeys("quote")}</code>
            </li>
            <li>
              <strong>{mapKeys("Code:")}</strong> <code>{mapKeys("`code`")}</code> {mapKeys("or")}{" "}
              <code>{mapKeys("```block```")}</code>
            </li>
          </ul>
        </Typography>
        <Typography paragraph>
          {mapKeys(`Experiment with these formatting options to add structure and emphasis to your journal entries.`)}
        </Typography>
        <Typography gutterBottom variant="h6">
          {mapKeys("Tips for Effective Journaling")}
        </Typography>
        <Typography paragraph>
          {mapKeys(`- Write regularly, but don't stress about frequency. What matters is consistency.`)}
        </Typography>
        <Typography paragraph>
          {mapKeys(`- Be honest and open with your entries. Your journal is a private space for self-expression.`)}
        </Typography>
        <Typography paragraph>
          {mapKeys(`- Use prompts if you're stuck. They can provide inspiration and direction for your writing.`)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {mapKeys("Close Guide")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default JournalGuide;
