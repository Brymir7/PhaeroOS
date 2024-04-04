// import React, { useState, useEffect, useContext } from "react";
// import {
//   Button,
//   Dialog,
//   DialogContent,
//   DialogTitle,
//   DialogActions,
//   Paper,
//   TextField,
//   Autocomplete,
//   Typography,
//   Checkbox,
//   Grid,
//   ToggleButton,
//   ToggleButtonGroup,
//   DialogContentText,
// } from "@mui/material";
// import Habit from "../habitPage/Habit";
// import { useNavigate } from "react-router";
// import StatisticCard from "./StatisticCard";
// import { GoalType, HabitItem, MapIconStringToIcon, RelationType, StatisticData } from "./types";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faFlag, faTrash } from "@fortawesome/free-solid-svg-icons";
// import {
//   convertHabitItemToGoal,
//   convertStatisticToGoal,
// } from "./Goalgeneration";
// import { useApi } from "../../modules/apiAxios";
// import dayjs from "dayjs";
// import { MapKeysContext } from "../contexts/MapKeysContext";
// interface EditGoalProps {
//   goal: GoalType;
//   modifyGoal: (goal: GoalType) => void;
//   isOpen?: boolean; // Optionally control dialog open state from parent
//   onClose: () => void;
//   deleteGoal: (goal: GoalType) => void;
// }

// const EditGoal: React.FC<EditGoalProps> = ({
//   goal,
//   modifyGoal,
//   deleteGoal,
//   isOpen = true,
//   onClose,
// }) => {
//   const [open, setOpen] = useState(isOpen);
//   const [habits, setHabits] = useState(goal.habits);
//   const [statistic, setStatistic] = useState(goal.statistic);
//   const [allHabits, setAllHabits] = useState<HabitItem[]>([]);
//   const [allStatistics, setAllStatistics] = useState<StatisticData[]>([]);
//   const navigate = useNavigate();
//   const [displayAutoGen, setDisplayAutoGen] = useState<GoalType>(); // Display auto-gen options [statistic, habits
//   const [autoGenerate, setAutoGenerate] = useState(false);
//   const api = useApi();
//   const [relationTypeStatistic, setRelationTypeStatistic] =
//     useState<RelationType>(RelationType.BIGGER);

//   useEffect(() => {
//     setOpen(isOpen);
//     if (isOpen) {
//       api
//         .get("/diagrams/list/")
//         .then((response: { data: StatisticData[] }) => {
//           setAllStatistics([
//             ...((Array.isArray(response.data)
//               ? response.data
//               : []) as StatisticData[]),
//           ]);
//         })
//         .catch((error: Error) => {
//           console.log(error);
//         });
//       api
//         .get("/habits/")
//         .then((response: { data: { habits: HabitItem[]; } }) => {
//           const updatedHabits = response.data.habits.map((habit: HabitItem) => {
//             const lastRecordedDate = dayjs(habit.recorded_at);
//             const today = dayjs();
//             const deltaDays = today.diff(lastRecordedDate, "day");
//             if (deltaDays > 0) {
//               if (typeof habit.progress.progress[0] === "boolean"){
//               for (let i = 0; i < deltaDays; i++) {
//                 (habit.progress.progress as boolean[]).push(false);
//               }
//               } else {
//                 for (let i = 0; i < deltaDays; i++) {
//                   (habit.progress.progress as number[]).push(0);
//                 }
//               }
//               habit.recorded_at = today.format("YYYY-MM-DD");
//             }
//             const currDay = Math.min(habit.progress.progress.length, deltaDays + 1);
//             return {
//               ...habit,
//               currDay,
//             };
//           });
//           setAllHabits(updatedHabits);
//         })
//         .catch((error: Error) => {
//           console.log(error);
//         });
//     }
//   }, [open]);

//   const handleSave = () => {
//     let updatedGoal = { ...goal }; // Clone the existing goal to ensure immutability

//     if (autoGenerate) {
//       if (displayAutoGen) {
//         updatedGoal = displayAutoGen;
//       }
//     } else {
//       updatedGoal.statistic = statistic;
//       updatedGoal.habits = habits;
//     }
//     modifyGoal(updatedGoal);
//     handleClose();
//   };

//   function mergeAndAlignGoals(
//     existingGoal: GoalType,
//     newGoal: GoalType
//   ): GoalType {
//     if (!newGoal.autoCompletion) {
//       return existingGoal;
//     }
//     // Determine padding needed to make existing arrays align with groups of 3
//     const existingFlagsCount = existingGoal.flags.length;
//     const paddingNeeded = (3 - (existingFlagsCount % 3)) % 3;

