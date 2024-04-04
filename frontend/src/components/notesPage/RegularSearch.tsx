import { AnimatePresence, motion } from "framer-motion";
import MarkdownDisplay from "../utils/MarkdownDisplay/MarkdownDisplay";
import { faCaretDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Paper, Chip, Grid, useTheme } from "@mui/material";

import { SkyTooltip } from "../utils/Tooltips";
import TutorialStep from "../utils/TutorialStep";
import Searchbar from "./Searchbar";
import { useContext, useEffect, useState } from "react";
import { Note, NoteWithEmbedding } from "./notesInterface";
import NotesIcon from "../../assets/notes.svg";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { Add, EmojiHappy, EmojiNormal, EmojiSad, Moon } from "iconsax-react";

interface RegularSearchProps {
  notes: NoteWithEmbedding[];
  headlines: string[];
  setLastDays: React.Dispatch<React.SetStateAction<number>>;
  switchToSemanticSearch: () => void;
  lastDays: number;
  showDetailedNote: (recorded_at: string) => void;
  bigScreenView?: boolean;
  openedNoteIds: number[];
}
export type SortOrder = "asc" | "desc";

export type FilterOptions = {
  month?: number; // month as 1-12
  year?: number;
};
export const RegularSearch = ({
  notes,
  headlines,
  setLastDays,
  lastDays,
  showDetailedNote,
  openedNoteIds,
}: RegularSearchProps) => {
  const theme = useTheme();
  const [sortedNotes, setSortedNotes] = useState<Note[]>([]);
  const [openedNoteDate, setOpenedNoteDate] = useState<string>("");
  const api = useApi();
  const [images, setImages] = useState<string[]>([]);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [imagesLoaded, setImagesLoaded] = useState<boolean>(false);

  useEffect(() => {
    const getDetailedNote = async (recorded_at: string) => {
      const apiEndpoint = `/phaero_note/get/`;
      api
        .get(apiEndpoint, { params: { specific_date: recorded_at } })
        .then((response) => {
          setImages(
            response.data.images.map(
              (img: string) => `data:image/jpeg;base64,${img}`
            )
          );
          setImagesLoaded(true);
        })
        .catch((error) => {
          handleAllErrors(error);
        });
    };
    if (openedNoteDate !== "") {
      getDetailedNote(openedNoteDate);
      setSortedNotes(notes.filter((note) => note.date === openedNoteDate));
    } else {
      setImages([]);
      setImagesLoaded(false);
      setSortedNotes(notes);
    }
  }, [openedNoteDate]);

  useEffect(() => {
    if (openedNoteIds.length > 0) {
      const openedNote = sortedNotes.filter((n) => n.id === openedNoteIds[0]);
      if (openedNote.length > 0) {
        setOpenedNoteDate(openedNote[0].date);
      }
    }
  }, [openedNoteIds, sortedNotes]);
  const [sortByWellbeing, setSortByWellbeing] = useState<string>("");
  const { mapKeys, language } = useContext(MapKeysContext);
  function formatUTCDateToLocaleString(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const locale = language === "german" ? "de-DE" : "en-US";
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  function tokenize(text: string): Set<string> {
    return new Set(text.toLowerCase().split(/\s+/));
  }

  function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  function sortObjectsByNoteSimilarity(searchTerm: string): Note[] {
    const searchTermTokens = tokenize(searchTerm);
    return [...notes].sort((a, b) => {
      const firstAppearanceA = a.note.indexOf(searchTerm);
      const firstAppearanceB = b.note.indexOf(searchTerm);

      if (firstAppearanceA !== firstAppearanceB) {
        // Sort by the index of the first appearance of the search term
        return firstAppearanceB - firstAppearanceA;
      } else {
        // If the first appearance is the same, sort by similarity
        const simA = jaccardSimilarity(searchTermTokens, tokenize(a.note));
        const simB = jaccardSimilarity(searchTermTokens, tokenize(b.note));
        return simB - simA; // Sort by similarity, descending order
      }
    });
  }

  const getNotesBySearchTerm = (searchTerm: string) => {
    if (searchTerm === "") {
      setSortedNotes(notes);
      return;
    }
    setSortByWellbeing("");
    const sortedNotes = sortObjectsByNoteSimilarity(searchTerm);
    setSortedNotes(sortedNotes);
    setHighlightedText(searchTerm.replace(/#/g, ""));
    setOpenedNoteDate(sortedNotes.length > 0 ? sortedNotes[0].date : "");
  };
  const [highlightedText, setHighlightedText] = useState<string>("");
  const sortByDate = (sortOrder: SortOrder, filterOptions: FilterOptions) => {
    const filteredNotes = notes.filter((note) => {
      const noteDate = new Date(note.date);
      const matchesMonth = filterOptions.month
        ? noteDate.getMonth() + 1 === filterOptions.month
        : true;
      const matchesYear = filterOptions.year
        ? noteDate.getFullYear() === filterOptions.year
        : true;
      return matchesMonth && matchesYear;
    });
    filteredNotes.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (sortOrder === "asc") {
        return dateA.getTime() - dateB.getTime();
      } else {
        return dateB.getTime() - dateA.getTime();
      }
    });
    setSortedNotes(filteredNotes);
  };

  useEffect(() => {
    if (sortByWellbeing === "best") {
      setSortedNotes(
        [...notes].sort((a, b) => b.wellbeingScore - a.wellbeingScore)
      );
    } else if (sortByWellbeing === "worst") {
      setSortedNotes(
        [...notes].sort((a, b) => a.wellbeingScore - b.wellbeingScore)
      );
    } else {
      setSortedNotes([...notes]);
    }
  }, [sortByWellbeing, notes]);

  const smileys = [
    <EmojiSad key={0} color={theme.palette.primary.verysad} />,
    <EmojiSad key={1} color={theme.palette.primary.sad} />,
    <EmojiNormal key={2} color={theme.palette.primary.medium} />,
    <EmojiHappy key={3} color={theme.palette.primary.happy} />,
    <EmojiHappy key={4} color={theme.palette.primary.veryhappy} />,
  ];

  const getSmileyFromScore = (score: number): JSX.Element => {
    let smiley: JSX.Element;
    if (score < 3) {
      smiley = smileys[0];
    } else if (score < 5) {
      smiley = smileys[1];
    } else if (score < 7) {
      smiley = smileys[2];
    } else if (score < 9) {
      smiley = smileys[3];
    } else {
      smiley = smileys[4];
    }
    return (
      <div className="flex items-center justify-center w-8 h-8">{smiley}</div>
    );
  };

  const getFillColor = (score: number) => {
    if (score < 3) {
      return theme.palette.primary.verysad;
    } else if (score < 5) {
      return theme.palette.primary.sad;
    } else if (score < 7) {
      return theme.palette.primary.medium;
    } else if (score < 9) {
      return theme.palette.primary.happy;
    } else {
      return theme.palette.primary.veryhappy;
    }
  };
  return (
    <Paper elevation={3} className="flex relative items-center max-w-[1200px]">
      <div className="flex flex-col  mx-auto  space-y-2">
        {/* {!bigScreenView && (
          <Button variant="contained" onClick={switchToSemanticSearch}>
            {mapKeys("Switch to Semantic Search")}
          </Button>
        )} */}
        <TutorialStep step={5}>
          <Searchbar
            lastDays={lastDays}
            setLastDays={setLastDays}
            getNotesBySearchTerm={getNotesBySearchTerm}
            sortByWellbeing={sortByWellbeing}
            setSortByWellbeing={setSortByWellbeing}
            headlines={headlines}
            sortByDate={sortByDate}
            totalNotes={notes.length}
          />
        </TutorialStep>
        <motion.ul className="flex-col flex w-full " layout>
          <>
            {notes.length === 0 ? (
              <Paper className="flex items-center justify-center w-full  rounded-md px-4">
                <div className="flex flex-col items-center space-y-2">
                  <img className="" src={NotesIcon} alt="notes" />
                  <p className="text-lg">{mapKeys("No notes found")}</p>
                  <p className="text-center text-gray-700">
                    {mapKeys("Find your notes here after processing them")}
                  </p>
                </div>
              </Paper>
            ) : (
              <Grid
                container
                spacing={1}
                sx={{
                  overflowY: "auto",
                  maxHeight: "80vh",
                  paddingBottom: "200px",
                }}
              >
                {sortedNotes.map((note, index) => (
                  <Grid
                    key={index}
                    item
                    xs={12}
                    md={
                      sortedNotes.length > 7 && openedNoteDate === "" ? 6 : 12
                    }
                  >
                    <div key={note.date}>
                      <motion.li
                        layout
                        transition={{
                          layout: { duration: 0.5, type: "ease" },
                        }}
                        className="bg-transparent cursor-pointer"
                        onClick={() => {
                          if (openedNoteDate === note.date) {
                            setOpenedNoteDate("");
                          } else {
                            setOpenedNoteDate(note.date);
                          }
                        }}
                      >
                        <Paper>
                          <div className="flex w-full justify-between items-center">
                            <div className="flex pl-4 h-full space-x-2 items-center">
                              <div>
                                <FontAwesomeIcon
                                  icon={faCaretDown}
                                  size="xl"
                                  className={`duration-300 ${openedNoteDate === note.date
                                    ? ""
                                    : "rotate-90"
                                    } `}
                                />
                              </div>
                              <span className="px-1">
                                {getSmileyFromScore(note.wellbeingScore)}
                              </span>
                              <span className="w-8 h-8 flex flex-shrink-0 justify-center align-middle items-center">
                                <Moon color={getFillColor(note.sleepQuality)} />
                              </span>
                              <h3 className="text-xl font-medium w-full pl-1">
                                {formatUTCDateToLocaleString(note.date)}
                              </h3>
                            </div>
                            <SkyTooltip
                              title={mapKeys("Details")}
                              enterDelay={500}
                              disableInteractive
                            >
                              <div
                                className="w-fit cursor-pointer pl-2 pr-4 h-full py-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showDetailedNote(note.date);
                                }}
                              >
                                <Add
                                  size={theme.iconSize.medium}
                                  color={theme.palette.primary.main}
                                />
                              </div>
                            </SkyTooltip>
                          </div>
                          <AnimatePresence>
                            {openedNoteDate === note.date && imagesLoaded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
                                className="px-4 overflow-hidden text-base"
                              >
                                {note.tags.length > 0 && (
                                  <div className="my-2 flex flex-wrap gap-2 max-w-[300px]">
                                    {note.tags.map((tag) => (
                                      <Chip
                                        key={tag}
                                        variant={"outlined"}
                                        sx={{
                                          border: "2px solid #ff0000",
                                        }}
                                        label={tag}
                                      />
                                    ))}
                                  </div>
                                )}
                                <MarkdownDisplay
                                  text={note.note}
                                  images={images}
                                  highlightedText={highlightedText}
                                />
                                <p className="h-4"></p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Paper>
                      </motion.li>
                    </div>
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        </motion.ul>
      </div>
    </Paper>
  );
};
