/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button, Paper } from "@mui/material";
import useEmblaCarousel from "embla-carousel-react";
import "../homePage/journalPromptsCss/journalPromptCss.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import JournalingPromptsSelector from "./JournalPromptsSelector";
import { useApi } from "../../modules/apiAxios";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import {
  faArrowLeft,
  faArrowRight,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import MemoriesButton from "./Memories";
import PaperButton from "./PaperButton";
import { useWindowWidth } from "../utils/CustomHooks";
import { MapKeyedButton } from "../utils/Buttons";
import { JournalNoteContext } from "../contexts/JournalNoteContext";

const defaultPrompts = [
  "What are you grateful for today?",
  "What would make today great?",
  "What are your daily affirmations?",
  "What are your goals for today?",
  "What are your long-term goals?",
  "What are your short-term goals?",
  "What are you looking forward to?",
  "What are you excited about?",
  "What are you passionate about?",
  "What are you curious about?",
  "What are you interested in?",
  "What are you learning?",
  "What is a recent accomplishment you're proud of?",
  "What is a challenge you've overcome recently?",
  "What skill or hobby are you currently developing?",
  "What book are you currently reading, and what do you hope to learn from it?",
  "What's something new you've learned recently?",
  "Describe a dream or aspiration you have for your future.",
  "How do you practice self-care and self-love?",
  "What is something that inspires you?",
  "What is a quote or mantra that motivates you?",
  "What is a small act of kindness you can do today?",
  "What's a new habit you're trying to cultivate?",
  "What's a lesson you've learned from a recent failure?",
  "What's an adventure you'd like to embark on?",
  "What's a place you've never been to but would love to visit?",
  "What's a project you're excited to start?",
  "What's an invention you wish existed?",
  "What's a historical event you'd like to have witnessed?",
  "What's a skill you wish you were better at?",
  "What's a cause you're passionate about supporting?",
  "What's a language or dialect you'd like to learn?",
  "What's a cultural tradition you find fascinating?",
  "What's a technology you're eager to see developed in the future?",
  "What's a topic you'd like to educate yourself more about?",
  "What's a talent or ability you wish you had?",
  "What's a question you've always wanted to ask someone but haven't?",
  "What's an experience you're looking forward to sharing with someone special?",
  "What's a memory that always brings a smile to your face?",
  "What's a hobby you enjoy that others might find unusual?",
  "What's a tradition or ritual you have that brings you joy?",
  "What's a piece of advice you'd give to your younger self?",
  "What's a cultural dish you enjoy cooking or eating?",
  "What's a natural wonder of the world you'd love to witness?",
  "What's a social issue you believe deserves more attention?",
  "What's a historical figure you admire and why?",
  "What's a famous landmark you'd like to visit someday?",
  "What's a life lesson you've learned from a family member?",
  "What's a movie or TV show that had a profound impact on you?",
  "What's a dream job you'd love to pursue?",
  "What's a scientific discovery you find fascinating?",
  "What's a goal you've achieved that once seemed impossible?",
  "What's a piece of wisdom you've gained from a mentor?",
  "What's a project you've completed that you're proud of?",
  "What's an event you're looking forward to attending in the future?",
  "What's a hobby you've picked up recently?",
  "What's an activity you find relaxing and rejuvenating?",
  "What's a cultural festival you'd like to experience?",
  "What's a piece of art or music that resonates with you deeply?",
  "What's a dream vacation you'd love to take?",
  "What's a goal you've set for yourself this year that you're working towards?",
  "What's a belief or value that's important to you?",
  "What's a goal you've achieved recently that you're proud of?",
  "What's a lesson you've learned from a mistake?",
  "What's a cause you're passionate about supporting?",
  "What's a personal project you're currently working on?",
  "What's a place you find inspiration?",
  "What's a talent or skill you're trying to improve?",
  "What's a goal you've set for yourself in the next month?",
  "What's a tradition you cherish?",
  "What's a skill you'd like to learn in the near future?",
  "What's a memorable experience you've had recently?",
  "What's a dream you're actively pursuing?",
  "What's a hobby that brings you joy?",
  "What's a goal you're determined to achieve?",
  "What's a life lesson you've learned recently?",
  "What's a book or movie that's had a profound impact on you?",
  "What's a dream destination you'd love to travel to?",
  "What's a project you've been putting off that you want to tackle?",
  "What's an adventure you'd like to go on?",
  "What's a goal you've set for yourself in the next five years?",
  "What's a challenge you're currently facing?",
  "What's a passion project you'd like to pursue?",
  "What's a skill you'd like to master?",
  "What's a lesson you've learned from someone you admire?",
  "What's a goal you've achieved recently that you're proud of?",
  "What's a tradition you've created for yourself?",
  "What's a new skill you've learned recently?",
  "What's a dream that's been on your mind lately?",
  "What's a goal you've set for yourself this month?",
  "What's a hobby you'd like to explore further?",
  "What's a goal you're working towards right now?",
  "What's a goal you've accomplished recently?",
  "What's a dream you have for the future?",
  "What's a skill you'd like to develop?",
  "What's a lesson you've learned from a difficult experience?",
  "What's a goal you're striving towards?",
  "What's a dream you've had since childhood?",
  "What's a project you're passionate about?",
  "What's an experience you'd like to have in the next year?",
  "What's a goal you've set for yourself recently?",
  "What's a dream you'd like to turn into reality?",
  "What's a hobby you'd like to take up?",
  "What's a goal you've set for yourself this week?",
  "What's a lesson you've learned from a mistake?",
  "What's a passion you'd like to pursue?",
  "What's a skill you'd like to improve?",
  "What's a goal you've achieved that you're proud of?",
  "What's a dream you're actively pursuing?",
];
const morning_prompts = [
  "Before starting your day, set a positive intention for your mental or physical health. How do you want to feel by the end of the day?",
  "Plan your meals for the day ahead. What nutritious choices will you make to fuel your body and mind?",
  "Reflect on your sleep quality. Did you wake up feeling rested? What can you do tonight to improve your sleep?",
  "Think about your physical activity goal for the day. What’s one thing you can do to move more, even if it’s just a short walk?",
  "Set a goal for water intake today. How will staying hydrated help you achieve your health objectives?",
];
const midday_prompts = [
  "Halfway through the day, assess your energy levels. What has contributed to them, and how can you maintain or boost your energy?",
  "Reflect on the meals and snacks you've had so far. How do they align with your nutritional goals?",
  "Take a moment to check in with your mental state. Are you feeling stressed or calm? What can you do to address these feelings?",
  "Consider your intention for the day. How are you progressing towards it? What adjustments can you make to stay on track?",
  "If you've encountered a challenge today, reflect on how you handled it. What strengths did you draw on?",
];
const evening_prompts = [
  "Reflect on the best part of your day. What made it special, and how did it affect your mental or physical well-being?",
  "Review your activity level. Did you meet your goal? If not, what obstacles did you encounter, and how can you overcome them tomorrow?",
  "Think about your hydration and nutrition today. Did you meet your goals? What changes, if any, will you make tomorrow?",
  "As you wind down, consider your current state of mind. What are you grateful for today, and how can gratitude improve your well-being?",
  "Prepare for a good night's sleep. What bedtime rituals can you practice to ensure you’re rested for tomorrow?",
  "Reflect on any new habits you're trying to build. How consistent were you today, and what can you do to reinforce these habits?",
];
const additional_prompts = [
  "Identify a moment when you felt at peace today. What were you doing, and how can you incorporate more of this into your life?",
  "Think about a time when you felt proud of yourself today. What did you accomplish, and how can you build on this success?",
  "Reflect on a moment when you felt connected to others today. Who were you with, and how can you nurture these relationships?",
  "Consider a time when you felt inspired today. What motivated you, and how can you maintain this inspiration?",
  "Think about a moment when you felt challenged today. How did you respond, and what did you learn from this experience?",
  "Reflect on a time when you felt grateful today. What were you thankful for, and how can you cultivate more gratitude?",
  "Identify a moment when you felt happy today. What brought you joy, and how can you create more moments like this?",
];
// interface JournalingPromptProps {
//   setShowGuideTrue: () => void;
// }
const JournalingPrompt = () => {
  const OPTIONS = { loop: true };
  const api = useApi();
  const [showAnyPrompts, setShowAnyPrompts] = useState(false);
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [showAll, setShowAll] = useState<boolean>(false);
  const personalizedPrompts = useRef<string[]>([]);
  const [hasPersonalizedPrompts, setHasPersonalizedPrompts] = useState(false);
  const  windowWidth  = useWindowWidth();
  const handleSelect = (promptIndex: number) => {
    if (promptIndex > 0) {
      const [selectedPrompt] = prompts
        .concat(
          morning_prompts,
          midday_prompts,
          evening_prompts,
          additional_prompts,
          defaultPrompts
        )
        .splice(promptIndex, 1);
      prompts.unshift(selectedPrompt);
    }
    setPrompts(prompts);
    setShowAnyPrompts(true);
    setShowAll(false);
  };
  function getCurrentPartOfDay() {
    const hour = new Date().getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "midday";
    return "evening";
  }
  const fetchPromptsAndAppendPrompts = () => {
    api
      .get(`/predictions/feedback/journal/prompts/`)
      .then((response) => {
        const timeBasedPrompts = selectPromptsForCurrentTime();
        const appendedPromptsArray = fillPromptsArray(
          response.data.prompts,
          timeBasedPrompts
        );
        const formattedPersonalizedPrompts: string[] = [];
        response.data.prompts.forEach((prompt: string) => {
          const cleanPrompt = prompt.replace(/\d+\.\s/, "").replace(/^- /, "");
          formattedPersonalizedPrompts.push(cleanPrompt);
        });
        personalizedPrompts.current = formattedPersonalizedPrompts;
        if (formattedPersonalizedPrompts.length > 0) {
          setHasPersonalizedPrompts(true);
        }
        setPrompts(appendedPromptsArray);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  // Function to select prompts based on the part of the day
  function selectPromptsForCurrentTime() {
    const partOfDay = getCurrentPartOfDay();
    let timeBasedPrompts = [];
    switch (partOfDay) {
      case "morning":
        timeBasedPrompts = morning_prompts;
        break;
      case "midday":
        timeBasedPrompts = midday_prompts;
        break;
      case "evening":
        timeBasedPrompts = evening_prompts;
        break;
    }
    return timeBasedPrompts;
  }
  function fillPromptsArray(
    currPrompts: string[],
    timeBasedPrompts: string[] = []
  ) {
    let tempPrompts = [...currPrompts, ...timeBasedPrompts];
    tempPrompts = [...new Set(tempPrompts)];
    while (tempPrompts.length < 16 && additional_prompts.length > 0) {
      const randomIndexAdditionalPrompts = Math.floor(
        Math.random() * additional_prompts.length
      );
      const [randomPrompt] = additional_prompts.splice(
        randomIndexAdditionalPrompts,
        1
      );
      tempPrompts.push(randomPrompt);
      const randomIndexDefaultPrompts = Math.floor(
        Math.random() * defaultPrompts.length
      );
      const [randomPrompt2] = defaultPrompts.splice(
        randomIndexDefaultPrompts,
        1
      );
      tempPrompts.push(randomPrompt2);
    }
    return tempPrompts;
  }
  useEffect(() => {
    fetchPromptsAndAppendPrompts();
  }, []);
  const onPrevButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
  }, [emblaApi]);

  const onNextButtonClick = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
  }, [emblaApi]);
  const {messagingView, setMessagingView, messages, canProcess} = useContext(JournalNoteContext);
  return (
    <>
      <Paper
        elevation={2}
        sx={{
          pr: showAnyPrompts ? 4 : 0,
          paddingTop: showAnyPrompts ? 1 : 0,
          position: "relative",
          display: showAnyPrompts ? "" : "flex",
          justifyContent: showAnyPrompts ? "" : "center",
        }}
      >
        {showAnyPrompts && (
          <section className="embla__journal__prompts">
            <div className="embla__viewport__journal__prompts" ref={emblaRef}>
              <div className="embla__container">
                {prompts.map((prompt) => (
                  <div className="embla__slide__journal__prompts" key={prompt}>
                    <div className="embla__slide__number__journal__prompts">
                      {personalizedPrompts.current.includes(prompt)
                        ? prompt
                        : mapKeys(prompt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showAnyPrompts && (
          <Button
            onClick={() => {
              setShowAnyPrompts(false);
            }}
            sx={{ position: "absolute", bottom: 0, right: -15 }}
            color="error"
          >
            <FontAwesomeIcon icon={faXmark} className="px-4" size="xl" />
          </Button>
        )}

        {showAnyPrompts && (
          <div className="pt-2 pl-2 pb-1 flex">
            {" "}
            <Button
              size="small"
              onClick={onPrevButtonClick}
              variant="outlined"
              color={"tertiary" as any}
            >
              <FontAwesomeIcon icon={faArrowLeft} size="lg" />
            </Button>
            <Button
              onClick={onNextButtonClick}
              variant="outlined"
              style={{ marginLeft: "4px" }}
              color={"tertiary" as any}
              size="small"
            >
              <FontAwesomeIcon icon={faArrowRight} size="lg" />
            </Button>
          </div>
        )}
        {!showAnyPrompts && (
          <div className="flex justify-between gap-3 mt-2">
            <PaperButton
              text="Prompts"
              onClick={() => setShowAll(!showAll)}
              badgeContent="!"
              badgeColor="success"
              badgeInvisible={!hasPersonalizedPrompts}
            />
            {/* {window.innerWidth > 400 &&  <PaperButton text="Guide" onClick={setShowGuideTrue} />} */}
            {(windowWidth > 760 || (windowWidth > 765 && windowWidth < 1070 && window.innerHeight > 1000)) && (
              <PaperButton
                customButton={
                  <MapKeyedButton
                    variant="text"
                    minHeigth="50px"
                    minWidth="100%"
                    disabled={messages.length === 0 || !canProcess}
                    onClick={() => setMessagingView(!messagingView)}
                    text={messagingView ? "Daily Entry" : "Chat"}
                  />
                }
              />
            )}
            <PaperButton customButton={<MemoriesButton />} />
          </div>
        )}
      </Paper>

      {showAll && (
        <JournalingPromptsSelector
          onSelect={(promptIndex: number) => {
            handleSelect(promptIndex);
          }}
          onClose={() => {
            setShowAll(false);
          }}
          allPrompts={prompts
            .concat(
              morning_prompts,
              midday_prompts,
              evening_prompts,
              additional_prompts,
              defaultPrompts
            )
            .map((prompt) => {
              return personalizedPrompts.current.includes(prompt)
                ? prompt
                : mapKeys(prompt);
            })}
        />
      )}
    </>
  );
};

export default JournalingPrompt;
