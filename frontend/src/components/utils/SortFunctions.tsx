export function sortStringsByOverlap(
  searchTerm: string,
  inputList: string[],
  filterNoOverlap = false
): string[] {
  // Convert the search term to lower case for case-insensitive comparison
  const lowerCaseSearchTerm = searchTerm.toLowerCase();
  const searchTermLength = lowerCaseSearchTerm.length;

  // Function to calculate overlap based on starting substring matching (case-insensitive)
  function calculateOverlap(str: string): number {
    return str.toLowerCase().startsWith(lowerCaseSearchTerm) ? searchTermLength : 0;
  }

  // Filter out strings without overlap
  if (filterNoOverlap) {
    inputList = inputList.filter((item) => calculateOverlap(item) > 0);
  }

  // Sort the list based on overlap with the search term
  return [...inputList].sort((a, b) => {
    const overlapA = calculateOverlap(a) / a.length;
    const overlapB = calculateOverlap(b) / b.length;
    return overlapB - overlapA; // Descending order
  });
}
