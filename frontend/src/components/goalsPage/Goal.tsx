// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faPaperclip } from "@fortawesome/free-solid-svg-icons";
// import {
//   Button,
//   Grid,
//   LinearProgress,
//   Paper,
//   TextField,
//   Typography,
//   linearProgressClasses,
// } from "@mui/material";
// import GoalFlag from "./Flag";
// import VerticalLinearProgress from "./VerticalLinearProgress";

// import FlagChanger from "./FlagChanger";
// import EditGoal from "./AttachGoal";
// import { useContext, useEffect, useState } from "react";
// import StatisticCard from "./StatisticCard";
// import { GoalProps, RelationType } from "./types";
// import EditGoalFlags from "./EditGoalFlags";
// import HabitCard from "./HabitCard";
// import { MapKeysContext } from "../contexts/MapKeysContext";


// const Goal: React.FC<GoalProps> = ({ goal, modifyGoal, deleteGoal }) => {
//   const [isModifyingGoal, setIsModifyingGoal] = useState(false);
//   const { mapKeys } = useContext(MapKeysContext);
//   const defaultFlagName = mapKeys("Tap to edit");
//   const amountOfFlags = goal.flags.filter((f) => f !== "").length; // progress is not sparse, but flags with "" are meant to be sparse palceholders
//   const totalProgress = Math.round(
//     (goal.progress.filter((p) => p).length / amountOfFlags) * 100
//   );
//   // Function to chunk flags into groups of 3
//   const chunkFlags = (flags: string[], size: number) =>
//     Array.from({ length: Math.ceil(flags.length / size) }, (_, index) =>
//       flags.slice(index * size, index * size + size)
//     );
//   const flagGroupsLength = 3;
//   const flagGroups = chunkFlags(goal.flags, flagGroupsLength);
//   const progressForEachGroup = flagGroups.map((_, groupIndex) => {
//     const baseValue =
//       (goal.progress
//         .slice(
//           groupIndex * flagGroupsLength,
//           (groupIndex + 1) * flagGroupsLength
//         )
//         .filter(
//           (p, index) =>
//             p && goal.flags[groupIndex * flagGroupsLength + index] !== ""
//         ).length *
//         100) /
//       flagGroups[groupIndex].filter((f) => f !== "").length;
//     if (baseValue < 50) {
//       return 0.0;
//     } else if (baseValue < 100) {
//       return 50.0;
//     }
//     return 100.0;
//   });
//   const checkFlag = (flagIndex: number) => {
//     // Calculate the group index of the clicked flag
//     const flagGroupIndex = Math.floor(flagIndex / flagGroupsLength);

//     const newProgress = goal.progress.map((p, index) => {
//       // Calculate the current flag's group index
//       const currentFlagGroupIndex = Math.floor(index / flagGroupsLength);
//       if (currentFlagGroupIndex < flagGroupIndex) {
//         return p;
//       }
//       if (currentFlagGroupIndex === flagGroupIndex) {
//         if (index < flagIndex) {
//           return true;
//         }
//         if (index === flagIndex) {
//           return !p;
//         }
//       }
//       if (
//         currentFlagGroupIndex === flagGroupIndex &&
//         goal.progress[flagIndex]
//       ) {
//         // if the flag will not be checked afterwards (we are iterating over the previous state)
//         return false;
//       }
//       return p;
//     });
//     modifyGoal({ ...goal, progress: newProgress });
//   };
//   const autoComplete = () => {
//     if (!goal.autoCompletion || !goal.statistic) return;
//     if (!goal.autoCompletion.autoCompleteByStats) return;
//     if (goal.flags.length !== goal.autoCompletion.numberGoals.length) return;
//     const howRecentCanStatisticBeDays = Math.max(
//       goal.statistic.values.length,
//       30
//     );
//     const minStatisticValue = Math.min(
//       ...goal.statistic.values.slice(-howRecentCanStatisticBeDays)
//     );
//     const maxStatisticValue = Math.max(
//       ...goal.statistic.values.slice(-howRecentCanStatisticBeDays)
//     );
//     const newProgress = goal.progress.map((p, index) => {
//       if (goal.autoCompletion?.relationType === RelationType.SMALLER) {
//         if (minStatisticValue < goal.autoCompletion.numberGoals[index]) {
//           return true;
//         }
//         return false;
//       } else if (goal.autoCompletion?.relationType === RelationType.BIGGER) {
//         if (maxStatisticValue >= goal.autoCompletion.numberGoals[index]) {
//           return true;
//         }
//         return false;
//       }
//       return p;
//     });
//     modifyGoal({ ...goal, progress: newProgress });
//   };

//   const modifyFlag = (
//     flagIndex: number,
//     newName: string,
//     numberGoal?: number
//   ) => {
//     const newFlags = goal.flags.map((flag, index) => {
//       if (index === flagIndex) {
//         if (numberGoal) {
//           goal.autoCompletion!.numberGoals[index] = numberGoal;
//         }
//         return newName;
//       }
//       return flag;
//     });
//     modifyGoal({ ...goal, flags: newFlags });
//   };
//   const [isEditingTitle, setIsEditingTitle] = useState(false);
//   const [editedTitle, setEditedTitle] = useState(goal.title);
//   const handleSaveEdit = (type: "title") => {
//     if (type === "title") {
//       modifyGoal({ ...goal, title: editedTitle });
//       setIsEditingTitle(false);
//     }
//   };
//   const handleAddFlag = (index: number) => {
//     goal.flags[index] = defaultFlagName;
//     modifyGoal({ ...goal, flags: goal.flags });
//   };
//   useEffect(() => {
//     autoComplete();
//   }, [goal.flags]);
//   return (
//     <Paper
//       elevation={3}
//       sx={{ marginTop: 3, marginLeft: 1, marginRight: 1, position: "relative" }}
//     >
//       <Paper elevation={2} sx={{ padding: 1, paddingLeft: 2, marginBottom: 2 }}>
//         {isEditingTitle ? (
//           <TextField
//             fullWidth
//             variant="outlined"
//             value={editedTitle}
//             onChange={(e) => setEditedTitle(e.target.value)}
//             onBlur={() => handleSaveEdit("title")}
            
