import { RefObject, useEffect, useRef, useState } from "react";

export const useWindowWidth = () => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowWidth;
};
export const useWindowHeight = () => {
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setWindowHeight(window.innerHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowHeight;
}
export const useOutsideClick = (
  callback: () => void,
  delay: number = 0 // Optional delay parameter with default value
): RefObject<HTMLDivElement> => {
  const ref = useRef<HTMLDivElement>(null);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleEvent = (event: MouseEvent | Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        // Clear any existing timeout to avoid duplicate calls
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
        }
        // Set a new timeout to delay the execution of the callback
        timeoutId.current = setTimeout(callback, delay);
      }
    };

    // Listen for both mousedown and scroll events
    document.addEventListener("mousedown", handleEvent);
    document.addEventListener("scroll", handleEvent, true); // Using capture phase for better detection

    return () => {
      // Remove event listeners on cleanup
      document.removeEventListener("mousedown", handleEvent);
      document.removeEventListener("scroll", handleEvent, true);
      // Make sure to clear the timeout when the component unmounts
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [callback, delay]);

  return ref;
};

import { useContext } from "react";
import { Language, MapKeysContext } from "../contexts/MapKeysContext";

export const useFormattedFoodName = () => {
  const { language } = useContext(MapKeysContext);

  const formatFoodName = (name: string) => {
    const newName = name.trim();

    if (language === Language.German) {
      return newName
        .trim()
        .toLowerCase()
        .replace(/(^|\s)\S/g, (char) => char.toUpperCase());
    }

    return newName.charAt(0).toUpperCase() + newName.slice(1).toLowerCase();
  };

  return formatFoodName;
};

export const useNumberValidation = (
  input: string,
  min: number = 0,
  max: number = 999999,
  allowDecimal: boolean = true,
  allowNegative: boolean = false
) => {
  // Trim leading and trailing whitespace from the input
  input = input.trim().replace(/,/g, ".");

  // Check if the input is empty or if it's a singular decimal point
  if (input === "" || input === ".") {
    return ""; // Return an empty string or another appropriate default value
  }

  // Define a regex that allows numbers, optional negative sign, and a trailing decimal if allowDecimal is true
  const regex = allowNegative ? /^-?\d*\.?\d{0,1}$/ : /^\d*\.?\d{0,1}$/;

  // Check if the input is a valid number based on the regex
  if (!regex.test(input)) {
    return; // Input contains invalid characters or too many decimals
  }

  // Convert input to a number
  let value = Number(input);

  // Special handling for inputs ending in a decimal point (e.g., "43.")
  if (allowDecimal && input.endsWith(".")) {
    return input; // Directly return the input string to allow the trailing decimal
  }

  // Check if the input is within the specified range
  const isOutOfRange = value < min || value > max;
  if (isOutOfRange) {
    return; // Input is outside the specified range
  }

  // If decimals are not allowed, round the number
  if (!allowDecimal) {
    value = Math.round(value);
  }

  // Check if negative values are not allowed and the input is negative
  if (!allowNegative && value < 0) {
    return 0;
  }

  return value;
};
