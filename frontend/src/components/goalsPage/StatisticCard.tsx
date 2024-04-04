// import { useContext, useState } from "react";
// import {
//   Card,
//   CardContent,
//   Typography,
//   Tooltip,
//   Box,
//   Grid,
//   linearProgressClasses,
// } from "@mui/material";
// import VerticalLinearProgress from "./VerticalLinearProgress";

// import { StatisticData } from "./types";
// import { MapKeysContext } from "../contexts/MapKeysContext";

// const StatisticCard = ({
//   statisticData,
//   overrideSize,
//   overridenWidth,
// }: {
//   statisticData: StatisticData;
//   overrideSize?: boolean;
//   overridenWidth?: string;
// }) => {
//   // React state to manage hover details
//   const [, setHoverDetail] = useState({ index: -1, value: 0 });
//   // Ensure there are at least 7 entries for a weekly view
//   if (statisticData.values.length < 7) {
//     const lastEntry = statisticData.values[statisticData.values.length - 1];
//     const remainingEntries = Array(7 - statisticData.values.length).fill(
//       lastEntry
//     );
//     statisticData.values = [...statisticData.values, ...remainingEntries];
//   }

//   // Calculate stats for the last 7 entries
//   const lastEntries = statisticData.values.slice(-7);
//   const maxValue = Math.max(...lastEntries);
//   const minValue = Math.min(...lastEntries);

//   // Function to exaggerate scale
//   const exaggerateScale = (value: number) => {
//     const factor = 1.25;
//     const normalizedValue = (value - minValue) / (maxValue - minValue);
//     const exaggeratedValue = Math.pow(normalizedValue, factor);
//     return exaggeratedValue * 100;
//   };

//   // Function to calculate average
//   const calculateAverage = () => {
//     const sum = lastEntries.reduce((acc, val) => acc + val, 0);
//     return (sum / lastEntries.filter((num) => num > 0).length).toFixed(2);
//   };

//   const { mapKeys } = useContext(MapKeysContext);
//   return (
//     <Card
//       sx={{
//         boxShadow: theme.shadows[2],
//         cursor: "pointer",
//         maxHeight: `${"full"}`,
//         width: overridenWidth && overrideSize ? overridenWidth : "auto",
//       }}
//     >
//       <CardContent sx={{ paddingTop: 1, paddingLeft: 1, paddingRight: 1 }}>
//         <Typography
//           variant="h6"
//           color="text.primary"
//           sx={{
//             textWrap: "nowrap",
//             textOverflow: "ellipsis",
//             overflow: "hidden",
//           }}
//         >
//           {mapKeys(statisticData.name)}
//         </Typography>
//         <Grid container spacing={2}>
//           <Grid item xs={12} md={6}>
//             <Box
//           component="div"    sx={{
//                 display: "flex",
//                 flexDirection: "column",
//                 justifyContent: "space-between",
//               }}
//             >
//               <Typography variant="body2">
//                 {mapKeys("Weekly Summary")}
//               </Typography>
//               <Typography variant="body2">
//                 {mapKeys("Average:")} {calculateAverage()}
//               </Typography>
//             </Box>
//           </Grid>
//           <Grid
//             item
//             xs={12}
//             md={6}
//             sx={{ display: "flex", justifyContent: "space-around" }}
//           >
//             {lastEntries.map((value, index) => (
//               <Tooltip
//                 key={index}
//                 title={`Value: ${value}`}
//                 placement="top"
//                 arrow
//                 onMouseEnter={() => setHoverDetail({ index, value })}
//                 onMouseLeave={() => setHoverDetail({ index: -1, value: 0 })}
//               >
//                 <VerticalLinearProgress
//                   variant="determinate"
//                   value={exaggerateScale(value)}
//                   sx={{
//                     [`& .${linearProgressClasses.bar}`]: {
//                       transform: `translateY(${
//                         100 - exaggerateScale(value)
//                       }%)!important`,
//                       backgroundColor: theme.palette.secondary.main,
//                     },
//                     height: "4vh",
//                     width: "2vw",
//                     marginLeft: "3px",
//                   }}
//                 />
//               </Tooltip>
//             ))}
//           </Grid>
//         </Grid>
//       </CardContent>
//     </Card>
//   );
// };

// export default StatisticCard;
