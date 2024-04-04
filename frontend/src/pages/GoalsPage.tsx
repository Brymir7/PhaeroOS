// import { useEffect, useRef, useState } from "react";
// import { useApi } from "../modules/apiAxios";
// import Goal from "../components/goalsPage/Goal";
// import {
//   GoalType,
//   HabitItem,
//   StatisticData,
//   backendGoalType,
//   AutoCompletion,
//   RelationType,
//   isHabitBooleanProgress,
// } from "../components/goalsPage/types";
// import AutoGoalGenerator from "../components/goalsPage/GoalGenerator";
// import { Grid } from "@mui/material";
// import dayjs from "dayjs";
// function GoalPage() {
//   const [goals, setGoals] = useState<GoalType[]>([]);
//   const allHabits = useRef<HabitItem[]>([]);
//   const allStatistics = useRef<StatisticData[]>([]);
//   const hasModified = useRef(false);
//   const modifyGoal = (updatedGoal: GoalType) => {
//     const newGoals = goals.map((g) => {
//       if (g.id === updatedGoal.id) {
//         return updatedGoal;
//       }
//       return g;
//     });
//     setGoals(newGoals);
//     hasModified.current = true;
//   };

//   const api = useApi();

//   useEffect(() => {
//     Promise.all([api.get("/diagrams/list/"), api.get("/habits/")])
//       .then(([diagramsResponse, habitsResponse]) => {
//         // Process and set allStatistics and allHabits here
//         const statisticsData: StatisticData[] = Array.isArray(diagramsResponse.data)
//           ? diagramsResponse.data
//           : [];
//         allStatistics.current = statisticsData;

//         const updatedHabits = habitsResponse.data.habits.map((habit: HabitItem) => {
//           const lastRecordedDate = dayjs(habit.recorded_at);
//           const today = dayjs();
//           const deltaDays = today.diff(lastRecordedDate, "day");
//           if (isHabitBooleanProgress(habit.progress)) {
//             if (deltaDays > 0) {
//               for (let i = 0; i < deltaDays; i++) {
//                 habit.progress.progress.push(false);
//               }
//               habit.recorded_at = today.format("YYYY-MM-DD");
//             }
//           }
//           const currDay = Math.min(habit.progress.progress.length, deltaDays + 1);
//           return {
//             ...habit,
//             currDay,
//           };
//         });
//         allHabits.current = updatedHabits;
//         return api.get("/general_goals/");
//       })
//       .then((goalsResponse) => {
//         // Process and set goals here
//         if (goalsResponse.data.length === 0) {
//           setGoals([]);
//           return;
//         }
//         const backendGoals = goalsResponse.data;
//         const frontendGoals = convertBackendGoalsToFrontendGoals(
//           backendGoals,
//           allHabits.current,
//           allStatistics.current
//         );
//         setGoals(frontendGoals);
//       })
//       .catch((error) => {
//         console.log(error);
//       });
//   }, []);

//   function mapGoalsToGeneralGoals(goals: GoalType[]) {
//     return goals.map((goal) => ({
//       title: goal.title,
//       description: goal.description,
//       flags: goal.flags,
//       progress: goal.progress,
//       autoCompletion: goal.autoCompletion ? true : false, // Assuming autoCompletion is a boolean or undefined
//       relationType: goal.autoCompletion
//         ? goal.autoCompletion.relationType.toString()
//         : "", // You need to determine the appropriate value
//       numberGoals: goal.autoCompletion ? goal.autoCompletion.numberGoals : [], // Example mapping, adjust based on your logic
//       habit_ids: goal.habits ? goal.habits.map((habit) => habit.id) : [], // Assuming each habit has an id
//       statistic_ids: goal.statistic ? [goal.statistic.id] : [], // Assuming statistic has an id
//     }));
//   }
//   function convertBackendGoalsToFrontendGoals(
//     backendGoals: backendGoalType[],
//     temp_habits: HabitItem[],
//     temp_statistics: StatisticData[]
//   ): GoalType[] {
//     return backendGoals.map((goal) => {
//       // Mapping for AutoCompletion
//       let autoCompletion: AutoCompletion | undefined;
//       if (goal.autoComplete) {
//         autoCompletion = {
//           autoCompleteByStats: goal.autoComplete, // Assuming this maps directly to the backend's boolean
//           numberGoals: goal.numberGoals,
//           relationType: goal.relationType === "1" ? RelationType.BIGGER : RelationType.SMALLER,
//         };
//       }
//       // Convert habit_ids and statistic_ids to their respective objects
//       const habits = goal.habit_ids
//         .map((id) => temp_habits.find((habit) => habit.id === id))
//         .filter((habit) => habit !== undefined) as HabitItem[]; // Filter out undefined values and cast to HabitItem[]
//       const statistic = temp_statistics.find((stat) =>
//         goal.statistic_ids.includes(stat.id)
//       ); // Assuming only one statistic per goal
//       return {
//         id: goal.id,
//         title: goal.title,
//         description: goal.description,
//         flags: goal.flags,
//         progress: goal.progress,
//         autoCompletion: autoCompletion,
//         habits: habits,
//         statistic: statistic,
//       };

//     });
//   }
//   useEffect(() => {
//     if (hasModified.current) {
//       const backendTypedGoals = mapGoalsToGeneralGoals(goals);
//       console.log("SENDING GOALS: ", backendTypedGoals)
//       api.post("/general_goals/", backendTypedGoals).catch(() => {});
//       hasModified.current = false;
//     }
//   }, [goals]);
//   return (
//     <div>
//       <Grid
//         container
//         direction={"row"}
//         sx={{
//           overflowY: "auto",
//           maxHeight: "90vh",
//           overflowX: "hidden",
//           paddingBottom: "10px",
//         }}
//       >
//         {goals.map((goal) => (
//           <Grid item xs={12} md={6} xl={3}>
//             <Goal
//               key={goal.id}
//               modifyGoal={(goal: GoalType) => {
//                 modifyGoal(goal);
//               }}
//               deleteGoal={(goal: GoalType) => {
//                 setGoals(goals.filter((g) => g.id !== goal.id));
//                 hasModified.current = true;
//               }}
//               goal={goal}
//             />
//           </Grid>
//         ))}
//       </Grid>
//       <div className="p-5 flex justify-center align-middle">
//         <AutoGoalGenerator
//           addGoal={(goal: GoalType) => {
//             setGoals(goals.concat(goal));
//           }}
//         />
//       </div>
//     </div>
//   );
// }
// export default GoalPage;