//             className="text-2xl font-bold"
//           />
//         ) : (
//           <Typography
//             variant="h5"
//             component="h3"
//             onClick={() => setIsEditingTitle(true)}
//           >
//             {goal.title}
//           </Typography>
//         )}
//       </Paper>
//       <Grid
//         container
//         sx={{
//           paddingLeft: `${flagGroups.length > 1 ? "20px" : "50px"}`,
//           paddingBottom: "10px",
//         }}
//       >
//         {flagGroups.length > 1 && (
//           <Grid item xs={1}>
//             <VerticalLinearProgress
//               variant="determinate"
//               value={totalProgress}
//               sx={{
//                 [`& .${linearProgressClasses.bar}`]: {
//                   transform: `translateY(${totalProgress}%)!important`, // Adjust the transformation for inversion
//                   backgroundColor: theme.palette.secondary.main, // Use secondary color for the primary progress bar
//                 },
//                 [`&.${linearProgressClasses.colorPrimary}`]: {
//                   backgroundColor: theme.palette.secondary.light, // Lighter secondary color for background
//                 },
//                 [`& .${linearProgressClasses.barColorPrimary}`]: {
//                   backgroundColor: "lightgrey", // Use primary color for what was originally secondary
//                 },
//                 [`&.${linearProgressClasses.colorSecondary}`]: {
//                   backgroundColor: theme.palette.primary.light, // Lighter primary color for background
//                 },
//                 height: "100%",
//                 width: "7px",
//                 borderRadius: 5,
//               }}
//             />
//           </Grid>
//         )}
//         <Grid item xs={11}>
//           {flagGroups.map((group, groupIndex) => (
//             <Grid container spacing={1} key={groupIndex}>
//               {group.map((flag, index) => {
//                 if (flag !== "") {
//                   return (
//                     <Grid item key={index} xs={4}>
//                       <GoalFlag
//                         achieved={
//                           goal.progress[flagGroupsLength * groupIndex + index]
//                         }
//                         onCheck={() => {
//                           checkFlag(groupIndex * flagGroupsLength + index);
//                         }}
//                       />
//                     </Grid>
//                   );
//                 }
//                 return null;
//               })}
//               <Grid item xs={12}>
//                 <LinearProgress
//                   variant="determinate"
//                   value={progressForEachGroup[groupIndex]}
//                   sx={{
//                     width: `${
//                       group.filter((f) => f !== "").length > 1
//                         ? group.filter((f) => f !== "").length * 33.33 - 30
//                         : 0
//                     }%`, // 100 / 3 = 33.33
//                     height: "7px",
//                     backgroundColor: "lightgrey",
//                     borderRadius: 5,
//                   }}
//                 />{" "}
//               </Grid>
//               {group.map(
//                 (
//                   flag,
//                   index // its separate fromo the above iterator because of the progress bar
//                 ) => {
//                   return flag !== "" ? (
//                     <Grid item key={index} xs={4}>
//                       <FlagChanger
//                         flag={flag}
//                         setFlag={(newFlagName: string, numberGoal?: number) => {
//                           modifyFlag(
//                             groupIndex * flagGroupsLength + index,
//                             newFlagName,
//                             numberGoal
//                           );
//                         }}
//                         numberGoalProp={
//                           goal.autoCompletion?.numberGoals[
//                             groupIndex * flagGroupsLength + index
//                           ]
//                         }
//                       />{" "}
//                     </Grid>
//                   ) : (
//                     index > 0 && group[index - 1] !== "" && (
//                       <Grid item key={index} xs={4}>
//                         <Button
//                           sx={{ padding: 0 }}
//                           onClick={() =>
//                             handleAddFlag(groupIndex * flagGroupsLength + index)
//                           }
//                         >
//                           Add
//                         </Button>
//                       </Grid>
//                     )
//                   );
//                 }
//               )}
//             </Grid>
//           ))}
//         </Grid>
//       </Grid>
//       <Button
//         onClick={() => setIsModifyingGoal(!isModifyingGoal)}
//         sx={{
//           position: "absolute",
//           top: 4,
//           right: -10,
//         }}
//       >
//         <FontAwesomeIcon icon={faPaperclip} size="2x" />
//       </Button>
//       <div className="p-4">
//         {goal.statistic && (
//           <StatisticCard
//             statisticData={goal.statistic}
//             overridenWidth={"100%	"}
//           />
//         )}
//         {goal.habits &&
//           goal.habits.map((habit, index) => (
//             <div className={`${index > 0 ? "mt-2" : ""}`}>
//               <HabitCard habit={habit} />
//             </div>
//           ))}
//       </div>
//       {isModifyingGoal && (
//         <EditGoal
//           goal={goal}
//           modifyGoal={modifyGoal}
//           deleteGoal={deleteGoal}
//           onClose={() => {
//             setIsModifyingGoal(!isModifyingGoal);
//           }}
//         />
//       )}
//       <EditGoalFlags modifyGoal={modifyGoal} goal={goal} flagGroupLength={3} />
//     </Paper>
//   );
// };

// export default Goal;
