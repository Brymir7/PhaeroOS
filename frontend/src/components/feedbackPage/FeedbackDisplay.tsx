// import React, { useContext, useEffect, useState } from "react";
// import { FeedbackData } from "../../pages/FeedbackPage";
// import { AnimatePresence, motion } from "framer-motion";
// import AdviceWithCards from "./AdviceWithCards";
// import { Collapse, Paper } from "@mui/material";
// import FeedbackDeltaInformation from "./FeedbackDeltaInformation";
// import FeedbackGoals from "./FeedbackGoals";
// import { MapKeysContext } from "../contexts/MapKeysContext";
// import useEmblaCarousel from "embla-carousel-react";
// import { DotButton, useDotButton } from "./CarouselDotButton";
// import {
//   PrevButton,
//   NextButton,
//   usePrevNextButtons,
// } from "./CarouselArrowButtons";

// interface Props {
//   feedbackData: FeedbackData;
//   index: number;
//   opened: boolean;
//   setOpened: () => void;
// }

// function FeedbackDisplay({ feedbackData, opened, setOpened, index }: Props) {
//   const { mapKeys, language } = useContext(MapKeysContext);
//   const [displayedTitel, setDisplayedTitle] = React.useState<string>("");
//   const [sortedFeedbackKeys, setSortedFeedbackKeys] = useState<string[]>([]);
//   const [displayedComponent, setDisplayedComponent] = useState<JSX.Element>(
//     <></>
//   );
//   const titels: { [key: string]: string } = {
//     weekly_summary: mapKeys("Weekly Summary"),
//     tasks_text: mapKeys("Tasks"),
//     advice_best_days: mapKeys("Best Days"),
//     advice_worst_days: mapKeys("Worst Days"),
//     weekly_delta: mapKeys("Weekly Difference"),
//     advice_on_goals: mapKeys("Your Goal"),
//   };
//   const sortingOrder = [
//     "weekly_summary",
//     "advice_best_days",
//     "advice_worst_days",
//     "tasks_text",
//     "weekly_delta_information",
//     "advice_on_goals",
//   ];
//   const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

//   const { selectedIndex, scrollSnaps, onDotButtonClick } =
//     useDotButton(emblaApi);

//   const {
//     prevBtnDisabled,
//     nextBtnDisabled,
//     onPrevButtonClick,
//     onNextButtonClick,
//   } = usePrevNextButtons(emblaApi);

//   function formatUTCDateToLocaleString(dateString: string): string {
//     const date = new Date(dateString);
//     const options: Intl.DateTimeFormatOptions = {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     };
//     const locale = language === "german" ? "de-DE" : "en-US";
//     return new Intl.DateTimeFormat(locale, options).format(date);
//   }

//   const titleVariants = {
//     initial: { y: -10, opacity: 0 },
//     animate: {
//       y: 0,
//       opacity: 1,
//       transition: { duration: 0.25, ease: "easeOut" },
//     },
//     exit: { y: 5, opacity: 0, transition: { duration: 0.2 } },
//   };

//   const calculateStepCount = () => {
//     const newSortedFeedbackKeys: string[] = [];

//     // Iterate over each key-value pair in the object
//     sortingOrder.forEach((key) => {
//       // Check if the value is a string and not empty
//       if (typeof feedbackData[key] === "string" && feedbackData[key] !== "") {
//         newSortedFeedbackKeys.push(key);
//       }
//     });

//     setSortedFeedbackKeys(newSortedFeedbackKeys);
//   };

//   useEffect(() => {
//     calculateStepCount();
//   }, []);

//   useEffect(() => {
//     if (!opened) {
//       setDisplayedTitle("");
//       onDotButtonClick(0);
//     } else {
//       setDisplayedTitle(titels[sortedFeedbackKeys[selectedIndex]] || "");
//     }
//   }, [selectedIndex, opened]);

