import React, { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  Input,
  Paper,
  Grid,
  // SelectChangeEvent,
  useTheme,
  // useMediaQuery,
  Typography,
  Button,
} from "@mui/material";
import SearchHeadlines from "./HeadlineSearch";
import { FilterOptions, SortOrder } from "./RegularSearch";
import { EmojiHappy, EmojiSad, Note } from "iconsax-react";

interface SearchBarProps {
  getNotesBySearchTerm: (term: string) => void;
  lastDays: number;
  setLastDays: React.Dispatch<React.SetStateAction<number>>;
  sortByWellbeing: string;
  setSortByWellbeing: React.Dispatch<React.SetStateAction<string>>;
  headlines: string[];
  sortByDate: (sortOrder: SortOrder, filterOptions: FilterOptions) => void;
  totalNotes: number;
}

function SearchBar({
  getNotesBySearchTerm,
  // lastDays,
  // setLastDays,
  sortByWellbeing,
  setSortByWellbeing,
  headlines,
  sortByDate,
  totalNotes,
}: SearchBarProps) {
  const [term, setTerm] = React.useState<string>("");
  const { mapKeys } = useContext(MapKeysContext);

  const getIcon = () => {
    if (sortByWellbeing === "best") {
      return <EmojiHappy color={theme.palette.primary.veryhappy} />;
    } else if (sortByWellbeing === "worst") {
      return <EmojiSad color={theme.palette.primary.verysad} />;
    } else {
      return <EmojiHappy color={theme.palette.text.primary} />;
    }
  };

  const handleClick = () => {
    if (sortByWellbeing === "") {
      setSortByWellbeing("best");
    } else if (sortByWellbeing === "best") {
      setSortByWellbeing("worst");
    } else {
      setSortByWellbeing("");
    }
    setTerm("");
  };
  const [overwriteSearchTerm, setOverwriteSearchTerm] = React.useState<
    string | undefined
  >();
  const [sortOrder,] = useState<SortOrder>("desc");
  const [filterMonth,] = useState<number | undefined>();
  const [filterYear] = useState<number | undefined>();

  const handleSortAndFilter = () => {
    const filterOptions: FilterOptions = {
      month: filterMonth,
      year: filterYear,
    };
    sortByDate(sortOrder, filterOptions);
  };
  useEffect(() => {
    handleSortAndFilter();
  }, [sortOrder, filterMonth, filterYear]);
  // const handleChangeSortOrder = (event: SelectChangeEvent<"asc" | "desc">) => {
  //   setSortOrder(event.target.value as SortOrder);
  // };
  // const months = [
  //   { label: mapKeys("January"), value: 1 },
  //   { label: mapKeys("February"), value: 2 },
  //   { label: mapKeys("March"), value: 3 },
  //   { label: mapKeys("April"), value: 4 },
  //   { label: mapKeys("May"), value: 5 },
  //   { label: mapKeys("June"), value: 6 },
  //   { label: mapKeys("July"), value: 7 },
  //   { label: mapKeys("August"), value: 8 },
  //   { label: mapKeys("September"), value: 9 },
  //   { label: mapKeys("October"), value: 10 },
  //   { label: mapKeys("November"), value: 11 },
  //   { label: mapKeys("December"), value: 12 },
  // ];
  // const handleMonthChange = (
  //   _event: any,
  //   newValue: { label: string; value: number } | null
  // ) => {
  //   setFilterMonth(newValue ? newValue.value : undefined);
  // };
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <Paper className="flex flex-col items-center justify-between relative pt-2 pb-10 px-1 mb-1 gap-2 w-full">
        <Typography
          variant="h6"
          className="flex align-middle items-center gap-2"
        >
          <Note
            size={theme.iconSize.large}
            color={theme.palette.primary.main}
          />
          {mapKeys("Your Notes")}
        </Typography>
        <Typography variant="h6" className="absolute bottom-2 left-4">
          {totalNotes + " " + mapKeys("Notes")}
        </Typography>

        <Grid container spacing={5}>
          <Grid item xs={0.5} sx={{ display: "flex", alignItems: "center", mx: "auto" }}>

            <Paper
              style={{
                borderRadius: 999,
                aspectRatio: "1/1",
                width: "60px",
                height: "60px",
              }}
              className="flex justify-between"
            >
              <Button onClick={handleClick}>{getIcon()}</Button>
            </Paper>
          </Grid>
          <Grid
            item
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
            xs={9}
          >
            <div className="flex max-w-[65%] items-center  rounded-md px-3 py-2 ">
              <Input
                spellCheck={false}
                placeholder={mapKeys("Search for words")}
                value={term}
                onChange={(e) => {
                  setTerm(e.target.value);
                  getNotesBySearchTerm(e.target.value);
                  setOverwriteSearchTerm("");
                }}
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
            <div className="max-w-[65%]">
              <SearchHeadlines
                headlines={headlines}
                getNotesBySearchTerm={(term) => {
                  getNotesBySearchTerm(term);
                  setOverwriteSearchTerm(undefined);
                  setTerm("");
                }}
                overwriteSearchTerm={overwriteSearchTerm}
              /></div>
          </Grid>
          {/* <Grid item xs={2} sx={{ display: "flex", alignItems: "center" }}> */}
          {/* <div className="flex flex-col">
              <div className="items-center justify-around">
                <FormControl
                  color="primary"
                  sx={{ m: 1, width: 120 }}
                  size="small"
                >
                  <InputLabel id="demo-select-small-label">
                    {mapKeys("Timeframe")}
                  </InputLabel>
                  <Select
                    size="small"
                    sx={{ width: 120 }}
                    labelId="demo-select-small-label"
                    id="demo-select-small"
                    value={lastDays}
                    label="Nutrients"
                    onChange={(e) => {
                      setLastDays(Number(e.target.value));
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          width: 120, // Ensure dropdown width matches the Select field width
                        },
                      },
                    }}
                  >
                    <MenuItem value={7}>{7 + " " + mapKeys("Days")}</MenuItem>
                    <MenuItem value={30}>{30 + " " + mapKeys("Days")}</MenuItem>
                    <MenuItem value={90}>{90 + " " + mapKeys("Days")}</MenuItem>
                    <MenuItem value={365}>
                      {365 + " " + mapKeys("Days")}
                    </MenuItem>
                  </Select>
                </FormControl>
              </div>
              <FormControl
                variant="outlined"
                size="small"
                sx={{ m: 1, minWidth: !isMobile ? 160 : 0, maxWidth: isMobile? 120 : ""}}
              >
                <InputLabel htmlFor="sort-order-select">
                  {mapKeys("Sort by Date")}
                </InputLabel>
                <Select
                  value={sortOrder}
                  onChange={(event: SelectChangeEvent<"asc" | "desc">) =>
                    handleChangeSortOrder(event)
                  }
                  label="Sort Order"
                  inputProps={{
                    name: "sortOrder",
                    id: "sort-order-select",
                  }}
                >
                  <MenuItem value={"asc"}>{mapKeys("Oldest first")}</MenuItem>
                  <MenuItem value={"desc"}>{mapKeys("Newest first")}</MenuItem>
                </Select>
              </FormControl>
              <Autocomplete
                options={months}
                sx={{ m: 1, minWidth: !isMobile ? 160 : 0,  maxWidth: isMobile ? 120 : "" }}
                value={
                  months.find((month) => month.value === filterMonth) || null
                }
                onChange={handleMonthChange}
                getOptionLabel={(option) => option.label}
                renderInput={(params) => (
                  <TextField {...params} label={mapKeys("Filter by Month")} />
                )}
              />
            </div> */}
          {/* </Grid> */}
        </Grid>
      </Paper>
    </>
  );
}

export default SearchBar;
