import React, { useEffect } from "react";
import AnimatedCards from "./AnimatedCards";

interface Props {
  adviceText: string;
  handleEndOfCards: () => void;
  manualMaxChars?: number;
  delayAppearance?: boolean;
}

const AdviceWithCards = ({
  adviceText,
  handleEndOfCards,
  manualMaxChars = 100,
  delayAppearance = false,
}: Props) => {
  const [formattedText, setFormattedText] = React.useState<string[]>([]);
  const splitTextByBulletPointsWithIntro = (
    text: string,
    bulletPointRegex: RegExp
  ): string[] => {
    // Define regex to capture bullet points formatted as "number. **Title**:"

    const firstBulletIndex: number = text.search(bulletPointRegex);

    // Split the text into the introductory part and the bullet points
    const introText: string = text.substring(0, firstBulletIndex).trim(); // Capture text before the first bullet point
    const bulletPoints: string[] =
      text.substring(firstBulletIndex).match(bulletPointRegex) || [];
    const result: string[] = introText.length > 0 ? [introText] : [];

    bulletPoints.forEach((point) => {
      // Split each bullet point using the sentence splitting function
      const splitBullet = splitSentences(point.replace(":", ""), manualMaxChars);
      result.push(...splitBullet);
    });
    return result;
  };
  const splitSentences = (text: string, maxChars: number): string[] => {
    const sentenceRegex = /[^.!?]+[.!?]+|\S+/g;
    const sentences = text.match(sentenceRegex) || [];
    let currentSegment = "";
    let currentCharCount = 0;
    const newFormattedText: string[] = [];

    sentences.forEach((sentence) => {
      if (currentCharCount + sentence.length > maxChars + 50) {
        newFormattedText.push(currentSegment);
        currentSegment = sentence + " ";
        currentCharCount = sentence.length;
      } else if (
        currentCharCount + sentence.length > maxChars &&
        currentCharCount <= maxChars + 50
      ) {
        currentSegment += sentence + " ";
        currentCharCount += sentence.length;
        newFormattedText.push(currentSegment);
        currentSegment = "";
        currentCharCount = 0;
      } else {
        currentSegment += sentence + " ";
        currentCharCount += sentence.length;
      }
    });

    if (currentSegment.trim().length > 0) newFormattedText.push(currentSegment);

    return newFormattedText;
  };
  const splitTextByCharacterLimit = (text: string) => {
    // Define regex for sentences and bullet points
    const bulletPointRegex = /\d+\.\s(?:\*\*[^*]+\*\*|[^:\n]+)[^]+?(?=(\d+\.\s(?:\*\*[^*]+\*\*|[^:\n]+))|$)/g
; // Match Markdown bullet points
    text = text.trim(); // Trim text to avoid leading/trailing whitespace issues
    console.log("text", bulletPointRegex.test(text));
    if (bulletPointRegex.test(text)) {
      console.log(splitTextByBulletPointsWithIntro(text, bulletPointRegex));
      return splitTextByBulletPointsWithIntro(text, bulletPointRegex);
    } else {
      return splitSentences(text, manualMaxChars);
    }
  };

  useEffect(() => {
    setFormattedText(splitTextByCharacterLimit(adviceText));
  }, [adviceText]);

  return (
    <div className="flex w-full max-h-[50%] items-center justify-center">
      <AnimatedCards
        inputText={formattedText}
        handleEndOfCards={handleEndOfCards}
        delayAppearance={delayAppearance}
      />
    </div>
  );
};

export default AdviceWithCards;