//     // Pad existing flags and progress to align with groups of 3, if necessary
//     const paddedFlags = [
//       ...existingGoal.flags,
//       ...new Array(paddingNeeded).fill(""),
//     ];
//     const paddedProgress = [
//       ...existingGoal.progress,
//       ...new Array(paddingNeeded).fill(false),
//     ];

//     // Append new goals, ensuring alignment and grouping
//     const combinedFlags = [...paddedFlags, ...newGoal.flags];
//     const combinedProgress = [
//       ...paddedProgress,
//       ...new Array(newGoal.flags.length).fill(false),
//     ]; // Initialize new progress as false
//     const combinedNumberGoals = existingGoal.autoCompletion?.numberGoals
//       ? [
//           ...existingGoal.autoCompletion.numberGoals,
//           ...newGoal.autoCompletion.numberGoals,
//         ]
//       : [...newGoal.autoCompletion.numberGoals];

//     return {
//       ...existingGoal,
//       flags: combinedFlags,
//       progress: combinedProgress,
//       autoCompletion: {
//         autoCompleteByStats: true,
//         numberGoals: combinedNumberGoals,
//         relationType: newGoal.autoCompletion.relationType,
//       },
//     };
//   }

//   const handleClose = () => {
//     setOpen(false);
//     onClose();
//   };
//   const colors = [
//     "bg-pink-500",
//     "bg-yellow-500",
//     "bg-blue-500",
//     "bg-green-500",
//     "bg-purple-500",
//     "bg-red-500",
//     "bg-indigo-500",
//     "bg-orange-500",
//     "bg-teal-500",
//     "bg-cyan-500",
//     "bg-lime-500",
//     "bg-amber-500",
//     "bg-sky-500",
//     "bg-violet-500",
//     "bg-rose-500",
//     "bg-fuchsia-500",
//     "bg-emerald-500",
//     "bg-lime-600",
//   ];
//   const handleAddSelectedHabit = (habit: HabitItem | null) => {
//     if (habit && !habits?.some((h) => h.id === habit.id)) {
//       setHabits([...(habits ? habits : []), habit]);
//     }
//   };
//   const handleAddSelectedStatistic = (statistic: StatisticData | null) => {
//     if (statistic) {
//       setStatistic(statistic);
//     }
//   };

//   useEffect(() => {
//     if (autoGenerate && (statistic || habits)) {
//       createAndSetDisplayAutoGen();
//     } else {
//       setDisplayAutoGen(undefined);
//     }
//   }, [relationTypeStatistic, autoGenerate, statistic, habits]);

//   const createAndSetDisplayAutoGen = () => {
//     let newGoal = { ...goal };
//     if (statistic) {
//       const newGoalFromStatistic = convertStatisticToGoal(
//         statistic,
//         relationTypeStatistic,
//         6
//       );
//       newGoal = mergeAndAlignGoals(newGoal, newGoalFromStatistic);
//     }
//     if (habits) {
//       habits.forEach((habit) => {
//         const newGoalFromHabit = convertHabitItemToGoal(habit, 6);
//         newGoal = mergeAndAlignGoals(newGoal, newGoalFromHabit);
//       });
//     }
//     console.log(newGoal)
//     setDisplayAutoGen(newGoal);
//   };

//   const [editingFlagIndex, setEditingFlagIndex] = useState<number | null>(null); // for editing autoGen flags
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

//   // Handlers to open and close the delete confirmation dialog
//   const handleDeleteClickOpen = () => {
//     setDeleteDialogOpen(true);
//   };

//   const handleDeleteClose = () => {
//     setDeleteDialogOpen(false);
//   };

//   const handleDeleteConfirm = () => {
//     deleteGoal(goal);
//     setDeleteDialogOpen(false);
//     handleClose();
//     console.log("Deleted goal");
//   };

//   const calculateGridItemSize = (index: number) => {
//     const flagToCheck = index % 2 == 0 ? 1 : -1; // only check either the flag to the left or right (2 items per row), right first because of 0-indexing

