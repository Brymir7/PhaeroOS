import { IconButton, Box, Typography } from "@mui/material";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  HabitItem,
  MapIconStringToIcon,
  convertBackendToFrontendHabits,
} from "../../goalsPage/types";
import { CodeBlock } from "./CodeBlock";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useApi } from "../../../modules/apiAxios";
interface HabitTextProps {
  title: string;
  description: string;
  onDelete?: () => void;
}

const HabitText = ({ title, description, onDelete }: HabitTextProps) => {
  const api = useApi();
  const [allHabits, setAllHabits] = useState<HabitItem[]>([]);
  const getHabits = () => {
    api
      .get("/habits/")
      .then((response) => {
        const updatedHabits = convertBackendToFrontendHabits(response.data);
        if (
          updatedHabits.length === 0 &&
          localStorage.getItem("defaultHabit") !== "false"
        ) {
          updatedHabits.push({
            id: 0,
            title: "Tap",
            description: "Tap",
            icon: "faHeart",
            repeat_every: 1,
            progress: {
              progress: [false],
            },
            color: "bg-red-500",
            recorded_at: dayjs().format("YYYY-MM-DD"),
          });
          localStorage.setItem("defaultHabit", "false");
        }
        setAllHabits(updatedHabits);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  useEffect(() => {
    getHabits();
  }, []);
  const handleOnClick = () => {
    // e.preventDefault();
    // e.stopPropagation();
  };
  return (
    <Box
      component="div"
      display="flex"
      flexDirection="column"
      alignItems="start"
      width="100%"
      sx={{ gap: 0.5 }}
    >
      <Box
        component="div"
        display="flex"
        flexDirection="row"
        alignItems="center"
        sx={{ gap: 1 }}
      >
        <Box component="div">
          {" "}
          <div
            className={`${
              allHabits.find((habit) => habit.title === title)?.color
            } flex justify-center items-center w-full h-full p-1`}
            style={{ fontSize: "1.2rem" }}
          >
            <FontAwesomeIcon
              icon={faCheck}
              style={{ color: "white" }}
              onClick={handleOnClick}
              size="sm"
            />
          </div>
        </Box>
        <FontAwesomeIcon
          icon={MapIconStringToIcon(
            allHabits.find((habit) => habit.title === title)?.icon ?? ""
          )}
          size="sm"
        />
        <Typography
          variant="body2"
          noWrap
          component="span"
          onClick={handleOnClick}
        >
          {title}
        </Typography>{" "}
        {onDelete !== undefined && (
          <IconButton
            aria-label="delete"
            size="medium"
            onClick={() => {
              handleOnClick();
              onDelete();
            }}
            color="error"
          >
            <FontAwesomeIcon icon={faXmark} size="sm" />
          </IconButton>
        )}
      </Box>
      {description.length > 0 && (
        <div className="mb-2">
          <CodeBlock>{description}</CodeBlock>
        </div>
      )}
    </Box>
  );
};

export default HabitText;
