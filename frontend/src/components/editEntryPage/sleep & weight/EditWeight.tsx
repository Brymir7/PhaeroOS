import React, { useContext, useEffect, useState } from "react";
import { EntryData } from "../../../pages/EditEntryPage";

import { MapKeysContext } from "../../contexts/MapKeysContext";
import { TextField, Paper, Typography, InputAdornment } from "@mui/material";
import { useNumberValidation } from "../../utils/CustomHooks";
import UniversalChart from "../../statisticsPage/UniversalChart";
import { DiagramDataType } from "../../../pages/StatisticsPage";

interface Props {
  entryData: EntryData;
  updateEntryData: (
    newData: React.SetStateAction<EntryData | undefined>
  ) => void;
  viewOnly?: boolean;
  diagramData?: DiagramDataType;
}

const EditWeight = ({
  entryData,
  updateEntryData,
  viewOnly = false,
  diagramData,
}: Props) => {
  const { mapKeys } = useContext(MapKeysContext);
  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    pounds: boolean
  ) => {
    const value = useNumberValidation(e.target.value);
    if (value !== undefined) {

      const updatedData = JSON.parse(JSON.stringify(entryData));
      if (value === "") {
        updatedData.result["Sleep & Weight"].Weight[0] = 0;
      } else {
        updatedData.result["Sleep & Weight"].Weight[0] = pounds
          ? Number(value) / 2.204
          : value;
      }
      updateEntryData(updatedData);
      updateWeightData(updatedData.result["Sleep & Weight"].Weight[0]);
    }
  };

  const formatNumber = (num: string | number): string => {
    const endingPeriod = /^[^.,]*[.,]$/.test(num.toString());
    return roundToFixedIfDecimal(Number(num)) + (endingPeriod ? "." : "");
  };

  function roundToFixedIfDecimal(value: number): string {
    if (Math.floor(value) !== value) {
      return value.toFixed(1);
    } else {
      return value.toString();
    }
  }


  const [accurateWeightData, setAccurateWeightData] = useState<DiagramDataType | undefined>(diagramData);

  useEffect(() => {
    if (diagramData) {
      setAccurateWeightData(diagramData);
    }
  }, [diagramData]);

  const updateWeightData = (newValue: number) => {
    if (!accurateWeightData) return;
    const updatedWeightData: DiagramDataType = {
      ...accurateWeightData,
    };
    updatedWeightData.data[updatedWeightData.data.length - 1] = {
      date: updatedWeightData.data[updatedWeightData.data.length - 1]["date"],
      Weight: newValue,
    };
    setAccurateWeightData(updatedWeightData);
  };

  const numberInputField = (
    value: string | number,
    placeholder: string,
    unit: string
  ) => (
    <div className="flex items-center ">
      <TextField
        spellCheck={false}
        disabled={viewOnly}
        placeholder={mapKeys(placeholder)}
        value={formatNumber(value)}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleNumberInputChange(e, unit === "lb")
        }
        variant="outlined"
        InputProps={{
          endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
        }}
        sx={{
          width: "140px",
        }}
      />
    </div>
  );

  return (
    <div className="mx-auto" style={{ marginTop: "0.25rem", maxWidth: "90vw" }}>
      <Typography variant="h4" className="pb-2 flex justify-center"> {mapKeys("Weight")}</Typography>
      <div className="my-1">
        <Paper elevation={2} className="flex p-4 justify-center ">
          {numberInputField(
            entryData.result["Sleep & Weight"].Weight[0],
            "weight",
            "kg"
          )}
        </Paper>
      </div>
      <div className="my-1">
        <Paper elevation={2} className="flex p-4 justify-center">
          {numberInputField(
            (entryData.result["Sleep & Weight"].Weight[0] * 2.204).toString(),
            "weight",
            "lb"
          )}
        </Paper>
      </div>
      {!viewOnly && diagramData && (
        <div>
          <Paper className="">
            <Typography variant="h6" className="flex pt-2 pl-4">
              {mapKeys("Weight")}
            </Typography>
            <div className="h-72 max-h-[30vh] flex max-w-[90%] mx-auto pt-2">
              <UniversalChart timeframe={7} diagramData={accurateWeightData} />
            </div>
          </Paper>
        </div>
      )}
    </div>
  );
};

export default EditWeight;
