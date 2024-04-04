// import {
//   BackendHabitItem,
//   GoalType,
//   MapIconStringToIcon,
//   RelationType,
//   colors,
//   convertBackendToFrontendHabits,
// } from "./types";
// import React, { useContext, useEffect, useState } from "react";
// import {
//   Autocomplete,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Paper,
//   TextField,
//   ToggleButton,
//   ToggleButtonGroup,
//   Typography,
// } from "@mui/material";
// import { StatisticData, HabitItem } from "./types";
// import StatisticCard from "./StatisticCard";
// import Habit from "../habitPage/Habit";
// import { useNavigate } from "react-router";
// import {
//   convertStatisticToGoal,
//   convertHabitItemToGoal,
// } from "./Goalgeneration";
// import { useApi } from "../../modules/apiAxios";
// import { MapKeysContext } from "../contexts/MapKeysContext";
// interface AutoGoalGeneratorProps {
//   addGoal: (goal: GoalType) => void;
// }

// const AutoGoalGenerator: React.FC<AutoGoalGeneratorProps> = ({ addGoal }) => {
//   const { mapKeys } = useContext(MapKeysContext);
//   const [open, setOpen] = useState(false);
//   const [title, setTitle] = useState("");
//   const [description, setDescription] = useState("");
//   const [showAutoGen, setShowAutoGen] = useState(false);
//   const navigate = useNavigate();
//   const [allStatistics, setAllStatistics] = useState<StatisticData[]>([]);
//   const [habitItems, setAllHabits] = useState<HabitItem[]>([]);
//   const [selectedStatistic, setSelectedStatistic] = useState<StatisticData>();
//   const [selectedHabit, setSelectedHabit] = useState<HabitItem>();
//   const [relationType, setRelationType] = useState<RelationType | undefined>(
//     RelationType.BIGGER
//   );
//   const handleOpen = () => setOpen(true);
//   const handleClose = () => {
//     setOpen(false);
//     setTitle("");
//     setDescription("");
//     setSelectedHabit(undefined);
//     setSelectedStatistic(undefined);
//     setRelationType(undefined);
//   };
//   const handleGenerate = (relationType?: RelationType) => {
//     if (
//       selectedStatistic &&
//       (relationType === RelationType.SMALLER ||
//         relationType === RelationType.BIGGER)
//     ) {
//       addGoal(convertStatisticToGoal(selectedStatistic, relationType, 6));
//     } else if (selectedHabit) {
//       addGoal(convertHabitItemToGoal(selectedHabit, 6));
//     } else if (title) {
//       addGoal({
//         title,
//         description,
//         progress: new Array(1).fill(false),
//         flags: [mapKeys("Tap to edit")],
//         id: 1,
//       });
//     }
//     handleClose();
//   };
//   const api = useApi();
//   const handleChange = () => {
//     setShowAutoGen(!showAutoGen);
//   };
//   useEffect(() => {
//     if (open) {
//       api
//         .get("/diagrams/list/")
//         .then((response: { data: unknown }) => {
//           setAllStatistics([
//             ...((Array.isArray(response.data)
//               ? response.data
//               : []) as StatisticData[]),
//           ]);
//         })
//         .catch((error: unknown) => {
//           console.log(error);
//         });
//       api
//         .get("/habits/")
//         .then((response: { data: unknown }) => {
//           const updatedHabits = convertBackendToFrontendHabits(response.data as {habits: BackendHabitItem[]});
//           setAllHabits(updatedHabits);
//         })
//         .catch((error: unknown) => {
//           console.log(error);
//         });
//     }
//   }, [open]);
//   return (
//     <>
//       <Button variant="outlined" onClick={handleOpen}>
//         {mapKeys("Add a new goal")}
//       </Button>
//       <Dialog open={open} onClose={handleClose}>
//         <DialogTitle>{mapKeys("Generate a New Goal")}</DialogTitle>
//         <ToggleButtonGroup
//           color="primary"
//           value={showAutoGen}
//           exclusive
//           onChange={() => {
//             handleChange();
//             setSelectedHabit(undefined);
//             setSelectedStatistic(undefined);
//             setRelationType(undefined);
//           }}
//           aria-label="Platform"
//           sx={{ flex: 1, justifyContent: "center" }}
//         >
//           <ToggleButton value={false}> {mapKeys("Auto")} </ToggleButton>
//           <ToggleButton value={true}> {mapKeys("Manual")} </ToggleButton>
//         </ToggleButtonGroup>
//         {showAutoGen ? (
//           <DialogContent>
//             <TextField
              
