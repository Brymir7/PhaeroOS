// Importing necessary libraries and components
import React, { useContext, useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { MapKeysContext } from "../contexts/MapKeysContext";

// TypeScript interface for props
interface SearchHeadlinesProps {
  headlines: string[]; // Updated to accept headlines directly
  getNotesBySearchTerm: (term: string) => void;
  overwriteSearchTerm?: string;
}

// The component
const SearchHeadlines: React.FC<SearchHeadlinesProps> = ({
  headlines,
  getNotesBySearchTerm,
  overwriteSearchTerm,
}) => {
  const [searchTerm, setSearchTerm] = useState<string | null>(null);
  useEffect(() => {
    if (searchTerm === null) {
      getNotesBySearchTerm("");
      return;
    }
    getNotesBySearchTerm(searchTerm);
  }, [searchTerm]);
  const { mapKeys } = useContext(MapKeysContext);
  console.log(overwriteSearchTerm);
  return (
    <div className="flex items-center  w-full space-x-2">
      <Autocomplete
        fullWidth
        options={headlines}
        value={overwriteSearchTerm !== undefined && overwriteSearchTerm === "" ? overwriteSearchTerm : searchTerm}
        onChange={(_, newValue) => {
          setSearchTerm(newValue);
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={mapKeys("Search by headline")}
            variant="outlined"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <FontAwesomeIcon
                  icon={faSearch}
                  className="text-gray-400 mr-3"
                />
              ),
            }}
          />
        )}
      />
    </div>
  );
};

export default SearchHeadlines;
