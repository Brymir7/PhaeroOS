// /* eslint-disable react/no-unknown-property */
// import { useRef, useEffect, useState, useContext } from "react";
// import { Canvas, useThree } from "@react-three/fiber";
// import { PCA } from "ml-pca";
// import { Color, Object3D, Object3DEventMap } from "three";
// import { OrbitControls, Select } from "@react-three/drei";
// import { Autocomplete, Chip, Paper, TextField } from "@mui/material";
// import * as math from 'mathjs';
// import {
//   NoteWithEmbedding,
//   EmbeddedNote as EmbeddedNoteType,
//   NoteQuery,
// } from "./notesInterface";
// import EmbeddedNote from "./EmbeddingPlotBall";
// import { MapKeysContext } from "../contexts/MapKeysContext";

// interface Props {
//   notes: NoteWithEmbedding[];
// }
// interface SceneProps extends Props {
//   prevQuery: NoteQuery; 
// }
// interface EmbeddingPlotProps extends Props {
//   prevQueries: NoteQuery[];
// }
// const HSLMAP = {
//   0: 0,
//   1: 2,
//   2: 7,
//   3: 20,
//   4: 25,
//   5: 35,
//   6: 40,
//   7: 95,
//   8: 105,
//   9: 115,
//   10: 120,
// };
// export function cosineSimilarity(a: number[], b: number[]): number {
//   const dotProduct: number = math.dot(a, b) as number;
//   const normA: number = math.norm(a) as number;
//   const normB: number = math.norm(b) as number;
//   return dotProduct / (normA * normB);
// }

// export function scaledCosineSimilarity(a: number[], b: number[]): number {
//   return (cosineSimilarity(a, b) + 1) / 2;
// }
// function adjustPosition(
//   notePos: number[],
//   queryPos: number[],
//   similarity: number,
//   threshold: number
// ): number[] {
//   if (similarity < threshold) return notePos;
//   const movementFactor: number = (similarity - threshold + 0.05); // Adjust this factor to control the extent of movement
//   if (movementFactor <= 0) return notePos;
//   const expMovementFactor = (Math.log1p(movementFactor) * 3);
//   return notePos.map((coord, index) => coord + expMovementFactor * (queryPos[index] - coord));
// }
// const Scene = ({ notes, prevQuery }: SceneProps) => {
//   const [embeddedNotes, setEmbeddedNotes] = useState<EmbeddedNoteType[]>([]);
//   const [embeddedPrevQueries, setEmbeddedPrevQueries] = useState<
//     EmbeddedNoteType[]
//   >([]);
//   const [, setSelectedNote] = useState<Object3D<Object3DEventMap>[] | null>(
//     null
//   );
//   useEffect(() => {
//     if (notes.length === 0) return;
//     const embeddings = notes
//       .map((note) => note.embedding)
//       .filter((e) => e.length);
//     if (embeddings.length === 0) return;
//     const prevQueryEmbedding = prevQuery.embedding;
//     const combinedEmbeddings = [prevQueryEmbedding].concat(embeddings);
//     if (prevQuery.embedding.length === 0) return;
//     const similarities = embeddings.map(embedding => ({
//     similarity: scaledCosineSimilarity(prevQueryEmbedding, embedding),
//     embedding
//     }));
//     const prevQueriesPCA = new PCA(combinedEmbeddings);
//     const combinedEmbeddingsPCA = prevQueriesPCA.predict(
//       combinedEmbeddings,
//       { nComponents: 3 }
//     ).to2DArray() as number[][];
//     const reducedPrevQueriesData = combinedEmbeddingsPCA.slice(
//       0, 1
//     );
//     const reducedNotesData = combinedEmbeddingsPCA.slice(
//       1, 
//     );
//     setEmbeddedNotes(
//       reducedNotesData.map((d: number[], index: number) => ({
//         position: adjustPosition(d, reducedPrevQueriesData[0], similarities[index].similarity, 0.65),
//         color: new Color().setHSL(
//           HSLMAP[notes[index].wellbeingScore as keyof typeof HSLMAP] / 360,
//           1,
//           0.5
//         ).toArray(),
//         size: 0.05,
//         note: notes[index].note,
//         connectionLineTo: similarities[index].similarity > 0.65 ? reducedPrevQueriesData[0] : undefined,
//         similarity: similarities[index].similarity,
//       }))
//     );
//     // Update state with only the PCA-transformed prevQueriesEmbeddings
//     setEmbeddedPrevQueries(
//       reducedPrevQueriesData.map((d: number[]) => ({
//         position: d,
//         color: new Color().setHSL(0, 1, 0.5).toArray(),
//         size: 0.025,
//         note: prevQuery.query,
//       }))
//     );
//   }, [notes, prevQuery]);