//     if (editingFlagIndex !== null) {
//       if (editingFlagIndex === index + flagToCheck) {
//         return 3;
//       }
//       if (editingFlagIndex === index) {
//         return 9;
//       }
//     }
//     return 6; // Default size to show 3 items per row
//   };
//   const handleStatisticRelationTypeChange = (
//     _event: React.MouseEvent<HTMLElement>,
//     newRelationType: RelationType
//   ) => {
//     if (newRelationType !== null) {
//       setRelationTypeStatistic(newRelationType);
//     }
//   };
//   const { mapKeys } = useContext(MapKeysContext);
//   return (
//     <Dialog
//       open={open}
//       onClose={handleClose}
//       maxWidth="md"
//       fullWidth
//       sx={{ "& .MuiDialogContent-root": { padding: "1px" } }}
//     >
//       <DialogTitle sx={{ paddingBottom: 0, position: "relative" }}>
//         {mapKeys("Attach to goal")}
//       </DialogTitle>
//       <DialogContent>
//         <Paper
//           sx={{
//             padding: 3,
//             marginBottom: 2,
//             overflowY: "auto",
//             maxHeight: "50vh",
//           }}
//         >
//           <Autocomplete
//             disablePortal
//             id="habit-search-select"
//             options={allHabits.filter(
//               (habit) => !habits?.some((h) => h.id === habit.id)
//             )}
//             isOptionEqualToValue={(option, value) => option.id === value.id}
//             getOptionLabel={(option) => option.title}
//             renderInput={(params) => (
//               <TextField {...params} label={mapKeys("Search and add habits")} />
//             )}
//             onChange={(_, newValue) => handleAddSelectedHabit(newValue)}
//           />
//           <Typography variant="h6" sx={{ paddingTop: 2 }}>
//             {habits?.length ?? 0 > 0
//               ? mapKeys("Currently attached habits:")
//               : ""}
//           </Typography>
//           {habits &&
//             habits.map((habit, index) => (
//               <div className="flex items-center pt-2" key={index}>
//                 <Habit
//                   key={habit.id}
//                   habit={habit}
//                   color={colors[index % colors.length]}
//                   iconToUse={MapIconStringToIcon(habit.icon)}
//                   maxEntries={7}
//                   openDetails={() => {
//                     navigate("/home/checklist");
//                   } }
//                   onCheck={() => { } }
//                   onDecrement={() => { } } textColor={""}                />
//                 <FontAwesomeIcon
//                   size="lg"
//                   icon={faTrash}
//                   className="ml-5 text-red-500 cursor-pointer"
//                   onClick={() =>
//                     setHabits(habits.filter((h) => h.id !== habit.id))
//                   }
//                 />
//               </div>
//             ))}
//           {!goal.statistic && (
//             <Autocomplete // Note: only one allowd for calculation later
//               disablePortal
//               id="statistic-search-select"
//               options={allStatistics
//                 .filter(
//                   (statisticFromAll) =>
//                     statisticFromAll.name !== statistic?.name
//                 )
//                 .filter(
//                   (statisticFromAll) =>
//                     statisticFromAll.values.length > 0 &&
//                     statisticFromAll.values[
//                       statisticFromAll.values.length - 1
//                     ] > 0
//                 )}
//               getOptionLabel={(option) => mapKeys(option.name)}
//               isOptionEqualToValue={(option, value) =>
//                 option.name === value.name
//               }
//               inputValue={statistic ? mapKeys(statistic.name) : ""}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label={mapKeys("Search and add statistics")}
//                 />
//               )}
//               onChange={(_, newValue) => handleAddSelectedStatistic(newValue)}
//               sx={{ marginTop: 2 }}
//             />
//           )}
//           {statistic && (
//             <Typography variant="h6" sx={{ paddingTop: 2 }}>
//               {statistic ? mapKeys("Currently attached statistics:") : ""}
//             </Typography>
//           )}
//           {statistic !== goal.statistic && goal.statistic ? (
//             <Typography variant="h6" sx={{paddingTop: 2}}>
//               {mapKeys(
//                 "If you change the statistic, the number goals for each old flag will still be the same."
//               )}
//               <br />
//               {mapKeys(
//                 "If you want to change the number goals, tap on the flags, they will be filled by the new statistic."
//               )}
//               <br />
//               {mapKeys(
//                 "If you deleted your statistic, you can add the new one after saving."
//               )}
//             </Typography>
//           ) : (
//             ""
//           )}
//           {statistic && (
//             <Grid container spacing={1} sx={{ alignItems: "center" }}>
//               <Grid item xs={6.25}>
//                 <StatisticCard key={statistic.name} statisticData={statistic} />
//               </Grid>
//               <Grid item xs={3}>
//                 <FontAwesomeIcon
//                   icon={faTrash}
//                   onClick={() => setStatistic(undefined)}
//                   size="lg"
//                   className="ml-3 text-red-500 cursor-pointer"
//                 />
//               </Grid>

