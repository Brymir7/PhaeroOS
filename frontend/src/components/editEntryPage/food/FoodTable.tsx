import React, { useContext, useEffect, useRef, useState } from "react";
import {
  TableRow,
  Box,
  TableCell,
  IconButton,
  Collapse,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableContainer,
  Input,
  InputAdornment,
  Button,
  useTheme,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleUp } from "@fortawesome/free-solid-svg-icons";
import { Edit2, Trash } from "iconsax-react";
import { EntryData } from "../../../pages/EditEntryPage";
import ProgressBar from "./ProgressBar";
import {
  useFormattedFoodName,
  useNumberValidation,
} from "../../utils/CustomHooks";
import { MapKeysContext } from "../../contexts/MapKeysContext";
import PortionSizeDialog from "./PortionSizeDialog";

interface Props {
  data: EntryData;
  viewOnly: boolean;
  updateTotalMacros: (newFoodList: { [key: string]: any }) => void;
  recommendations: { [key: string]: [number, string] };
  deleteFood: (item: string) => void;
}

export const CollapsibleTable: React.FC<Props> = ({
  data,
  viewOnly,
  updateTotalMacros,
  deleteFood,
  recommendations,
}) => {
  const [portionSizes, setPortionSizes] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    const newPortionSizes = Object.entries(data.result.Food.FoodList).reduce(
      (acc, [name, values]) => {
        acc[name] = portionSizes[name] || values.Macros.amount[0];
        return acc;
      },
      {} as { [key: string]: number }
    );
    setPortionSizes(newPortionSizes);
  }, [data.result.Food.FoodList]);

  const onEdit = (newAmount: number, item: string | number) => {
    const itemData = data.result.Food.FoodList[item];
    const ratio = newAmount / itemData.Macros.amount[0];

    const calculateNewValue = (originalValue: number) =>
      parseFloat((originalValue * ratio).toFixed(4));

    const updatedNutrients = [
      "protein",
      "fat",
      "carbs",
      "sugar",
      "calories",
    ].reduce((acc, nutrient) => {
      acc[nutrient] = [
        calculateNewValue(itemData.Macros[nutrient][0]),
        itemData.Macros[nutrient][1],
      ];
      return acc;
    }, {} as { [key: string]: [number, string] });

    if (
      updatedNutrients.protein[0] > 0 ||
      updatedNutrients.fat[0] > 0 ||
      updatedNutrients.carbs[0] > 0
    ) {
      updatedNutrients.calories = [
        updatedNutrients.protein[0] * 4 +
        updatedNutrients.carbs[0] * 4 +
        updatedNutrients.fat[0] * 9,
        "kcal",
      ];
    }

    const updatedMicros = Object.entries(itemData.Micros).reduce(
      (acc, [micro, value]) => {
        acc[micro] = [calculateNewValue(value[0]), value[1]];
        return acc;
      },
      {} as { [key: string]: [number, string] }
    );

    updatedNutrients.amount = [newAmount, itemData.Macros.amount[1]];

    const updatedData = JSON.parse(JSON.stringify(data));
    updatedData.result.Food.FoodList[item].Macros = updatedNutrients;
    updatedData.result.Food.FoodList[item].Micros = updatedMicros;
    updateTotalMacros(updatedData.result.Food.FoodList);
  };

  const onDelete = (item: string) => {
    const updatedData = { ...data };
    delete updatedData.result.Food.FoodList[item];
    delete data.result.Food.FoodList[item];
    updateTotalMacros(updatedData.result.Food.FoodList);
    deleteFood(item);
  };

  return (
    <TableContainer>
      <Table aria-label="collapsible table">
        <TableHead />
        <TableBody>
          <RenderFoodTableRow
            name="Total"
            values={{
              ...data.result.Nutrition.Total.Macros,
              ...data.result.Nutrition.Total.Micros,
            }}
            onEdit={onEdit}
            viewOnly={true}
            total={true}
            totalCalories={data.result.Nutrition.Total.Macros.calories[0]}
            recommendations={recommendations}
            onDelete={() => { }}
            lastIndex={false}
          />
          {Object.entries(data.result.Food.FoodList)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, values], index, array) => (
              <RenderFoodTableRow
                key={name}
                name={name}
                values={values.Macros}
                onEdit={onEdit}
                viewOnly={viewOnly}
                totalCalories={data.result.Nutrition.Total.Macros.calories[0]}
                portionSize={portionSizes[name] || 100}
                recommendations={recommendations}
                onDelete={onDelete}
                lastIndex={index === array.length - 1}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface RowProps {
  name: string;
  values: { [key: string]: [number, string] };
  onEdit: (newAmount: number, item: string) => void;
  onDelete: (item: string) => void;
  viewOnly: boolean;
  total?: boolean;
  totalCalories: number;
  portionSize?: number;
  recommendations: { [key: string]: [number, string] };
  lastIndex: boolean;
}

const RenderFoodTableRow: React.FC<RowProps> = ({
  name,
  values,
  onEdit,
  onDelete,
  viewOnly,
  total = false,
  totalCalories,
  recommendations,
  lastIndex,
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<number | string>();
  const [openFoodSizeDialog, setOpenFoodSizeDialog] = useState(false);

  const formatFoodName = useFormattedFoodName();
  const inputRef = useRef<HTMLInputElement>(null);
  const { mapKeys } = useContext(MapKeysContext);
  const theme = useTheme();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const handleEdit = () => {
    if (viewOnly) return;
    if (!editing) {
      setEditValue(roundNum(values.amount[0]));
      setEditing(true);
    } else {
      if (
        editValue !== values.amount[0] &&
        Number(editValue) > 0 &&
        editValue !== "" &&
        !isNaN(Number(editValue))
      ) {
        onEdit(Number(editValue), name);
      }
      setEditing(false);
    }
  };

  const roundNum = (num: string | number) => {
    if (/^\d+\.$/.test(num.toString())) {
      return num;
    }
    return parseFloat(Number(num).toFixed(2));
  };

  const windowWidth = window.innerWidth;

  const renderNutrientRow = (nutrient: string, label: string) => (
    <TableRow>
      <TableCell component="th" scope="row">
        {mapKeys(label)}
      </TableCell>
      <TableCell align="right" sx={{ display: "flex" }}>
        <span className="min-w-16">
          {roundNum(values[nutrient]?.[0] || 0)} {values[nutrient]?.[1]}
          {total && (
            <ProgressBar
              value={values[nutrient] || [0, "g"]}
              recommendation={recommendations[nutrient]}
            />
          )}
        </span>
      </TableCell>
    </TableRow>
  );
  const calculateCaloriePercentage = () => {
    if (total) return 100;
    const totalCal = totalCalories;
    return Math.min((values.calories[0] / totalCal) * 100, 100);
  };
  return (
    <>
      <PortionSizeDialog
        open={openFoodSizeDialog}
        onClose={() => setOpenFoodSizeDialog(false)}
        initialPortionSize={roundNum(values.amount[0]) as number}
        onSave={(newPortionSize) => {
          onEdit(newPortionSize, name);
          setOpenFoodSizeDialog(false);
        }}
      />
      <TableRow
        onClick={() => setOpen(!open)}
        sx={{
          cursor: "pointer",
          "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.06)" },
        }}
      >
        <TableCell sx={{ width: "40px", height: "40px", padding: "0 5px" }}>
          <IconButton
            sx={{ width: "30px", height: "40px" }}
            size="small"
            onClick={() => setOpen(!open)}
          >
            <div
              className={`transition-all duration-200 ${open ? "rotate-180" : "rotate-0"
                }`}
            >
              <FontAwesomeIcon icon={faAngleUp} />
            </div>
          </IconButton>
        </TableCell>
        <TableCell
          sx={{
            padding: "15px 5px 15px 0",
            fontSize: windowWidth > 768 ? "24px" : "16px",
          }}
          component="th"
          scope="row"
        >
          {formatFoodName(name).substring(0, 30) +
            (formatFoodName(name).length > 30 ? "..." : "")}
          <div className="flex items-center mb-1">
            <Typography variant="body2" sx={{ mr: 1 }}>
              {roundNum(values.calories[0])} kcal
            </Typography>

            {!total && (
              <Typography variant="caption" color="textSecondary">
                ({calculateCaloriePercentage().toFixed(1)}%)
              </Typography>
            )}
          </div>
        </TableCell>
        <TableCell
          sx={{ padding: "0 5px", fontSize: "16px" }}
          component="th"
          scope="row"
        >
          <div className="flex justify-end">
            {!total && (
              <div
                onClick={(e) => {
                  if (viewOnly) return;
                  e.stopPropagation();
                  handleEdit();
                }}
                className="cursor-pointer flex items-center"
              >
                {editing ? (
                  <div className="flex">
                    <Input
                      spellCheck={false}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEdit();
                        if (e.key === "Escape") setEditing(false);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="0"
                      value={editValue}
                      onChange={(e) => {
                        const newValue = useNumberValidation(e.target.value);
                        newValue !== undefined && setEditValue(newValue);
                      }}
                      onBlur={handleEdit}
                      autoFocus
                      sx={{
                        borderRadius: "4px",
                        px: 1,
                        width: "80px",
                        border: "1px solid #ddd",
                        "&::before": {
                          transform: "scaleX(0)",
                          left: "2.5px",
                          right: "2.5px",
                          bottom: 0,
                          top: "unset",
                          transition:
                            "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
                          borderRadius: 0,
                        },
                        "&:focus-within::before": {
                          transform: "scaleX(1)",
                        },
                      }}
                      error={editValue === 0 || editValue === ""}
                      endAdornment={
                        <InputAdornment position="end">
                          {values.amount[1].toLowerCase()}
                        </InputAdornment>
                      }
                    />
                  </div>
                ) : !viewOnly && !total ? (
                  <div className="flex flex-col align-middle py-1 gap-2">
                    <div className="flex items-center gap-2">
                      <Typography className="ml-1">
                        {roundNum(values.amount[0])}
                      </Typography>
                      <Typography className="pr-2">
                        {values.amount[1].toLowerCase()}
                      </Typography>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell
          style={{
            paddingBottom: 0,
            paddingTop: 0,
            borderBottom: lastIndex ? "none" : "1px solid #ddd",
          }}
          colSpan={8}
        >
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box margin={total ? 1 : "1px 8px 8px"}>
              <Box display="flex" alignItems="center">
                <Typography variant="h6" gutterBottom component="div">
                  {mapKeys("Details")}
                </Typography>
              </Box>
              {!total && <div className="flex gap-1">
                <Typography
                  variant="body1"
                  gutterBottom
                  component="div"
                  className="flex items-center"
                >
                  {mapKeys("Amount")} {values.amount[0]} {values.amount[1]}
                </Typography>
                <Button
                  onClick={() => setOpenFoodSizeDialog(true)}
                  sx={{ marginLeft: "auto" }}
                  variant="outlined"
                >
                  <Edit2 />
                </Button>
              </div>}
              <Table size="small" aria-label="details">
                <TableBody>
                  {!total && renderNutrientRow("calories", "Calories")}
                  {renderNutrientRow("fat", "Fat")}
                  {renderNutrientRow("carbs", "Carbs")}
                  {renderNutrientRow("sugar", "Sugar")}
                  {renderNutrientRow("protein", "Protein")}
                </TableBody>
              </Table>
              {!viewOnly && (
                <div className="flex justify-end ml-auto">
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(name);
                    }}
                  >
                    <Trash
                      size={theme.iconSize.large}
                      color={theme.palette.primary.error}
                    />
                  </IconButton>
                </div>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
