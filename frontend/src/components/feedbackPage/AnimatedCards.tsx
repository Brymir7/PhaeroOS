import { useContext, useEffect, useRef, useState } from "react";
import "./AnimatedCards.css";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import { Typography } from "@mui/material";
import { MapKeysContext } from "../contexts/MapKeysContext";

interface Props {
  inputText: string[];
  handleEndOfCards: () => void;
  delayAppearance?: boolean;
}

function AnimatedCards({
  inputText,
  handleEndOfCards,
  delayAppearance = false,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [cardsHeight, setCardsHeight] = useState<number>();
  const [hasNewHeight, setHasNewHeight] = useState<boolean>(false);
  const ulRef = useRef<HTMLUListElement>(null);

  // Function to adjust cards height
  const adaptCardHeight = () => {
    setTimeout(
      () => {
        changeHeight();
      },
      delayAppearance ? 300 : 100
    );
  };

  const changeHeight = () => {
    if (ulRef.current) {
      const listItems = Array.from(ulRef.current.children) as HTMLLIElement[];
      let maxHeight = 0;

      // Temporarily reset all items to their natural height to accurately measure their content
      listItems.forEach((li) => {
        li.style.height = "auto";
      });

      // Measure the heights and find the max height
      listItems.forEach((li) => {
        const contentHeight = li.getBoundingClientRect().height;
        maxHeight = Math.max(maxHeight, contentHeight);
      });

      // Check if the new max height is different from the current to prevent infinite loop
      if (!cardsHeight || maxHeight !== cardsHeight) {
        setCardsHeight(maxHeight);
        // Apply the max height to all items, only if necessary
        listItems.forEach((li) => {
          li.style.height = `${maxHeight}px`;
        });
      }

      setHasNewHeight(true);
    }
  };
  // Set up and clean up resize event listener
  useEffect(() => {
    window.addEventListener("resize", adaptCardHeight);
    return () => window.removeEventListener("resize", adaptCardHeight);
  }, []);

  useEffect(() => {
    adaptCardHeight();
  }, [inputText]);

  const handleClick = () => {
    // Remove the check for `cards` as we're using a state-driven approach
    const totalCards = inputText.length;
    const closeFeedback = (currentIndex + 1) % totalCards === 0;
    if (closeFeedback) {
      setCurrentIndex(0);
      handleEndOfCards(); // Ensure this function is defined and does what's intended
      return;
    }
    setCurrentIndex((currentIndex + 1) % totalCards);
  };
  const {mapKeys} = useContext(MapKeysContext)
  return (
    inputText.length > 0 && (
      <ul
        ref={ulRef}
        className={`cards w-full text-black cards-light duration-200 ${
          !hasNewHeight && delayAppearance ? "opacity-0" : "opacity-100"
        }`}
      >
        {inputText.map((item, index) => (
          <li
            onClick={() => handleClick()}
            style={{
              height: cardsHeight ? `px` : "auto",
            }} // Adjusted for dynamic height per card
            className={`card rounded-xl w-full max-w-[500px] border  shadow-sm cards-light ${
              currentIndex === index ? "card--current" : ""
            } ${
              (currentIndex + 1) % inputText.length === index
                ? "card--next"
                : ""
            } ${
              currentIndex - 1 === index
                ? // (currentIndex === 0 && index === inputText.length - 1)
                  "card--out"
                : ""
            }`}
            key={index}
          >
            <div className={`w-full h-full rounded-xl p-4  relative`}>
              <MarkdownDisplay text={item} />
{index === 0 &&              <div className="absolute bottom-2 right-2">
                <Typography variant="caption">{mapKeys("Click to continue")}</Typography>
              </div>}
            </div>
          </li>
        ))}
      </ul>
    )
  );
}

export default AnimatedCards;
