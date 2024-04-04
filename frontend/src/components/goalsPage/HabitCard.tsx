// import React, { useState } from "react";
// import { Card, CardContent, Typography, IconButton } from "@mui/material";
// import {
//   HabitItem,
//   MapIconStringToIcon,
//   isHabitBooleanProgress,
//   isHabitNumberProgress,
// } from "./types"; // Assuming the HabitItem type is defined elsewhere
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// interface HabitCardProps {
//   habit: HabitItem;
// }
// const HabitCard: React.FC<HabitCardProps> = ({ habit }) => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   let totalCompletions = 0;
//   if (isHabitNumberProgress(habit.progress)) {
//     return null;
//   } else if (isHabitBooleanProgress(habit.progress)) {
//     totalCompletions = habit.progress.progress.filter(Boolean).length;
//   }

//   const handleExpandClick = () => {
//     setIsExpanded(!isExpanded);
//   };

//   return (
//     <Card
//       sx={{
//         boxShadow: theme.shadows[4],
//         marginTop: "1px",
//         marginLeft: "1px",
//         cursor: "pointer",
//         maxHeight: `${isExpanded ? "full" : "7vh"}`,
//       }}
//       onClick={handleExpandClick}
//     >
//       <CardContent sx={{ paddingTop: 1, paddingLeft: 1, paddingRight: 1 }}>
//         <Typography
//           variant="h6"
//           component="div"
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             textWrap: "nowrap",
//             textOverflow: "ellipsis",
//             overflow: "hidden",
//           }}
//         >
//           <FontAwesomeIcon
//             icon={MapIconStringToIcon(habit.icon)}
//             style={{ marginRight: "10px" }}
//           />
//           {habit.title}
//           <IconButton
//             aria-expanded={isExpanded}
//             aria-label="show more"
//             sx={{ padding: 0, marginLeft: "auto" }}
//             onClick={handleExpandClick}
//           >
//             <ExpandMoreIcon />
//           </IconButton>
//         </Typography>
//         {isExpanded && (
//           <>
//             <Typography variant="body2" color="text.secondary">
//               Total Completions: {totalCompletions}
//             </Typography>
//             <Typography
//               variant="body2"
//               color="text.secondary"
//               sx={{ marginTop: 2 }}
//             >
//               Description: {habit.description}
//             </Typography>
//           </>
//         )}
//       </CardContent>
//     </Card>
//   );
// };

// export default HabitCard;
