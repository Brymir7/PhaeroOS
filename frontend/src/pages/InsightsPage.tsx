import {
  Autocomplete,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import React, { useContext, useEffect, useState } from "react";
import { useApi } from "../modules/apiAxios";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { MapKeysContext } from "../components/contexts/MapKeysContext";

interface Insight {
  prompt: string;
  result: string;
  recorded_at: string;
  used_note_strings: string[];
}

const InsightsPage = () => {
  const [query, setQuery] = useState<string>();
  const [insightQuery, setInsightQuery] = useState<string>();
  const [tokenCost, setTokenCost] = useState<number>(0);
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [startTime, setStartTime] = useState<Dayjs>(
    dayjs().subtract(1, "week")
  );
  const [endTime, setEndTime] = useState<Dayjs>(dayjs().subtract(1, "day"));
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const api = useApi();
  const premadePrompts = [
    "What were my insights on a specific date?",
    "Analyze my sleep quality",
    "Analyze my eating patterns",
    "Analyze my exercise patterns",
    "Analyze my mood",
    "Analyze my productivity",
    "Analyze my social interactions",
    "What are my most felt emotions?",
    "What are my most common thoughts?",
    "Tell me something interesting",
    "What are things I wanted to remember?",
    "What would you recommend me to do?",
    "Give me summary of those days",
    "What are my most common activities?",
    "Do you think the supplements I took made a difference?",
    "What are common pitfalls in my behavior?",
    "What are the coolest things I did?",
    "What should I be doing again based on what I said about it?",
    "What should I be doing less of based on how it affected me?",
    "What are the most common things I said?",
    // Add more premade prompts as needed
  ];
  console.log(startTime, endTime);
  const handleQueryChange = (
    _: React.ChangeEvent<object>,
    value: string | null
  ) => {
    setQuery(value || "");
  };
  const createInsight = async () => {
    if (!query) handleAllErrors("Query cannot be empty");
    const apiEndpoint = `/insights/create/`;
    const data = {
      prompt: query,
      start_time: startTime.format("DD-MM-YYYY"),
      end_time: endTime.format("DD-MM-YYYY"),
    };
    api
      .post(apiEndpoint, data)
      .then(() => {
        setIsLoading(false);
        setQuery("");
        getAllowance();
        fetchInsights();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const fetchInsights = async () => {
    const apiEndpoint = `/insights/`;
    api
      .get(apiEndpoint)
      .then((response) => {
        setInsights(response.data.insights);
        setIsLoading(false);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const getCost = async () => {
    const apiEndpoint = `/insights/tokens/`;
    const data = {
      prompt: query,
      start_time: startTime.format("DD-MM-YYYY"),
      end_time: endTime.format("DD-MM-YYYY"),
    };
    api
      .post(apiEndpoint, data)
      .then((response) => {
        setTokenCost(response.data.tokens);
        setAvailableTokens(response.data.available_tokens);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const getAllowance = async () => {
    const apiEndpoint = `/insights/allowance/`;
    api
      .get(apiEndpoint)
      .then((response) => {
        setAvailableTokens(response.data.allowance);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  useEffect(() => {
    fetchInsights();
    getAllowance();
  }, []);
  useEffect(() => {
    getCost();
  }, [startTime, endTime, query]);
  useEffect(() => {
    if (insightQuery) {
      const insight = insights.find(
        (insight) => insight.prompt === insightQuery
      );
      if (insight) {
        const newInsights = insights.filter(
          (insight) => insight.prompt !== insightQuery
        );
        newInsights.unshift(insight);
        setInsights(newInsights);
      }
    }
  }, [insightQuery]);
  const { mapKeys } = useContext(MapKeysContext);
  return (
    <div className="flex justify-center mt-5">
      <div className="bg-white p-2 rounded shadow max-w-[600px]">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold mb-4">{mapKeys("Insights")}</h1>
          <Typography variant="h5" className="text-center pb-2 pt-1">
            {availableTokens} {mapKeys("available")}
          </Typography>
        </div>
        <div onSubmit={createInsight} className="mb-8">
          <Typography variant="h5" className="text-center pb-4">
            {mapKeys("Time period")}
          </Typography>

          <div className="flex justify-between mb-4 gap-5">
            <DatePicker
              label={mapKeys("Start Time")}
              value={startTime}
              onChange={(date) => {
                if (date === null) {
                  setStartTime(dayjs().subtract(1, "week"));
                } else setStartTime(date);
              }}
              format="DD-MM-YYYY"
            />
            <DatePicker
              label={mapKeys("End Time")}
              value={endTime}
              onChange={(date) => {
                if (date === null) {
                  setEndTime(dayjs().subtract(1, "day"));
                } else setEndTime(date);
              }}
              format="DD-MM-YYYY"
            />
          </div>
          <Autocomplete
            freeSolo
            options={premadePrompts.map((option) => mapKeys(option))}
            value={query}
            onChange={handleQueryChange}
            renderInput={(params) => (
              <TextField
                {...params}
                label={mapKeys("Enter your query or select a prompt")}
                variant="outlined"
                fullWidth
                className="mb-4"
                onChange={(e) => setQuery(e.target.value)}
              />
            )}
          />
          <div className="flex justify-center mt-4">
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading || !query || tokenCost > availableTokens}
              className="relative"
              onClick={() => {
                setIsLoading(true);
                createInsight();
              }}
            >
              {isLoading && <CircularProgress size={24} className="absolute" />}
              <span className={isLoading ? "opacity-0" : ""}>{mapKeys("Submit Query")}</span>
            </Button>
            {tokenCost > 0 && (
              <Typography variant="h5" className="text-center pb-2 pt-1 pl-2">
                {mapKeys("This will cost")} {tokenCost} {mapKeys("tokens")}
              </Typography>
            )}
          </div>
        </div>
        <Paper className="flex p-1 mb-1 gap-2">
          <div className="flex flex-col min-w-[35%]">
            <Typography variant="h5" className="text-center">
              {mapKeys("Previous")}
            </Typography>
            <Typography variant="h5" className="text-center pb-2 pt-1">
              {mapKeys("Insights")}
            </Typography>
          </div>
          <Autocomplete
            sx={{ minWidth: "60%", marginTop: "10px" }}
            options={insights.map((insight) => insight.prompt)}
            value={insightQuery}
            onChange={(_, value) => {
              if (value === null) setInsightQuery("");
              else setInsightQuery(value);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={mapKeys("Select a previous insight")}
                variant="outlined"
                fullWidth
                className="mb-4"
              />
            )}
          />
        </Paper>
        <List sx={{ overflowY: "auto", maxHeight: "39vh" }}>
          {insights.map((insight, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={
                  <div className="flex justify-between">
                    <div>{insight.prompt}</div>
                    <div>{insight.recorded_at}</div>
                  </div>
                }
                secondary={insight.result}
                className="border-b border-gray-300 py-4"
              />
            </ListItem>
          ))}
        </List>
      </div>
    </div>
  );
};

export default InsightsPage;
