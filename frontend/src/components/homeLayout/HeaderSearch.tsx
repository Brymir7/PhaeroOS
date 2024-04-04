// import React, { useContext, useState } from "react";
// import {
//   TextField,
//   InputAdornment,
//   List,
//   ListItemText,
//   Divider,
//   ListItemButton,

// } from "@mui/material";
// import { useTheme } from "@mui/material/styles";
// import { Layout, usePossibleRoutes } from "../contexts/PossiblesRoutesContext";
// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faSearch } from "@fortawesome/free-solid-svg-icons";
// import GreenPaper from "../utils/GreenPaper";
// import { MapKeysContext } from "../contexts/MapKeysContext";
// interface Props {
//   setIsSearching: (isSearching: boolean) => void;
//   isSearching: boolean;
// }

// const HeaderSearch: React.FC<Props> = ({ setIsSearching, isSearching }) => {
//   const { setCurrentLayout, navigateToPage, primaryRoutes, secondaryRoutes, currentPage } =
//     usePossibleRoutes();
//   const [searchTerm, setSearchTerm] = useState("");
//   const theme = useTheme();

//   const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(event.target.value);
//   };

//   const handlePrimaryItemClick = (layout: Layout) => {
//     setCurrentLayout(layout);
//   };

//   const filteredPrimaryRoutes = primaryRoutes.filter((route) =>
//     route.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const handleFocus = () => {
//     setIsSearching(true);
//   };

//   const {mapKeys} = useContext(MapKeysContext);

  
//   return(
//     <div>
//       <TextField
//         fullWidth
//         variant="outlined"
//         placeholder={mapKeys("Show me ...")}
//         value={searchTerm}
//         onChange={handleInputChange}
//         onFocus={handleFocus}
//         InputProps={{
//           startAdornment: (
//             <InputAdornment position="start">
//               <FontAwesomeIcon
//                 size="lg"
//                 icon={faSearch}
//                 color={theme.palette.primary.main}
//               />
//             </InputAdornment>
//           ),
//         }}
//       />
//       {isSearching && (
//         <GreenPaper
//           sx={{
//             position: "absolute", // Now fixed positioning
//             zIndex: 2, // Ensure it is above other content
//             display: "flex",
//             marginTop: "10px",
//             background: "white", // Ensure readability
//             left: 0, // Align with the left edge of the viewport
//             width: "99.5%", // Set width to be 100% of the viewport width
//             boxSizing: "border-box", // Include padding and borders in the element's total width
//           }}
//         >
//           {currentPage === "Dashboard" && (
//             <>
//               <List aria-label="primary menu" className="overflow-y-auto max-h-[50vh]" sx={{flex: 1, color: theme.palette.primary.main}}>
//                 {filteredPrimaryRoutes.map((text, index) => (
//                   <div key={index}>
//                     <ListItemButton
//                       onClick={(e) => {
//                         e.stopPropagation();
//                         e.preventDefault();
//                         handlePrimaryItemClick(text);
//                         setIsSearching(false);
//                       }}
//                     >
//                       <ListItemText primary={text} />
//                     </ListItemButton>
//                     {index < primaryRoutes.length - 1 && <Divider />}
//                   </div>
//                 ))}
//               </List>
//               <Divider
//                 orientation="vertical"
//                 flexItem
//                 sx={{
//                   backgroundColor: theme.palette.secondary.main,
//                   margin: "0 8px",
//                 }}
//               />
//             </>
//           )}
//           <List
//             component="nav"
//             aria-label="secondary menu"
//             sx={{ flex: 1, color: theme.palette.secondary.main }}
//           >
//             {secondaryRoutes.map((item, index) => (
//               <div key={index}>
//                 <ListItemButton
//                   onClick={(e) => {
//                     e.stopPropagation();
//                     navigateToPage(item.route);
//                     setIsSearching(false);
//                   }}
//                   className="flex gap-3"
//                 >
//                   <FontAwesomeIcon icon={item.icon} />
//                   <ListItemText primary={item.text} />
//                 </ListItemButton>
//                 {index < secondaryRoutes.length - 1 && <Divider />}
//               </div>
//             ))}
//           </List>
//         </GreenPaper>
//       )}

//     </div>
//   );
// };

// export default HeaderSearch;
