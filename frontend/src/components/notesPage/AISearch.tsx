// import { Autocomplete, Button, CircularProgress, TextField } from '@mui/material';
// import React, { useState } from 'react';
// interface Note {
//   date: string;
//   note: string;
//   wellbeingScore: number;
//   sleepQuality: number;
//   tags: string[];
// }

// interface JournalQueryComponentProps {
//   entries: Note[];
//   onQuerySubmit: (query: string) => void;
// }

// const JournalQueryComponent: React.FC<JournalQueryComponentProps> = ({ entries, onQuerySubmit }: JournalQueryComponentProps) => {
//   const [query, setQuery] = useState('');
//   const [isLoading, setIsLoading] = useState(false);

//   const premadePrompts = [
//     'What were my insights on a specific date?',
//     'How was my sleep quality last week?',
//     'What tags did I use most frequently?',
//     // Add more premade prompts as needed
//   ];

//   const handleQueryChange = (event: React.ChangeEvent<{}>, value: string | null) => {
//     setQuery(value || '');
//   };

//   const handleSubmit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     setIsLoading(true);
//     await onQuerySubmit(query);
//     setIsLoading(false);
//   };

//   return (
//     <div className="bg-white p-4 rounded shadow">
//       <h2 className="text-2xl font-bold mb-4">Query Journal Entries</h2>
//       <form onSubmit={handleSubmit}>
//         <Autocomplete
//           freeSolo
//           options={premadePrompts}
//           value={query}
//           onChange={handleQueryChange}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               label="Enter your query or select a prompt"
//               variant="outlined"
//               fullWidth
//               className="mb-4"
//             />
//           )}
//         />
//         <Button
//           type="submit"
//           variant="contained"
//           color="primary"
//           disabled={isLoading}
//           className="relative"
//         >
//           {isLoading && (
//             <CircularProgress
//               size={24}
//               className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
//             />
//           )}
//           <span className={isLoading ? 'opacity-0' : ''}>Submit Query</span>
//         </Button>
//       </form>
//     </div>
//   );
// };

// export default JournalQueryComponent;