//   useEffect(() => {
//     if (!opened) setDisplayedComponent(<></>);
//     setDisplayedComponent(
//       <>
//         {sortedFeedbackKeys.map((key) => (
//           <div
//             className="embla__slide flex h-[400px] items-center justify-center"
//             key={key}
//           >
//             <RenderStep name={key} />
//           </div>
//         ))}
//       </>
//     );
//   }, [sortedFeedbackKeys, opened]);

//   const RenderStep = ({ name }: { name: string }) => {
//     let component;
//     switch (name) {
//       case "weekly_summary":
//         component = (
//           <AdviceWithCards
//             manualMaxChars={150}
//             adviceText={feedbackData.weekly_summary}
//             handleEndOfCards={() => onNextButtonClick()}
//           />
//         );
//         break;
//       case "advice_best_days":
//         component = (
//           <AdviceWithCards
//             adviceText={feedbackData.advice_best_days}
//             handleEndOfCards={() => onNextButtonClick()}
//             manualMaxChars={150}
//           />
//         );
//         break;
//       case "advice_worst_days":
//         component = (
//           <AdviceWithCards
//             manualMaxChars={150}
//             adviceText={feedbackData.advice_worst_days}
//             handleEndOfCards={() => onNextButtonClick()}
//           />
//         );
//         break;
//       case "weekly_delta_information":
//         component = (
//           <FeedbackDeltaInformation
//             text={feedbackData.weekly_delta_information}
//             diagramData={feedbackData.weekly_delta_diagram_data}
//           />
//         );
//         break;
//       case "advice_on_goals":
//         component = <FeedbackGoals text={feedbackData.advice_on_goals} />;
//         break;
//       case "tasks_text":
//         component = (
//           <AdviceWithCards
//             adviceText={feedbackData.tasks_text + "\n" + mapKeys("Phaero has also created some checklist items for you. Check them out!")}
//             handleEndOfCards={() => onNextButtonClick()}
//             manualMaxChars={150}
//           />
//         );
//         break;
//       default:
//         component = null;
//     }

//     return <>{component}</>;
//   };

//   return (
//     <Paper elevation={2} className=" w-full px-4 xsm:px-6 py-4 overflow-hidden ">
//       <div
//         onClick={setOpened}
//         className="flex items-center font-roboto cursor-pointer pb-2 "
//       >
//         <AnimatePresence mode="wait">
//           <motion.h2
//             key={displayedTitel} // Important for AnimatePresence to detect changes
//             variants={titleVariants}
//             initial="initial"
//             animate="animate"
//             exit="exit"
//             className={`text-2xl ${opened ? "pb-4": ""}`}
//           >
//             {displayedTitel === ""
//               ? `${mapKeys("Week")} ${index + 1}`
//               : displayedTitel}
//           </motion.h2>
//         </AnimatePresence>
// {!opened &&        <p className="text-gray-700 text-lg ml-auto">
//           {formatUTCDateToLocaleString(feedbackData.recorded_at)}
//         </p>}
//       </div>
//       <Collapse in={opened} className="w-full ">
//         <section className="embla">
//           <div className="embla__viewport" ref={emblaRef}>
//             <div className="embla__container pb-5">{displayedComponent}</div>
//           </div>
//           <div className="embla__controls">
//             <div className="embla__buttons">
//               <PrevButton
//                 onClick={onPrevButtonClick}
//                 disabled={prevBtnDisabled}
//               />
//               <NextButton
//                 onClick={onNextButtonClick}
//                 disabled={nextBtnDisabled}
//               />
//             </div>

//             <div className="embla__dots">
//               {scrollSnaps.map((_: unknown, index: number) => (
//                 <DotButton
//                   key={index}
//                   onClick={() => onDotButtonClick(index)}
//                   className={"embla__dot".concat(
//                     index === selectedIndex ? " embla__dot--selected" : ""
//                   )}
//                 />
//               ))}
//             </div>
//           </div>
//         </section>
//       </Collapse>
//     </Paper>
//   );
// }

// export default FeedbackDisplay;
