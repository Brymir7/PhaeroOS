import React, { useContext, useEffect, useState } from "react";
import { DebthButton } from "../utils/Buttons";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { SkyTooltip } from "../utils/Tooltips";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Input, Paper } from "@mui/material";
import { sortStringsByOverlap } from "../utils/SortFunctions";
import { useThemeContext } from "../../ThemeContext";
interface Props {
  dataKeys: string[];
  setDataKeys: React.Dispatch<React.SetStateAction<string[]>>;
  exerciseKeys: string[];
  setExerciseKeys: React.Dispatch<React.SetStateAction<string[]>>;
  diagramType: string;
  setIsSearching: React.Dispatch<React.SetStateAction<boolean>>;
  setDiagramType: React.Dispatch<React.SetStateAction<string>>;
}
function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function SearchStatistics({
  dataKeys,
  setDataKeys,
  exerciseKeys,
  setExerciseKeys,
  diagramType,
  setIsSearching,
  setDiagramType,
}: Props) {
  const [term, setTerm] = React.useState<string>("");
  const { mapKeys } = useContext(MapKeysContext);
  useEffect(() => {
    if (term !== "") {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [term]);

  const debouncedTerm = useDebounce(term, 200);
  console.log(debouncedTerm);
  useEffect(() => {
    if (debouncedTerm !== '') {

      setDataKeys(sortStringsByOverlap(debouncedTerm, dataKeys));
      setExerciseKeys(sortStringsByOverlap(debouncedTerm, exerciseKeys));

    }
  }, [debouncedTerm]);

  const searchHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTerm(e.target.value);
  };
  const { isDarkMode } = useThemeContext();
  return (
    <Paper className="flex flex-col shadow-md">
      <div className="flex items-center justify-between py-2 px-3 mb-1">
        <div className="pr-2">
          <FontAwesomeIcon icon={faMagnifyingGlass} size="lg" />
        </div>
        <Input
          spellCheck={false}
          placeholder={mapKeys("Search for words")}
          value={term}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            searchHandler(e)
          }
          className=" px-1 rounded-sm"
          fullWidth
          sx={{
            "&::before": {
              transform: "scaleX(0)",
              left: "2.5px",
              right: "2.5px",
              bottom: 0,
              top: "unset",
              transition: "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
              borderRadius: 0,
            },
            "&:focus-within::before": {
              transform: "scaleX(1)",
            },
          }}
        />
      </div>
      <div className="flex justify-between py-1.5 px-3">
        <SkyTooltip
          title={mapKeys(
            "Search general statistics like wellbeing or calories"
          )}
        >
          <span>
            <DebthButton
              onClick={() => setDiagramType("general")}
              text={mapKeys("General")}
              active={diagramType === "general"}
              darkMode={isDarkMode}
            />
          </span>
        </SkyTooltip>
        <SkyTooltip
          title={mapKeys(
            "Search exercise statistics like running duration or bench press weight"
          )}
        >
          <span>
            <DebthButton
              onClick={() => setDiagramType("exercises")}
              text={mapKeys("Exercises")}
              active={diagramType === "exercises"}
              darkMode={isDarkMode}
            />
          </span>
        </SkyTooltip>
      </div>
    </Paper>
  );
}

export default SearchStatistics;