//               {autoGenerate && (
//                 <Grid item xs={7}>
//                   <ToggleButtonGroup
//                     color="primary"
//                     exclusive
//                     value={relationTypeStatistic}
//                     onChange={(event, newRelationType) =>
//                       handleStatisticRelationTypeChange(event, newRelationType)
//                     }
//                     aria-label="text-alignment"
//                     sx={{ flex: 1, justifyContent: "center" }}
//                   >
//                     <ToggleButton
//                       value={RelationType.SMALLER}
//                       aria-label="SMALLER"
//                     >
//                       Decrease
//                     </ToggleButton>
//                     <ToggleButton
//                       value={RelationType.BIGGER}
//                       aria-label="BIGGER"
//                     >
//                       Increase
//                     </ToggleButton>
//                   </ToggleButtonGroup>
//                 </Grid>
//               )}
//             </Grid>
//           )}
//           <Typography variant="h6" sx={{ paddingTop: 2, paddingBottom: 2 }}>
//             {displayAutoGen ? mapKeys("Autogenerated: ") : ""}
//           </Typography>
//           <Grid container spacing={2}>
//             {displayAutoGen &&
//               displayAutoGen.flags
//                 .filter((flag) => flag !== "" && !goal.flags.includes(flag))
//                 .map((flag, index) => (
//                   <Grid
//                     item
//                     key={index}
//                     xs={calculateGridItemSize(index)}
//                     sm={calculateGridItemSize(index)}
//                     md={calculateGridItemSize(index)}
//                   >
//                     <Paper>
//                       <div
//                         className="flex items-center"
//                         style={{ transition: "all 0.3s ease" }}
//                       >
//                         <TextField
//                           fullWidth
//                           value={flag}
//                           onChange={(e) => {
//                             const newFlags = [...displayAutoGen.flags];
//                             newFlags[index] = e.target.value;
//                             setDisplayAutoGen({
//                               ...displayAutoGen,
//                               flags: newFlags,
//                             });
//                           }}
//                           onFocus={() => setEditingFlagIndex(index)}
//                           onBlur={() => setEditingFlagIndex(null)}
//                         />
//                         <FontAwesomeIcon
//                           icon={faTrash}
//                           className="text-red-500 cursor-pointer pl-2 pr-2"
//                           onClick={() => {
//                             const newFlags = [...displayAutoGen.flags];
//                             newFlags.splice(index, 1);
//                             setDisplayAutoGen({
//                               ...displayAutoGen,
//                               flags: newFlags,
//                             });
//                             if (editingFlagIndex === index) {
//                               setEditingFlagIndex(null); // Reset editing index if the current TextField is removed
//                             }
//                           }}
//                         />
//                       </div>
//                     </Paper>
//                   </Grid>
//                 ))}
//           </Grid>
//           <Button
//             sx={{ position: "absolute", left: 0, bottom: 8 }}
//             onClick={handleDeleteClickOpen}
//             color="error"
//           >
//             <FontAwesomeIcon
//               icon={faTrash}
//               className="ml-2 mr-2 p-1"
//               size="lg"
//             />
//           </Button>
//           <Dialog
//             open={deleteDialogOpen}
//             onClose={handleDeleteClose}
//             aria-labelledby="alert-dialog-title"
//             aria-describedby="alert-dialog-description"
//           >
//             <DialogTitle id="alert-dialog-title">
//               {mapKeys("Confirm Delete")}
//             </DialogTitle>
//             <DialogContent>
//               <DialogContentText id="alert-dialog-description">
//                 {mapKeys(
//                   "Are you sure you want to delete this item? This action cannot be undone."
//                 )}
//               </DialogContentText>
//             </DialogContent>
//             <DialogActions>
//               <Button onClick={handleDeleteClose}>{mapKeys("Cancel")}</Button>
//               <Button onClick={handleDeleteConfirm} color="error">
//                 {mapKeys("Confirm")}
//               </Button>
//             </DialogActions>
//           </Dialog>
//         </Paper>
//         {
//           <div className="flex justify-center align-middle">
//             <Checkbox
//               sx={{ paddingLeft: 0, paddingTop: 0 }}
//               onClick={() => {
//                 setAutoGenerate(!autoGenerate);
//               }}
//             />
//             <span className="text-sm">{mapKeys("Auto-generate subgoals")}</span>
//             <FontAwesomeIcon icon={faFlag} size="lg" className="ml-2" />
//           </div>
//         }
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleClose}>{mapKeys("Cancel")}</Button>
//         <Button
//           variant="contained"
//           color="primary"
//           onClick={handleSave}
//           sx={{
//             bgcolor: "primary.main",
//             "&:hover": { bgcolor: "primary.dark" },
//           }}
//         >
//           {mapKeys("Save Changes")}
//         </Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default EditGoal;
