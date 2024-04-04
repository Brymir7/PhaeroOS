// // Importing necessary libraries and components
// import React, { useContext, useState } from "react";
// import {
//   Autocomplete,
//   TextField,
//   Button,
//   Paper,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   FormControl,
//   InputLabel,
//   Select,
//   MenuItem,
//   ToggleButtonGroup,
//   ToggleButton,
// } from "@mui/material";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import {
//   faAngleDown,
//   faAngleUp,
//   faPlus,
//   faSearch,
// } from "@fortawesome/free-solid-svg-icons";
// import { NoteQuery, NoteWithEmbedding } from "./notesInterface";
// import EmbeddingPlot, { scaledCosineSimilarity } from "./EmbeddingPlot";
// import { MapKeysContext } from "../contexts/MapKeysContext";

// interface SimilaritySearchProps {
//   getNotesBySimilarityToQuery: (query: string) => Promise<void>;
//   getNotesBySimilarityToNote: (note: string) => Promise<void>;
//   notes: NoteWithEmbedding[]; // Assume Note type is imported from elsewhere
//   setLastDays: React.Dispatch<React.SetStateAction<number>>;
//   lastDays: number;
//   switchToRegularSearch: () => void;
//   canEmbed: boolean;
//   prevQueries: NoteQuery[];
//   showDetailedNote: (recorded_at: string) => void;
//   mobileView: boolean;
//   bigScreenView?: boolean;
// }

// // The component
// const SimilaritySearch: React.FC<SimilaritySearchProps> = ({
//   getNotesBySimilarityToQuery,
//   lastDays,
//   setLastDays,
//   switchToRegularSearch,
//   getNotesBySimilarityToNote,
//   canEmbed,
//   notes,
//   prevQueries,
//   showDetailedNote,
//   mobileView,
//   bigScreenView,
// }) => {
//   const [inputValue, setInputValue] = useState<string>("");
//   const [selectedNote, setSelectedNote] = useState<NoteWithEmbedding | null>(
//     null
//   );
//   // Handler for searching by custom text input
//   const handleTextSearch = async () => {
//     if (inputValue.trim()) {
//       await getNotesBySimilarityToQuery(inputValue);
//       setInputValue(""); // Reset input field after search
//     }
//   };

//   // Handler for searching by selecting a note from the list
//   const handleNoteSearch = async () => {
//     if (selectedNote) {
//       await getNotesBySimilarityToNote(selectedNote.note);
//       setSelectedNote(null); // Reset selection after search
//     }
//   };

//   const [expandedNote, setExpandedNote] = useState<string | null>(null);