//   return (
//     <Canvas>
//       <Select onChange={(selected) => setSelectedNote(selected)}>
//         {embeddedNotes.map((note, index) => (
//           <EmbeddedNote
//             key={index}
//             position={note.position}
//             color={note.color}
//             size={note.size}
//             note={note.note}
//             connectionLineTo={note.connectionLineTo}
//             similarity={note.similarity}
//           />
//         ))}

//         {embeddedPrevQueries.map((note, index) => (
//           <EmbeddedNote
//             key={index}
//             position={note.position}
//             color={note.color}
//             size={note.size}
//             note={note.note}
//             overwriteSelected
//           />
//         ))}
//         <axesHelper args={[5]} />
//         <axesHelper args={[-5]}/>
//         <CameraFollower />
//       </Select>

//     </Canvas>
//   );
// };

// function CameraFollower() {
//   const controls = useRef<any>(null);
//   const { camera, gl } = useThree();
//   // const selected = useSelect();
//   // useEffect(() => {
//   //   if (selected.length > 0 && controls.current) {
//   //     const targetPosition = new Vector3(...selected[0].position);
//   //     controls.current.target.copy(targetPosition);
//   //     camera.lookAt(targetPosition);
//   //     camera.position.lerp(
//   //       targetPosition.clone().add(new Vector3(0, 0, 5)),
//   //       0.1
//   //     );
//   //   } else {
//   //     controls.current?.target.copy(new Vector3(0, 0, 0));
//   //     camera.lookAt(new Vector3(0, 0, 0));

//   //   }
//   // }, [selected, camera]);

//   return <OrbitControls ref={controls} args={[camera, gl.domElement]} />;
// }

// export default function EmbeddingPlot({ notes, prevQueries }: EmbeddingPlotProps) {
//   const [previousQueriesToShow, setPreviousQueriesToShow] = useState<string>(
//     ""
//   );
//   const {mapKeys} = useContext(MapKeysContext);
//   return (
//     <>
//       <Paper style={{ height: "48vh", width: "100%" }}>
//         <Scene
//           notes={notes}
//           prevQuery={prevQueries.find(
//             (query) => query.query === previousQueriesToShow
//           ) || { query: "", embedding: [] }}
//         />
//       </Paper>
//       <Autocomplete 
        
//         value={previousQueriesToShow}
//         onChange={(_, newValue) => {
//           if (newValue === null) {
//             setPreviousQueriesToShow("");
//             return;
//           }
//           setPreviousQueriesToShow(newValue);
//         }}
//         options={prevQueries.map((query) => query.query)}
//         getOptionLabel={(option) => option} // Assuming `prevQueries` is an array of strings
//         renderTags={(value, getTagProps) =>
//           value.map((option, index) => (
//             // eslint-disable-next-line react/jsx-key
//             <Chip
//               variant="outlined"
//               label={option}
//               {...getTagProps({ index })}
//             />
//           ))
//         }
//         style={{ width: 300, margin: "auto", marginTop: "15px" }} // Adjust the style as needed
//         renderInput={(params) => (
//           <TextField {...params} label={mapKeys("Select query")} variant="outlined" />
//         )}
//       />
//     </>
//   );
// }
