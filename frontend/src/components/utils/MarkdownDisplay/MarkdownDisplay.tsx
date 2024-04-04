import Markdown from "markdown-to-jsx";
import ChecklistText from "./ChecklistText";
import HabitText from "./HabitText";
import { Typography } from "@mui/material";
import { CodeBlock } from "./CodeBlock";
import { useEffect, useState } from "react";

interface Props {
  text: string;
  images?: string[];
  highlightedText?: string;
  onTextClick?: (position: string) => void;
  backgroundColorHorizontalRule?: string;
}

const MarkdownDisplay = ({
  text,
  images,
  highlightedText,
  onTextClick,
  backgroundColorHorizontalRule = "#ffffff",
}: Props) => {
  const [transformedText, setTransformedText] = useState<string>("");

  const transformText = (text: string) => {
    const habitRegex =
      /#h\s+((?:'[^']*'|[^'\s]+))(?:\s+([^#*\n]*?))?\s*($|\n)/g;
    const checklistRegex =
      /#c\s+((?:'[^']*'|[^'\s]+))(?:\s+([^#*\n]*?))?\s*($|\n)/g;
    const imageRegex = /#i(\d+)/g;
    const underlinedHeadlineRegex = /#(.+)\n--+/g;
    const underlinedHeadlineRegex2 = /#(.+)\n=+/g; // Updated regex to match any text followed by any number of -
    const specialHeaderRegex = /\*\*(.+)\*\*\n=+/g; // Updated regex to match any text surrounded by ** followed by any number of =
    const horizontalRuleRegex = /^\s*---+\s*$/gm; // New regex to match lines with only "---"
    const markdownHeadlineRegex = /^(#+\s.*)$/gm; // Regex to match markdown headlines
    const markdownListRegex = /^(\*|\-|\d+\.)\s(.*)$/gm; // Regex to match markdown list items

    let transformed = text
      .replace(
        habitRegex,
        (_, title, description = "", newline) =>
          `<HabitText title='${title
            .replace("'", "")
            .trim()}' description='${description.trim()}'/>${newline}`
      )
      .replace(
        checklistRegex,
        (_, title, description = "", newline) =>
          `<ChecklistText title='${title
            .replace("'", "")
            .trim()}' description='${description.trim()}'/>${newline}`
      )
      .replace(
        underlinedHeadlineRegex, // Replace matches with underlined headline
        (_, headline) =>
          `<UnderlinedHeadline>${headline}</UnderlinedHeadline>\n\n`
      )
      .replace(
        specialHeaderRegex, // Replace matches with special header
        (_, header) => `<MainHeadline>${header}</MainHeadline>\n\n`
      )
      .replace(
        underlinedHeadlineRegex2, // Replace matches with underlined headline
        (_, headline) =>
          `<UnderlinedHeadline>${headline}</UnderlinedHeadline>\n\n`
      )
      .replace(
        horizontalRuleRegex, // Replace matches with horizontal rule
        () => `<HorizontalRule><HorizontalRule/>\n\n`
      )
      .replace(
        markdownHeadlineRegex, // Ensure all markdown headlines are followed by double newlines
        (_, headline) => `${headline}\n\n`
      )
      .replace(
        markdownListRegex, // Ensure all markdown list items are followed by double newlines
        (_, bullet, listItem) => `${bullet} ${listItem}\n\n`
      );

    if (images) {
      transformed = transformed.replace(imageRegex, (_, imageKey: string) => {
        const imageUrl = images[Number(imageKey) - 1];
        return imageUrl
          ? `<img src="${imageUrl}" alt="${imageKey}" />\n\n`
          : `<error key=${imageKey}>Image not found</error>\n\n`;
      });
    }

    if (highlightedText) {
      const escapedHighlightedText = highlightedText.replace(
        /[-/\\^$*+?.()|[\]{}]/g,
        "\\$&"
      );
      const highlightRegex = new RegExp(escapedHighlightedText, "gi");
      transformed = transformed.replace(highlightRegex, `<mark>$&</mark>`);
    }

    return transformed;
  };

  useEffect(() => {
    setTransformedText(transformText(text));
  }, [text, highlightedText]);

  const handleMarkdownClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target && onTextClick && target.textContent) {
      onTextClick(target.textContent.trim());
    }
  };

  return (
    <div onClick={handleMarkdownClick}>
      <Markdown
        options={{
          overrides: {
            h1: {
              component: ({ children }) => (
                <Typography variant="h4" align="center" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            h2: {
              component: ({ children }) => (
                <Typography variant="h5" align="left" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            h3: {
              component: ({ children }) => (
                <Typography variant="h6" align="left" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            h4: {
              component: ({ children }) => (
                <Typography variant="body1" align="left" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            h5: {
              component: ({ children }) => (
                <Typography variant="body2" align="left" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            h6: {
              component: ({ children }) => (
                <Typography variant="body2" align="left" gutterBottom>
                  {children}
                </Typography>
              ),
            },
            p: {
              component: ({ children }) => (
                <Typography variant="body2">{children}</Typography>
              ),
            },
            ul: {
              component: ({ children }) => (
                <ul className="ml-5 list-disc">
                  <Typography variant="body2">{children}</Typography>
                </ul>
              ),
            },
            ol: {
              component: ({ children }) => (
                <ol className="ml-5 list-decimal ">
                  <Typography variant="body2">{children}</Typography>
                </ol>
              ),
            },
            li: {
              component: ({ children }) => (
                <li>
                  <Typography variant="body2">{children}</Typography>
                </li>
              ),
            },
            strong: {
              component: ({ children }) => (
                <Typography variant="body2" align="left">
                  <strong>{children}</strong>
                </Typography>
              ),
            },
            em: {
              component: ({ children }) => (
                <Typography variant="body2" align="left">
                  <em>{children}</em>
                </Typography>
              ),
            },
            code: {
              component: ({ children }) => <CodeBlock>{children}</CodeBlock>,
            },
            blockquote: {
              component: ({ children }) => (
                <Typography variant="body2" align="left">
                  <blockquote>{children}</blockquote>
                </Typography>
              ),
            },
            HabitText: {
              component: HabitText,
            },
            ChecklistText: {
              component: ChecklistText,
            },
            UnderlinedHeadline: {
              component: ({ children }) => (
                <Typography variant="h6" align="left" gutterBottom>
                  <u>{children}</u>
                </Typography>
              ),
            },
            HorizontalRule: {
              component: () => (
                <hr
                  style={{
                    border: "0",
                    height: "1px",
                    width: "100%",
                    background: backgroundColorHorizontalRule,
                  }}
                />
              ),
            },
            MainHeadline: {
              component: ({ children }) => (
                <Typography variant="h4" align="center" gutterBottom>
                  <u>{children}</u>
                </Typography>
              ),
            },
            img: {
              component: ({ src, alt }) => (
                <span className="flex justify-center">
                  <img src={src} alt={alt} style={{ maxWidth: "100%" }} />
                </span>
              ),
            },
            error: {
              component: ({ children }) => (
                <Typography variant="inherit" align="left">
                  <span style={{ color: "red" }}>{children}</span>
                </Typography>
              ),
            },
          },
          disableParsingRawHTML: false,
        }}
      >
        {transformedText}
      </Markdown>
    </div>
  );
};

export default MarkdownDisplay;
