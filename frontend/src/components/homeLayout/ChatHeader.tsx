// import React, { useContext, useEffect, useState } from "react";
// import { Paper, Container, Box, Grid, MenuList, Button } from "@mui/material";
// import { useBadges } from "../contexts/BadgeContext";
// import { JournalNoteContext } from "../contexts/JournalNoteContext";
// import { MapKeyedButton } from "../utils/Buttons";
// import HeaderSearchBar from "./HeaderSearch";
// import { usePossibleRoutes } from "../contexts/PossiblesRoutesContext";

// const ChatHeader: React.FC = () => {
//   const { currentPage } = usePossibleRoutes();
//   const [, setShowBadge] = useState(false);
//   const { badges } = useBadges();
//   const { messagingView, setMessagingView } = useContext(JournalNoteContext);

//   const isThereActiveBadgeNotMatchingCurrentPath = (): boolean => {
//     return Object.values(badges).some(
//       (badge) => badge.active && badge.path !== window.location.pathname
//     );
//   };

//   useEffect(() => {
//     setShowBadge(isThereActiveBadgeNotMatchingCurrentPath());
//   }, [badges, window.location.pathname]);
//   const [isSearching, setIsSearching] = useState(false);
//   return (
//     <Paper
//       elevation={2}
//       className="flex w-full h-18 p-2 gap-2 justify-center items-center"
//     >
//       {!isSearching && currentPage === "Dashboard" && (
//         <div className="">
//           <MapKeyedButton
//             variant="outlined"
//             color="primary"
//             minHeigth="60px"
//             onClick={() => setMessagingView(!messagingView)}
//             text={messagingView ? "Daily Entry" : "Chat"}
//           />
//         </div>
//       )}
//       <HeaderSearchBar setIsSearching={setIsSearching} isSearching={isSearching} />
//       {isSearching && (
//         <MapKeyedButton
//           variant="outlined"
//           color="primary"
//           minHeigth="60px"
//           minWidth="50%"
//           onClick={() => {
//             setIsSearching(false);
//           }}
//           text={"Close"}
//         />
//       )}
//     </Paper>
//   );
// };

// export default ChatHeader;
