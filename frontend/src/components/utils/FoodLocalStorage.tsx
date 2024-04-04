interface FoodItem {
  portion_size: string;
}

export const addFoodToMostUsedLocalStorage = (foodName: string) => {
  const searchListKey = "searchedFoods";
  let searchedFoods: string[] = JSON.parse(
    localStorage.getItem(searchListKey) ?? "[]"
  );
  searchedFoods = searchedFoods.filter((item) => item !== foodName);
  searchedFoods.unshift(foodName);
  searchedFoods = searchedFoods.slice(0, 20);
  localStorage.setItem(searchListKey, JSON.stringify(searchedFoods));
};
export const getMostUsedLocalStorage = () : string[] =>{
  const storedData = localStorage.getItem("searchedFoods") ?? "[]";
  return JSON.parse(storedData);
};

export const addFoodPortionToLocalStorage = (selectedFood: string, grams: number) => {
  const foodItem: FoodItem = { portion_size: grams.toString() };
  localStorage.setItem(selectedFood, JSON.stringify(foodItem));
};
export const getFoodPortionFromLocalStorage = (foodName: string) : string | null => {
  const foodItem = localStorage.getItem(foodName);
  if (foodItem) {
    return (JSON.parse(foodItem) as FoodItem).portion_size;
  }
  return null;
};
