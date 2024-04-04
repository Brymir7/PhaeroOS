// // import FeedbackCard from "../components/feedbackPage/FeedbackCard";
// import { useContext, useEffect, useState } from "react";
// import { useApi } from "../modules/apiAxios";
// import { MapKeysContext } from "../components/contexts/MapKeysContext";
// import FeedbackIcon from "../assets/notes.svg";
// import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
// import { AuthContext } from "../components/contexts/AuthContext";
// import FeedbackDisplay from "../components/feedbackPage/FeedbackDisplay";
// import FeedbackButton from "../components/feedbackPage/FeedbackButton";
// import GrowAppear from "../components/animations/GrowAppear";
// import { Collapse, Paper } from "@mui/material";
// import ReflectionSurvey from "../components/feedbackPage/ReflectionSurvey";
// import TutorialStep from "../components/utils/TutorialStep";
// import { DeltaDiagramData } from "../components/feedbackPage/FeedbackDeltaInformation";
// export interface FeedbackData {
//   [key: string]: unknown;
//   tasks_text: string;
//   weekly_summary: string;
//   recorded_at: string;
//   weekly_delta_information: string;
//   weekly_delta_diagram_data: DeltaDiagramData | undefined;
//   advice_best_days: string;
//   advice_worst_days: string;
//   advice_on_goals: string;
// }
// export interface FormattedFeedbackItem {
//   heading: boolean;
//   text: string;
//   title?: string;
// }
// interface FeedbackButtonData {
//   progress: number;
//   feedbackRequirement: number;
// }
// function FeedbackPage() {
//   const [feedbackData, setFeedbackData] = useState<FeedbackData[]>([]);
//   const [feedbackState, setFeedbackState] = useState<FeedbackButtonData>({
//     progress: 0,
//     feedbackRequirement: 7,
//   }); //true if feedback is required
//   const [shownFeedbackIndex, setShownFeedbackIndex] = useState<number>(-1);
//   const [isLoading, setIsLoading] = useState<boolean>(false);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [surveyAnswer, setSurveyAnswer] = useState<string>("");
//   const { mapKeys } = useContext(MapKeysContext);
//   const { handleAllErrors } = useContext(HandleAllErrorsContext);
//   const { hasAccess } = useContext(AuthContext);

//   useEffect(() => {
//     if (hasAccess) initialLoad();
//   }, [hasAccess]);

//   const api = useApi();

//   const initialLoad = async () => {
//     api
//       .get("/predictions/feedback/")
//       .then((response) => {
//         setFeedbackData(response.data);
//         setLoading(false);
//       })
//       .catch((error) => {
//         handleAllErrors(error);
//       });
//     api
//       .get("/predictions/feedback_status/")
//       .then((response) => {
//         setFeedbackState(response.data);
//       })
//       .catch((error) => {
//         handleAllErrors(error);
//       });
//   };

//   const giveFeedback = () => {
//     const apiEndpoint = "/predictions/feedback/";
//     api
//       .post(apiEndpoint, { reflection: surveyAnswer })
//       .then(() => {
//         setIsLoading(false);
//         initialLoad();
//       })
//       .catch((error) => {
//         handleAllErrors(error);
//       });
//   };

//   return (
//     <div className="w-full h-full flex flex-col flex-grow items-center max-w-xl xl:max-w-2xl xl:py-4 mx-auto mt-1 overflow-y-auto pb-8">
//       <TutorialStep
//         step={4}
//         extraClasses="flex flex-col space-y-1 w-full rounded-md pb-2"
//       >
//         <GrowAppear index={0}>
//           <Paper
//             elevation={2}
//             className="font-roboto text-xl min-w-fit px-6 py-4"
//           >
//             {mapKeys("Claim your feedback here")}
//           </Paper>
//         </GrowAppear>
//         <GrowAppear index={1}>
//           <Paper
//             elevation={2}
//             className="flex flex-col items-center py-3 w-full"
//           >
//             <FeedbackButton
//               isLoading={isLoading}
//               setIsLoading={setIsLoading}
//               daysLeft={
//                 feedbackState.feedbackRequirement - feedbackState.progress
//               }
//               giveFeedback={giveFeedback}
//               surveyCompleted={surveyAnswer !== ""}
//             />
//             <Collapse
//               in={
//                 feedbackState.feedbackRequirement - feedbackState.progress <=
//                 0 && !isLoading
//               }
//             >
//               <ReflectionSurvey setSurveyAnswer={setSurveyAnswer} />
//             </Collapse>
//           </Paper>
//         </GrowAppear>
//       </TutorialStep>
//       <div className="w-full h-full flex flex-col flex-grow items-center">
//         {!loading && (
//           <>
//             {feedbackData.length === 0 ? (
//               <GrowAppear extraClasses="flex w-full h-full" index={2}>
//                 <Paper
//                   elevation={2}
//                   className="flex items-center justify-center w-full flex-grow px-4"
//                 >
//                   <div className="flex flex-col items-center space-y-2">
//                     <img className="" src={FeedbackIcon} alt="feedback" />

//                     <p className="text-lg">{mapKeys("No feedback found")}</p>
//                     <p className="text-center text-gray-700">
//                       {mapKeys(
//                         "Keep using Phaero to receive your first feedback"
//                       )}
//                     </p>
//                   </div>
//                 </Paper>
//               </GrowAppear>
//             ) : (
//               <div className="flex flex-col w-full pb-24  max-h-[65vh]">
//                 {feedbackData.map((data: FeedbackData, index: number) => (
//                   <GrowAppear
//                     index={index + 2}
//                     extraClasses="w-full my-1"
//                     key={index}
//                   >
//                     <FeedbackDisplay
//                       index={feedbackData.length - index - 1}
//                       feedbackData={data}
//                       opened={shownFeedbackIndex === index}
//                       setOpened={() => {
//                         if (shownFeedbackIndex === index) {
//                           setShownFeedbackIndex(-1);
//                         } else {
//                           setShownFeedbackIndex(index);
//                         }
//                       }}
//                     />
//                   </GrowAppear>
//                 ))}
//               </div>
//             )}
//           </>
//         )}
//       </div>
//     </div>
//   );
// }

// export default FeedbackPage;