//               margin="dense"
//               id="title"
//               label={mapKeys("Goal Title")}
//               type="text"
//               fullWidth
//               variant="outlined"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             <TextField
//               margin="dense"
//               id="description"
//               label={mapKeys("Goal Description")}
//               type="text"
//               fullWidth
//               variant="outlined"
//               multiline
//               rows={4}
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//             />
//           </DialogContent>
//         ) : (
//           <DialogContent sx={{ padding: 2 }}>
//             {allStatistics ? (
//               <Autocomplete
//                 id="statistics-autocomplete"
//                 options={allStatistics.filter(
//                   (statistic) =>
//                     statistic.values.length > 0 &&
//                     statistic.values[statistic.values.length - 1] > 0
//                 )}
//                 getOptionLabel={(option) => mapKeys(option.name)} // Assuming each statistic has a 'name' property
//                 inputValue={
//                   selectedStatistic ? mapKeys(selectedStatistic.name) : ""
//                 }
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label={mapKeys("Select Statistic")}
//                     variant="outlined"
//                   />
//                 )}
//                 onChange={(_, value: StatisticData | null) => {
//                   // value is the selected statistic or null
//                   setSelectedStatistic(value ? value : undefined);
//                   setSelectedHabit(undefined); // Ensure habit selection is cleared
//                 }}
//                 sx={{
//                   paddingBottom: 1,
//                 }}
//               />
//             ) : (
//               <Typography>{mapKeys("No statistics found")}</Typography>
//             )}
//             {habitItems ? (
//               <Autocomplete
//                 id="habits-autocomplete"
//                 options={habitItems}
//                 getOptionLabel={(option) => option.title} // Assuming each habit has a 'name' property
//                 inputValue={selectedHabit ? selectedHabit.title : ""}
//                 renderInput={(params) => (
//                   <TextField
//                     {...params}
//                     label={mapKeys("Select Habit")}
//                     variant="outlined"
//                   />
//                 )}
//                 onChange={(_, value: HabitItem | null) => {
//                   setSelectedHabit(value ? value : undefined);
//                   setSelectedStatistic(undefined);
//                 }}
//               />
//             ) : (
//               <Typography>No habits found</Typography>
//             )}
//             {selectedHabit && (
//               <Paper sx={{ padding: 2, marginTop: 2 }}>
//                 <Typography variant="h6">
//                   {mapKeys("Selected Habit")}
//                 </Typography>
//                 <Habit
//                     habit={selectedHabit}
//                     color={colors[0]}
//                     maxEntries={6}
//                     iconToUse={MapIconStringToIcon(selectedHabit.icon)}
//                     onCheck={() => { } }
//                     onDecrement={() => { } }
//                     openDetails={() => {
//                       navigate("/home/checklist");
//                     } } textColor={""}                />
//               </Paper>
//             )}
//             {selectedStatistic && (
//               <Paper sx={{ padding: 2, marginTop: 2 }}>
//                 <Typography variant="h6">
//                   {mapKeys("Selected Statistic")}
//                 </Typography>
//                 <StatisticCard
//                   statisticData={selectedStatistic}
//                   overrideSize={true}
//                   overridenWidth="width-full"
//                 />{" "}
//                 <ToggleButtonGroup
//                   color="primary"
//                   value={relationType}
//                   exclusive
//                   onChange={(_, value) => setRelationType(value)}
//                   aria-label="Platform"
//                   sx={{ flex: 1, justifyContent: "center", paddingTop: 2 }}
//                 >
//                   <ToggleButton value={RelationType.BIGGER}>
//                     {mapKeys("Increase this value!")}
//                   </ToggleButton>
//                   <ToggleButton value={RelationType.SMALLER}>
//                     {mapKeys("Lower this value!")}
//                   </ToggleButton>
//                 </ToggleButtonGroup>
//               </Paper>
//             )}
//           </DialogContent>
//         )}
//         <DialogActions>
//           <Button onClick={handleClose}>{mapKeys("Cancel")}</Button>
//           <Button
//             onClick={() => handleGenerate(relationType)}
//             color={
//               selectedHabit || selectedStatistic || (title && description)
//                 ? "primary"
//                 : "inherit"
//             }
//             variant="contained"
//             disabled={
//               !(
//                 (selectedStatistic &&
//                   (relationType === RelationType.SMALLER ||
//                     relationType === RelationType.BIGGER)) ||
//                 selectedHabit ||
//                 (title && description)
//               )
//             }
//           >
//             {mapKeys("Generate")}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </>
//   );
// };

// export default AutoGoalGenerator;
