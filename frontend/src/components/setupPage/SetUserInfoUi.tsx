import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Input,
  FormControlLabel,
  Switch,
  InputAdornment,
  Typography,
} from "@mui/material";
import { useContext, useState, useRef, useEffect } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { AnimatedCheckbox, ArrowButton } from "../utils/Buttons";
import { useApi } from "../../modules/apiAxios";
import { useNavigate } from "react-router-dom";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { useNumberValidation } from "../utils/CustomHooks";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import dayjs, { Dayjs } from "dayjs";

function SetUserInfoUi() {
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [formFields, setFormFields] = useState({
    gender: "",
    height: "",
    weight: "",
  });
  const [imperialLength, setImperialLength] = useState<[string, string]>([
    "",
    "",
  ]);
  const [imperialWeight, setImperialWeight] = useState<string>("");
  const [date, setDate] = useState<Dayjs | null>(null);
  const [imperialUnits, setImperialUnits] = useState<boolean>(false);

  const [goal, setGoal] = useState<string>("cutting");
  const inputRef = useRef<HTMLInputElement>(null);
  const api = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleNumberInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) => {
    let value = useNumberValidation(e.target.value);
    if (value === undefined) return;
    if (typeof value === "number") {
      value = value.toString();
    }
    if (key === "feet") {
      setImperialLength([value, imperialLength[1]]);
    } else if (key === "inches") {
      setImperialLength([imperialLength[0], value]);
    } else if (key === "pounds") {
      setImperialWeight(value);
    } else {
      setFormFields({
        ...formFields,
        [key]: value,
      });
    }
  };

  const calculateAge = (dob: Dayjs) => {
    const now = dayjs();
    const age = now.diff(dob, "year");
    return age;
  };

  const sendDataBackend = () => {
    api
      .post("/setup_user/", {
        ...formFields,
        birthday: dayjs(date).toISOString(),
      })
      .then((response) => {
        if (response.status === 200) {
          api
            .post("/setup_user/goal/", { goal_text: goal })
            .then((response) => {
              if (response.status === 200) {
                navigate("/home");
              }
            })
            .catch((error) => {
              handleAllErrors(error);
            });
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  useEffect(() => {
    if (imperialUnits) {
      setFormFields({
        ...formFields,
        height: (
          Number(imperialLength[0]) * 30.48 +
          Number(imperialLength[1]) * 2.54
        ).toFixed(2),
        weight: (Number(imperialWeight) / 2.205).toFixed(2),
      });
    }
  }, [imperialWeight, imperialLength]);

  const handleSubmit = async () => {
    if (
      formFields.gender.length == 0 ||
      date == null ||
      formFields.height.length == 0 ||
      formFields.weight.length == 0
    ) {
      handleAllErrors(mapKeys("Please fill in all fields"));
      return;
    } else if (
      Number(calculateAge(date)) > 120 ||
      Number(calculateAge(date)) < 16 ||
      Number(calculateAge(date)) % 1 !== 0
    ) {
      handleAllErrors(mapKeys("Please enter a valid age"));
      return;
    } else if (
      Number(formFields.height) > 300 ||
      Number(formFields.height) < 100
    ) {
      handleAllErrors(mapKeys("Please enter a valid height"));
      return;
    } else if (
      Number(formFields.weight) > 300 ||
      Number(formFields.weight) < 30
    ) {
      handleAllErrors(mapKeys("Please enter a valid weight"));
      return;
    }
    sendDataBackend();
    navigate("/home");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

      // Get all focusable elements on the page
      const focusableElements = Array.from(
        document.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

      // Find the currently focused element
      const currentFocusedIndex = focusableElements.indexOf(
        document.activeElement as HTMLElement
      );

      // Find the next focusable element
      const nextElement = focusableElements[currentFocusedIndex + 1];

      // If a next element exists, focus on it
      if (nextElement) {
        nextElement.focus();
      }
    }
  };

  const genderButton = (gender: string) => (
    <Button
      variant="outlined"
      sx={{
        width: "140px",
        textTransform: "none",
        fontWeight: "normal",
        opacity: formFields.gender === gender ? "1" : "0.7",
        borderColor: formFields.gender === gender ? "primary.main" : "grey.500",
      }}
      style={{
        color: "#222",
        paddingTop: "0",
        paddingBottom: "0",
        padding: "0",
      }}
      onClick={() => setFormFields({ ...formFields, gender })}
    >
      <div className="flex w-full gap-2 p-2">
        <AnimatedCheckbox isChecked={formFields.gender === gender} />
        <span>{mapKeys(gender)}</span>
      </div>
    </Button>
  );

  const numberInputField = (
    value: string,
    placeholder: string,
    unit: string,
    fieldName: string
  ) => (
    <div className="flex items-center mt-2">
      <Input
        endAdornment={<InputAdornment position="end">{unit}</InputAdornment>}
        spellCheck={false}
        onKeyDown={handleKeyDown}
        placeholder={mapKeys(placeholder)}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          handleNumberInputChange(e, fieldName)
        }
        sx={{
          borderRadius: "4px",
          px: 1,
          width: "120px",
          border: "1px solid #ddd",
          "&::before": {
            transform: "scaleX(0)",
            left: "2.5px",
            right: "2.5px",
            bottom: 0,
            top: "unset",
            transition: "transform .15s cubic-bezier(0.1,0.9,0.2,1)",
            borderRadius: 0,
          },
          "&:focus-within::before": {
            transform: "scaleX(1)",
          },
        }}
      />
      {/* {unit && <p className="ml-2 text-gray-600">{unit}</p>} */}
    </div>
  );

  return (
    <>
      <Typography className="text-2xl ">{mapKeys("Profile details")}</Typography>

      <div className="flex flex-col w-fit font-robotoSlap">
        <div className="flex space-x-6 mb-4 mt-2">
          {genderButton("male")}
          {genderButton("female")}
        </div>
        <FormControlLabel
          control={
            <Switch
              onClick={() => setImperialUnits(!imperialUnits)}
              checked={imperialUnits}
            />
          }
          label={mapKeys("Imperial units")}
        />

        <div className="flex space-x-6">
          {imperialUnits ? (
            <>
              {numberInputField(imperialLength[0], "Height", "ft", "feet")}{" "}
              {numberInputField(imperialWeight, "Weight", "lb", "pounds")}
            </>
          ) : (
            <>
              {numberInputField(formFields.height, "Height", "cm", "height")}
              {numberInputField(formFields.weight, "Weight", "kg", "weight")}
            </>
          )}
        </div>
        {imperialUnits &&
          numberInputField(imperialLength[1], "Height", "in", "inches")}
        <div className="h-4" />
        <DemoContainer components={["DatePicker"]}>
          <DatePicker
            value={date}
            onChange={(newValue) => {
              setDate(newValue);
            }}
            sx={{
              ".MuiInputBase-root": { height: "auto", fontSize: "0.875rem" },
              ".MuiInputBase-input": { padding: "16px" },
            }}
            label={mapKeys("Date of Birth")}
          />
        </DemoContainer>
        <FormControl color="primary" sx={{ mt: 2, width: 180 }} size="small">
          <InputLabel id="demo-select-small-label">
            {mapKeys("Goal")}
          </InputLabel>
          <Select
            id="demo-select-small"
            value={goal}
            label="Nutrients"
            onChange={(e) => {
              setGoal(e.target.value);
            }}
          >
            <MenuItem value={"cutting"}>{mapKeys("lose weight")}</MenuItem>
            <MenuItem value={"maintenance"}>
              {mapKeys("maintain weight")}
            </MenuItem>
            <MenuItem value={"bulking"}>{mapKeys("gain weight")}</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div className="ml-auto">
        <ArrowButton
          onClick={() => {
            handleSubmit();
          }}
          text={mapKeys("Submit")}
        />
      </div>
    </>
  );
}

export default SetUserInfoUi;