//   const toggleNoteDisplay = (note: string) => {
//     if (expandedNote === note) {
//       setExpandedNote(null); // Collapse note if it's already expanded
//     } else {
//       setExpandedNote(note); // Expand the clicked note
//     }
//   };
//   const getSimScore = (note: NoteWithEmbedding) => {
//     if (typeof prevQuery === "string") {
//       const prev = prevQueries.find((prev) => prev.query === prevQuery);
//       if (prev) {
//         return scaledCosineSimilarity(prev.embedding, note.embedding) || 0;
//       } else {
//         return 0;
//       }
//     }
//     if (typeof prevQuery === "object" && prevQuery !== null) {
//       return scaledCosineSimilarity(prevQuery.embedding, note.embedding) || 0;
//     }
//     return 0;
//   };
//   const { mapKeys } = useContext(MapKeysContext);
//   const [prevQuery, setPrevQuery] = useState<NoteWithEmbedding | string>("");
//   const [showEmbeddingPlot, setShowEmbeddingPlot] = useState<boolean>(false);
//   return (
//     <div className="flex flex-col w-full h-full mx-auto max-w-xl xl:max-w-2xl mt-5">
//       {!bigScreenView && (
//         <Button
//           sx={{ mb: 2 }}
//           variant="contained"
//           color="primary"
//           onClick={switchToRegularSearch}
//         >
//           {mapKeys("Switch to Regular Search")}
//         </Button>
//       )}
//       {mobileView && (
//         <ToggleButtonGroup
//           value={showEmbeddingPlot}
//           exclusive
//           onChange={() => setShowEmbeddingPlot(!showEmbeddingPlot)}
//           size="small"
//           style={{
//             marginLeft: "auto",
//             marginRight: "auto",
//             marginTop: "0.5rem",
//             marginBottom: "0.5rem",
//           }}
//         >
//           <ToggleButton value={false} aria-label="Search" className="">
//             <Typography>{mapKeys("Search")}</Typography>
//           </ToggleButton>
//           <ToggleButton value={true} aria-label="Visualize">
//             <Typography>{mapKeys("Visualize")}</Typography>
//           </ToggleButton>
//         </ToggleButtonGroup>
//       )}
//       {!bigScreenView && (
//         <div className="flex items-center justify-center">
//           <FormControl color="primary" sx={{ m: 1, width: 120 }} size="small">
//             <InputLabel id="demo-select-small-label">
//               {mapKeys("Timeframe")}
//             </InputLabel>
//             <Select
//               size="small"
//               sx={{ width: 120 }}
//               labelId="demo-select-small-label"
//               id="demo-select-small"
//               value={lastDays}
//               label="Timespan"
//               onChange={(e) => {
//                 setLastDays(Number(e.target.value));
//               }}
//               MenuProps={{
//                 PaperProps: {
//                   style: {
//                     width: 120, // Ensure dropdown width matches the Select field width
//                   },
//                 },
//               }}
//             >
//               <MenuItem value={7}>{7 + " " + mapKeys("Days")}</MenuItem>
//               <MenuItem value={30}>{30 + " " + mapKeys("Days")}</MenuItem>
//               <MenuItem value={90}>{90 + " " + mapKeys("Days")}</MenuItem>
//               <MenuItem value={365}>{365 + " " + mapKeys("Days")}</MenuItem>
//             </Select>
//           </FormControl>
//         </div>
//       )}
//       {!showEmbeddingPlot ? (
//         <>
//           <div className="flex flex-col space-y-4 overflow-y-auto max-h-[95%]">
//             <div className="flex items-center space-x-2 mt-5">
//               <Autocomplete
//                 fullWidth
//                 options={notes}
//                 getOptionLabel={(option) =>
//                   option.note.substring(0, 50) ||
//                   "Something is weird with this one"
//                 }
//                 value={selectedNote}
//                 onChange={(_, newValue) => setSelectedNote(newValue)}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label={mapKeys("Select a note for similarity search")}
//                     variant="outlined"
//                   />
//                 )}
//               />
//               <Button
//                 variant="contained"
//                 color="primary"
//                 onClick={() => {
//                   handleNoteSearch();
//                   setPrevQuery(selectedNote || notes[0]);
//                 }}
//               >
//                 {mapKeys("Search by Note")}
//               </Button>
//             </div>
//             <div className="flex items-center space-x-2">
//               <TextField
//                 fullWidth
//                 value={inputValue}
//                 onChange={(e) => setInputValue(e.target.value)}
//                 label={mapKeys("Or enter text for similarity search")}
//                 variant="outlined"
//                 disabled={!canEmbed}
//                 InputProps={{
//                   startAdornment: (
//                     <FontAwesomeIcon
//                       icon={faSearch}
//                       className="text-gray-400 mr-3"
//                     />
//                   ),
//                 }}
//               />
//               <Button
//                 variant={!canEmbed ? "outlined" : "contained"}
//                 disabled={!canEmbed}
//                 color="primary"
//                 onClick={() => {
//                   handleTextSearch();
//                   setPrevQuery(inputValue);
//                 }}
//               >
//                 {mapKeys("Search by Text")}
//               </Button>
//             </div>
//             {notes.length > 0 && (
//               <TableContainer component={Paper} className="max-h-[45vh] overflow-y-auto pb-32">
//                 <Table stickyHeader>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>{mapKeys("Note")}</TableCell>
//                       <TableCell align="right">
//                         {!expandedNote ? (
//                           mapKeys("Similarity Score")
//                         ) : (
//                           <Button
//                             variant="outlined"
//                             color="primary"
//                             onClick={() => setExpandedNote(null)}
//                           >
//                             {mapKeys("Close")}
//                           </Button>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   </TableHead>
//                   {!expandedNote ? (
//                     <TableBody >
//                       {notes.map((note) => (
//                         <TableRow
//                           key={note.note}
//                           onClick={() => toggleNoteDisplay(note.note)}
//                           className="cursor-pointer "
//                         >
//                           <TableCell component="th" scope="row">
//                             {expandedNote === note.note
//                               ? note.note
//                               : `${note.note.substring(0, 50)}...`}
//                             <FontAwesomeIcon
//                               icon={
//                                 expandedNote === note.note
//                                   ? faAngleUp
//                                   : faAngleDown
//                               }
//                               className="ml-2"
//                             />
//                           </TableCell>
//                           <TableCell align="right">
//                             {getSimScore(note).toFixed(2)}
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                     </TableBody>
//                   ) : (
//                     <TableBody>
//                       <TableRow
//                         key={expandedNote}
//                         onClick={() => toggleNoteDisplay(expandedNote)}
//                         className="cursor-pointer"
//                       >
//                         <TableCell component="th" scope="row">
//                           <Typography>
//                             {" "}
//                             {expandedNote.substring(0, 50)}{" "}
//                           </Typography>
//                         </TableCell>
//                         <TableCell
//                           sx={{ display: "flex", justifyContent: "center" }}
//                         >
//                           <div
//                             className="w-fit cursor-pointer pl-2 pr-4 h-full py-3"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               showDetailedNote(
//                                 notes.find((note) => note.note === expandedNote)
//                                   ?.date || ""
//                               );
//                             }}
//                           >
//                             <FontAwesomeIcon size="xl" icon={faPlus} />
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     </TableBody>
//                   )}
//                 </Table>
//               </TableContainer>
//             )}
//           </div>
//         </>
//       ) : (
//           <EmbeddingPlot notes={notes} prevQueries={prevQueries} />
//       )}
//     </div>
//   );
// };

// export default SimilaritySearch;
