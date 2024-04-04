// import { StatisticData, GoalType, RelationType, HabitItem, isHabitBooleanProgress, isHabitNumberProgress } from "./types";
// const mapKeys = (key: string) => key;

// export function convertStatisticToGoal(
//   data: StatisticData,
//   relationType: RelationType,
//   amountOfGoals: number
// ): GoalType {
//   // Determine the starting value from the StatisticData
//   const startValue = data.values[data.values.length - 1]; // Assuming the last value is the most recent one
//   let increment: number;

//   // Calculate increment based on the relation type and amount of goals
//   if (relationType === RelationType.BIGGER) {
//     increment = 0.95; // Example increment for BIGGER, adjust accordingly
//   } else {
//     increment = 1.05; // Example decrement for SMALLER, adjust accordingly
//   }
//   const flags = [];
//   const numberGoals = [];

//   for (let i = 0; i < amountOfGoals; i++) {
//     const targetValue = startValue * Math.pow(increment, -i);
//     flags.push(`${targetValue.toFixed(1)}`); // Formatting flag as a string with the target value
//     numberGoals.push(targetValue);
//   }
//   // Assuming the creation of a new goal or updating an existing one
//   const newGoal: GoalType = {
//     id: Date.now(), // Placeholder for unique ID
//     title: data.name,
//     description: `${mapKeys("Achieving new targets for ")}${data.name}`,
//     flags: flags,
//     progress: new Array(amountOfGoals).fill(false), // Initializing progress as false for each goal
//     autoCompletion: {
//       autoCompleteByStats: true,
//       numberGoals: numberGoals,
//       relationType: relationType,
//     },
//     statistic: data,
//   };
//   return newGoal;
// }
// export function convertHabitItemToGoal(
//   habitItem: HabitItem,
//   amountOfGoals: number
// ): GoalType {
//   let totalCompletions = 0;
//   if (isHabitBooleanProgress(habitItem.progress)) {
//     totalCompletions = habitItem.progress.progress.filter(Boolean).length;
//   }
//   if (isHabitNumberProgress(habitItem.progress)) {
//     totalCompletions = habitItem.progress.progress.reduce((a, b) => a + b, 0);
//   }
//   let milestones: number[] = [];

//   if (totalCompletions < 10) {
//     // For new habits, focus on critical early milestones to encourage persistence
//     milestones = [7, 14, 21, 30]; // Days that correspond to one week, two weeks, three weeks, and one month
//     // Ensure we have the desired amount of goals, filling the rest with progressively spaced milestones
//     let nextMilestone = 30;
//     for (let i = milestones.length; i < amountOfGoals; i++) {
//       nextMilestone += 15 + i * 5; // Gradually increase the gap between milestones
//       milestones.push(nextMilestone);
//     }
//   } else {
//     // For habits already past the initial phase, calculate milestones normally
//     let nextMilestone = Math.ceil(totalCompletions / 30) * 30;
//     nextMilestone += 30; // Start with the next month as the first milestone
//     let increment = 30; // Start with a month increment
//     for (let i = 0; i < amountOfGoals; i++) {
//       milestones.push(nextMilestone);
//       increment = Math.max(15, increment - 5); // Decrease increment but not below 15 days
//       nextMilestone += increment;
//     }
//   }

//   const flags = milestones.map(
//     (milestone) => `${milestone} completions of ${habitItem.title}`
//   );
//   const numberGoals = milestones;
//   const goal: GoalType = {
//     id: habitItem.id,
//     title: mapKeys("Build habit ")+habitItem.title,
//     description:mapKeys(`Target milestones for the` + `${habitItem.title}` + mapKeys("habit to foster consistency and overcome early challenges. Currently completed a total of ") + `${totalCompletions}` + mapKeys(`days.`)),
//     flags,
//     progress: new Array(flags.length).fill(false),
//     autoCompletion: {
//       autoCompleteByStats: true,
//       numberGoals,
//       relationType: RelationType.BIGGER,
//     },
//     habits: [habitItem],
//   };

//   return goal;
// }
