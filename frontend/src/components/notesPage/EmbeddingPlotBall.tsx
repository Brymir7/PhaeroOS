// /* eslint-disable react/no-unknown-property */
// import { useRef } from "react";
// import { BufferGeometry, Color, Vector3 } from "three";
// import { Html, useSelect } from "@react-three/drei";
// import { Button, Paper, Typography } from "@mui/material";
// import { ReactThreeFiber, extend } from '@react-three/fiber'
// import { Line } from "three";
// interface EmbeddedNoteProps {
//   position: number[];
//   color: number[];
//   size: number;
//   note: string;
//   overwriteSelected?: boolean;
//   connectionLineTo?: number[];
//   similarity?: number;
// }


// extend({ Line_: Line })

// declare global {
//   // eslint-disable-next-line @typescript-eslint/no-namespace
//   namespace JSX {
//     interface IntrinsicElements {
//       line_: ReactThreeFiber.Object3DNode<Line, typeof Line>
//     }
//   }
// }
// const EmbeddedNote = ({
//   position,
//   color,
//   size,
//   note,
//   overwriteSelected,
//   connectionLineTo,
//   similarity,
// }: EmbeddedNoteProps) => {
//   const meshRef = useRef<any>(null);
//   const lineRef = useRef<any>(null);
//   const sel = useSelect();
//   let selected = false;
//   if (sel.length > 0 && meshRef.current) {
//     selected = sel[0].position === meshRef.current.position;
//   } else {
//     selected = false;
//   }
//   const lineGeometry = connectionLineTo
//     ? new BufferGeometry().setFromPoints([
//         new Vector3(...position),
//         new Vector3(...connectionLineTo),
//       ])
//     : undefined;
//   const lineMidpoint = connectionLineTo
//     ? connectionLineTo.map((v, i) => (v + position[i]) / 2)
//     : undefined;
//   console.log(connectionLineTo);
//   return (
//     <>
//       <mesh ref={meshRef} position={new Vector3(...position)} scale={size}>
//         <sphereGeometry />
//         <meshBasicMaterial
//           color={selected ? "#42b6f5" : overwriteSelected ? "#42b6f5" : color as unknown as Color}
//         />
//         {(selected || overwriteSelected) && (
//           <Html>
//             <Paper
//               sx={{
//                 minWidth: overwriteSelected ? "fit-content" : 200,
//                 minHeight: overwriteSelected ? 0 : 150,
//                 padding: 0,
//                 backgroundColor: "#fff",
//                 borderRadius: 2,
//                 boxShadow: 3,
//                 display: "flex",
//                 flexDirection: "column",
//                 justifyContent: "space-between",
//               }}
//             >
//               <Paper elevation={3} style={{ padding: "5px" }}>
//                 <Typography variant="body2" sx={{}}>
//                   {overwriteSelected ? note : note.substring(0, 105) + "..."}
//                 </Typography>
//               </Paper>
//               {!overwriteSelected && (
//                 <div className="flex justify-between pb-2 pl-2 pr-2">
//                   <Button variant="contained" size="small" color="primary">
//                     MORE
//                   </Button>
//                   <Button variant="contained" size="small" color="primary">
//                     CLOSE
//                   </Button>
//                 </div>
//               )}
//             </Paper>
//           </Html>
//         )}
//       </mesh>
//       {connectionLineTo && lineMidpoint && (
//         <>
//           <line_ ref={lineRef} geometry={lineGeometry}>
//             <lineBasicMaterial
//               attach="material"
//               color={"#9c88ff"}
//               linewidth={10}
//               linecap={"round"}
//               linejoin={"round"}
//             />
//           </line_>
//           <Html position={new Vector3(...lineMidpoint)}>
//             <div
//               style={{
//                 color: "white",
//                 background: "rgba(0, 0, 0, 0.5)",
//                 padding: "2px 5px",
//                 borderRadius: "4px",
//               }}
//             >
//               {similarity?.toFixed(2)}
//             </div>
//           </Html>
//         </>
//       )}
//     </>
//   );
// };

// export default EmbeddedNote;
