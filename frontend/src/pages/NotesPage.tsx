import { useState, useEffect, useContext, useRef } from "react";
import { useApi } from "../modules/apiAxios";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import {
  NoteQuery,
  NoteWithEmbedding,
} from "../components/notesPage/notesInterface";
import { RegularSearch } from "../components/notesPage/RegularSearch";
import { EntryData } from "./EditEntryPage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import EditEntry from "../components/editEntryPage/EditEntry";
import { useParams } from "react-router";
import { CircularProgress } from "@mui/material";
import dayjs from "dayjs";
function NotesPage() {
  const api = useApi();
  const [notes, setNotes] = useState<NoteWithEmbedding[]>([]);
  const [, setSimilarityNotes] = useState<NoteWithEmbedding[]>([]);
  const { view } = useParams();
  const parseView = (view: string | undefined) => {
    if (view != undefined) {
      return view.split(",").map((id) => parseInt(id));
    }
    return [];
  };
  const openedNoteIds = parseView(view);
  // const [showSimilarityPage, setShowSimilarityPage] = useState<boolean>(false);
  const [, setCanEmbed] = useState<boolean>(false);
  const [headlines, setHeadlines] = useState<string[]>([]);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [lastDays, setLastDays] = useState<number>(365);
  const [, setPrevQueries] = useState<NoteQuery[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const getEmbedAllowance = async () => {
    const apiEndpoint = `/diagrams/notes/vector-search/query/`;
    api
      .get(apiEndpoint)
      .then((response: any) => {
        setCanEmbed(response.data.canEmbed);
      })
      .catch((error: any) => {
        handleAllErrors(error);
      });
  };
  const getNotes = async () => {
    const apiEndpoint = `/diagrams/notes/get`;
    api
      .post(apiEndpoint, { last_x_days: lastDays })
      .then((response: any) => {
        const notesArray: NoteWithEmbedding[] = Object.values(
          response.data.notes
        ).reverse() as NoteWithEmbedding[];
        setNotes(notesArray);
        setSimilarityNotes(notesArray);
        setHeadlines(response.data.headlines);
      })
      .catch((error: any) => {
        handleAllErrors(error);
      });
  };
  const getPrevQueries = async () => {
    const apiEndpoint = `/diagrams/notes/vector-search/queries/`;
    api
      .get(apiEndpoint)
      .then((response: any) => {
        setPrevQueries(response.data.queries);
      })
      .catch((error: any) => {
        handleAllErrors(error);
      });
  };
  const [isOpen, setIsOpen] = useState(false);
  const [entryData, setEntryData] = useState<EntryData>();
  const [images, setImages] = useState<string[]>([]);
  const dateOfCurrentEntryData = useRef<string | null>(null);
  const getDetailedNote = async (recorded_at: string) => {
    const apiEndpoint = `/phaero_note/get/`;
    api
      .get(apiEndpoint, { params: { specific_date: recorded_at } })
      .then((response) => {
        setEntryData(response.data.result);
        dateOfCurrentEntryData.current = recorded_at;
        // TODO add type verification here otherwise return default and handleAllErrors
        setImages(
          response.data.images.map(
            (img: string) => `data:image/jpeg;base64,${img}`
          )
        );
        setIsOpen(true);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  useEffect(() => {
    setIsLoading(true);
    getNotes();
    getPrevQueries();
    getEmbedAllowance();
    setIsLoading(false);
  }, [lastDays]);

  // const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <div className="flex justify-center">
      {isOpen && entryData ? (
        <div>
          <div
            className="absolute right-2 top-4 z-20 w-12 h-12 text-2xl cursor-pointer "
            onClick={() => setIsOpen(false)}
          >
            <FontAwesomeIcon size="xl" icon={faXmark} />
          </div>
          <div className={` mx-auto flex justify-center`}>
            <EditEntry
              entryData={entryData}
              setEntryData={setEntryData}
              viewOnly={true}
              images={images}
              dateOfEntry={dayjs(dateOfCurrentEntryData.current)}
            />
          </div>
        </div>
      ) : (
        <>
          {/* {showSimilarityPage ? (
            <Grid
              container
              spacing={isMobile ? 0 : 2}
              sx={{ padding: isMobile ? 0 : 2 }}
            >
              {isMobile ? (
                <SimilaritySearch
                  {...{
                    getNotesBySimilarityToQuery,
                    getNotesBySimilarityToNote,
                    notes: similarityNotes,
                    lastDays,
                    setLastDays,
                    canEmbed,
                    switchToRegularSearch: () => setShowSimilarityPage(false),
                    prevQueries,
                    showDetailedNote: getDetailedNote,
                    mobileView: true,
                  }}
                />
              ) : (
                <>
                  <Grid item xs={12} md={1}></Grid>
                  <Grid item xs={12} md={5}>
                    <SimilaritySearch
                      {...{
                        getNotesBySimilarityToQuery,
                        getNotesBySimilarityToNote,
                        notes: similarityNotes,
                        lastDays,
                        setLastDays,
                        canEmbed,
                        switchToRegularSearch: () =>
                          setShowSimilarityPage(false),
                        prevQueries,
                        showDetailedNote: getDetailedNote,
                        mobileView: false,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6} sx={{ marginTop: 4 }}>
                    <EmbeddingPlot notes={notes} prevQueries={prevQueries} />
                  </Grid>
                </>
              )}
            </Grid>
          ) : ( */}
          {!isLoading ? (
            <RegularSearch
              notes={notes.sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )}
              headlines={headlines}
              setLastDays={setLastDays}
              lastDays={lastDays}
              switchToSemanticSearch={() => { }}
              showDetailedNote={getDetailedNote}
              openedNoteIds={openedNoteIds}
            />
          ) : (
            <CircularProgress />
          )}
          {/* )} */}
        </>
      )}
    </div>
  );
}

export default NotesPage;
