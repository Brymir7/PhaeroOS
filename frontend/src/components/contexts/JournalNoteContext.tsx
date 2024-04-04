import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useContext,
} from "react";
import { useApi } from "../../modules/apiAxios";
import { EntryData } from "../../pages/EditEntryPage";
import { phaero_note_dict_diff } from "../homePage/PhaeroMessage";
import { Language, MapKeysContext } from "./MapKeysContext";
import dayjs from "dayjs";
import { AuthContext } from "./AuthContext";
export const sleepQuestions = [
  "Did it take you a long time to fall asleep? (>30min)",
  "Did you wake up during the night?",
  "Did you still feel tired when you woke up?",
  "Did you feel tired during the day?",
  "Did you have a lack of energy during the day?",
];
type UserMessage = {
  typeof_message: "user";
  message: string;
  id: number;
  recorded_at: string; // ISO string representation of date
};
export type display = "sleep_survey" | "wellbeing" | "checklist" | "habits";
export type SystemMessage = {
  typeof_message: "system";
  message: string;
  id: number;
  recorded_at: string; // ISO string representation of date
  phaero_note_dict: object;
  phaero_note_dict_diff_json: phaero_note_dict_diff;
  display?: display;
  has_confirmed?: boolean;
  used_note_ids?: number[];
};

type createSystemMessageRequest = {
  message: string;
  display?: display;
  has_confirmed?: boolean;
  specific_date: string;
};

export type Message = UserMessage | SystemMessage;

interface NoteContextType {
  note: string;
  images: string[];
  deleteImages: (imagesToDeleteIndices: number[]) => void;
  setNote: (newText: string) => void;
  fetchDailyNote: () => void;
  formatNote: () => void;
  isLoading?: boolean;
  isProcessing?: boolean;
  wordCount: number;
  hasNewEditEntry: boolean;
  setHasNewEditEntryToFalse: () => void;
  fetchEditEntry: () => void;
  processAllowance: number;
  autoProcess: boolean;
  updateAutoProcessSetting: (value: boolean) => void;
  processNote: () => void;
  canProcess: boolean;
  minWordCount: number;
  messagingView: boolean;
  setMessagingView: (value: boolean) => void;
  messages: Message[];
  getMessages: (specificDate: string) => void;
  sendMessage: (message: string) => void;
  isAnswering: boolean;
  updateEditEntry: (entry: EntryData | undefined) => void;
  setEditEntry: (entry: EntryData | undefined) => void;
  editEntry: EntryData | undefined;
  createSysMessage: (message: createSystemMessageRequest) => void;
  sleepSurvey: boolean[] | undefined;
  handleQuestionChange: (index: number) => void;
  username: string;
  userChangedEditEntry: EntryData | undefined;
  updateUserEditEntry: (newEditEntry: EntryData) => void;
}

export const JournalNoteContext = createContext<NoteContextType>({
  note: "",
  images: [],
  deleteImages: () => { },
  setNote: () => { },
  fetchDailyNote: () => { },
  formatNote: () => { },
  isLoading: true,
  isProcessing: false,
  wordCount: 0,
  hasNewEditEntry: false,
  fetchEditEntry: () => { },
  setHasNewEditEntryToFalse: () => { },
  processAllowance: 0,
  autoProcess: true,
  updateAutoProcessSetting: () => { },
  processNote: () => { },
  canProcess: false,
  minWordCount: 20,
  messagingView: true,
  setMessagingView: () => { },
  messages: [],
  getMessages: () => { },
  sendMessage: () => { },
  isAnswering: false,
  updateEditEntry: () => { },
  setEditEntry: () => { },
  editEntry: undefined,
  createSysMessage: () => { },
  sleepSurvey: undefined,
  handleQuestionChange: () => { },
  username: "",
  userChangedEditEntry: undefined,
  updateUserEditEntry: () => { },
});

export const JournalNoteProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const api = useApi();
  const minWordCount = 20;
  const today_date =
    dayjs().hour() < 3
      ? dayjs().subtract(1, "day").format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  const { language } = useContext(MapKeysContext);
  const [username, setUsername] = useState<string>("");
  const [isUsernameFetched, setIsUsernameFetched] = useState(false);
  const [note, setNoteInternal] = useState<string>("");
  const [messagingView, setMessagingView] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [images, setImages] = useState<string[]>([]);
  const [wordCount, setWordCount] = useState<number>(0);
  const [editEntry, setEditEntry] = useState<EntryData | undefined>(undefined);
  const [userChangedEditEntry, setUserChangedEditEntry] = useState<
    EntryData | undefined
  >(undefined);
  const prevEditEntry = useRef<EntryData | undefined>(undefined);
  const [processAllowance, setProcessAllowance] = useState<number>(0);
  const [autoProcess, setAutoProcess] = useState<boolean>(true);
  const [canProcess, setCanProcess] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);
  const fetchDailyNote = () => {
    setIsLoading(true);
    api
      .get(`/daily_note/`, { params: { specific_date: today_date } })
      .then((response) => {
        setNoteInternal(response.data.note);
        const decodedImages = response.data.images.map(
          (img: string) => `data:image/jpeg;base64,${img}`
        );
        setImages(decodedImages);
        setIsLoading(false);
        fetchProcessAllowance();
        fetchEditEntry();
      })
      .catch((error) => {
        console.error("Failed to fetch daily note", error);
      });
  };
  useEffect(() => {
    if (!messagingView) {
      fetchDailyNote();
    }
  }, [messagingView]);
  // const fetchDailyNoteAndProcess = () => {
  //   api
  //     .get(`/daily_note/`)
  //     .then((response) => {
  //       setNoteInternal(response.data.note);
  //       const decodedImages = response.data.images.map(
  //         (img: string) => `data:image/jpeg;base64,${img}`
  //       );
  //       setImages(decodedImages);
  //       setIsLoading(false);
  //       const wordCount = calculateWordCount(response.data.note);
  //       setWordCount(wordCount);
  //       if (wordCount >= minWordCount) {
  //         setCanProcess(true);
  //       }
  //       if (autoProcess && processAllowance > 0 && wordCount >= minWordCount) {
  //         processNote();
  //       }
  //     }
  //     )
  // }
  const fetchUsername = () => {
    api.get(`/username/`).then((response) => {
      if (response.data.username === "") {
        setUsername("User");
        return;
      }
      if (response.data.username.split(" ").length > 1) {
        setUsername(response.data.username.split(" ")[0]);
        return;
      }
      setUsername(response.data.username);
    });
    setIsUsernameFetched(true);
  };
  const { hasAccess } = useContext(AuthContext);
  useEffect(() => {
    fetchUsername();
  }, [hasAccess]);

  useEffect(() => {
    if (isUsernameFetched) {
      fetchDailyNote();
      fetchProcessAllowance();
      fetchAutoProcessSetting();
      fetchMessages();
      fetchEditEntry();
      fetchUserEditEntry();
      getSleepSurvey();
    }
  }, [isUsernameFetched, hasAccess]);

  const fetchAutoProcessSetting = () => {
    api
      .get("/settings/auto_process/")
      .then((response) => {
        setAutoProcess(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch auto process setting", error);
      });
  };

  const updateAutoProcessSetting = (value: boolean) => {
    api
      .post("/settings/auto_process/", { auto_process: value })
      .then(() => {
        setAutoProcess(value);
      })
      .catch((error) => {
        console.error("Failed to update auto process setting", error);
      });
  };

  const deleteImages = (imageIndicesToDelete: number[]) => {
    api
      .post("/daily_note/delete_images/", {
        image_indices: imageIndicesToDelete,
      })
      .then(() => {
        fetchDailyNote();
      })
      .catch((error) => {
        console.error("Error updating the images", error);
      });
  };

  const formatNote = () => {
    setIsLoading(true);
    api
      .post("/phaero_note/format/", { note: note })
      .then(() => {
        fetchDailyNote();
      })
      .catch((error) => {
        console.error("Error formatting the note", error);
      });
  };

  const [sleepSurvey, setSleepSurvey] = useState<boolean[] | undefined>(
    undefined
  );
  const userSleepSurvey = {
    sleepQuestion1: [
      false,
      "Did it take you a long time to fall asleep? (>30min)",
    ],
    sleepQuestion2: [false, "Did you wake up during the night?"],
    sleepQuestion3: [false, "Did you still feel tired when you woke up?"],
    sleepQuestion4: [false, "Did you feel tired during the day?"],
    sleepQuestion5: [false, "Did you have a lack of energy during the day?"],
  };
  const getSleepSurvey = async () => {
    const data = {
      sleep_survey: userSleepSurvey,
    };
    try {
      const response = await api.post("/survey/", data, {
        params: { specific_date: today_date },
      });
      setSleepSurvey(response.data.answers);
    } catch (error) {
      console.log("Failed to fetch sleep survey", error);
    }
  };

  const updateSleepSurvey = async (newSurvey: boolean[]) => {
    api.post(
      "/survey/update/",
      {
        answers: { answers: newSurvey },
        type: "sleep",
      },
      { params: { specific_date: today_date } }
    );
  };

  const handleQuestionChange = (index: number) => {
    setSleepSurvey((prev) => {
      if (!prev) return prev;
      const newSurvey = [...prev];
      newSurvey[index] = !newSurvey[index];
      updateSleepSurvey(newSurvey);

      return newSurvey;
    });
  };
  const processNote = () => {
    const data = {
      sleep_survey: userSleepSurvey,
      wellbeing_score: 5,
      attached_tags: [],
    };
    setIsProcessing(true);
    api
      .post("/phaero_note/process/", data, {
        params: { specific_date: today_date },
      })
      .then(() => {
        setIsProcessing(false);
        fetchEditEntry();
        fetchProcessAllowance();
        fetchMessages();
      })
      .catch((error) => {
        console.error("Error processing the note", error);
        setIsProcessing(false);
      });
  };

  const fetchProcessAllowance = () => {
    api.get("/phaero_note/process_state/").then((response) => {
      setProcessAllowance(response.data.allowance);
    });
  };

  const createInitialSystemMessage = () => {
    const initialMessage =
      language === Language.English
        ? `Phaero: Good morning!\n\nHow was your sleep?\n---\n\n If you forget how this app works, just ask me!\n\n (e.g. How do the habits work?)`
        : `Phaero: Guten morgen!\n\nWie war dein Schlaf?\n---\n\n Wenn du vergessen hast, wie diese App funktioniert, frag mich einfach!\n\n (z.B. Wie funktionieren die Gewohnheiten?)`;
    const data: createSystemMessageRequest = {
      message: initialMessage,
      display: "sleep_survey",
      has_confirmed: false,
      specific_date: today_date,
    };
    api
      .post("/chat/create_initial_sys_message/", data)
      .then(() => {
        console.log(today_date);
        fetchMessages();
      })
      .catch((error) => {
        console.error("Error creating initial system message", error);
      });
  };
  const createSysMessage = (message: createSystemMessageRequest) => {
    api
      .post("/chat/create_sys_message/", message)
      .then(() => {
        fetchMessages();
      })
      .catch((error) => {
        console.error("Error creating system message", error);
      });
  };
  const fetchMessages = () => {
    api
      .get("/chat/get_messages/", { params: { specific_date: today_date } })
      .then((response) => {
        setMessages(response.data);
        messagesFetched.current = true;
      })
      .catch((error) => {
        console.error("Error fetching messages", error);
      });
  };
  const convertHourMinuteToNumber = (hour: number, minute: number) => {
    return hour * 60 + minute;
  };
  const getCountOfDisplayType = (displayType: display) => {
    return messages.filter(
      (m) => m.typeof_message === "system" && m.display === displayType
    ).length;
  };
  const messagesFetched = useRef<boolean>(false);
  useEffect(() => {
    if (!messagesFetched.current) return;
    const currentTimeNumberComparable = dayjs().hour() * 60 + dayjs().minute();
    const actualUserMessagesLength = messages.filter(
      (m) => m.typeof_message === "user"
    ).length;
    if (messages.length === 0) {
      createInitialSystemMessage();
    }
    if (actualUserMessagesLength === 0) return;
    else if (
      actualUserMessagesLength > 1 &&
      getCountOfDisplayType("checklist") < 1 &&
      getCountOfDisplayType("sleep_survey") >= 1 &&
      (currentTimeNumberComparable < convertHourMinuteToNumber(18, 0))
    ) {
      createChecklistMessage();
    } else if (
      actualUserMessagesLength > 3 &&
      getCountOfDisplayType("habits") < 1 &&
      (convertHourMinuteToNumber(18, 0) < currentTimeNumberComparable ||
        currentTimeNumberComparable < convertHourMinuteToNumber(4, 0))
    ) {
      createHabitsMessage();
    } else if (
      actualUserMessagesLength > 4 &&
      getCountOfDisplayType("wellbeing") < 1 &&
      (currentTimeNumberComparable > convertHourMinuteToNumber(18, 0) ||
        currentTimeNumberComparable < convertHourMinuteToNumber(4, 0))
    ) {
      createWellbeingMessage();
    } else if (
      actualUserMessagesLength > 6 &&
      messages.filter((m) => m.typeof_message === "system" && m.display === "checklist").length == 1
      &&
      (currentTimeNumberComparable > convertHourMinuteToNumber(18, 0) ||
        currentTimeNumberComparable < convertHourMinuteToNumber(4, 0))) {
      createChecklistMessagePartTwo();
    }
  }, [messages, messagesFetched.current]);

  const createWellbeingMessage = () => {
    createSysMessage({
      message:
        language === Language.English
          ? "##### Rate your day from 1 to 10.\n\n---\n\nUse these questions to guide your rating:\n\n" +
          "* How accomplished did you feel?\n" +
          "* How often did you feel negative emotions?\n" +
          "* How connected did you feel with others?\n" +
          "* Were you negatively stressed?\n" +
          "* How grateful did you feel?" +
          "\n\n---\n\nAfter you've rated your day, feel free to write me more about it."
          : "##### Bewerte deinen Tag von 1 bis 10.\n\n---\n\n Verwende diese Fragen, um deine Bewertung zu leiten:\n\n" +
          "* Hast du alles geschafft, was du dir vorgenommen hast?\n" +
          "* Wie oft hast du negative Emotionen gespürt?\n" +
          "* Wie waren deine sozialen Interaktionen?\n" +
          "* Warst du negativ gestresst?\n" +
          "* Würdest du dich gerne häufiger wie heute fühlen?" +
          "\n\n---\n\nNachdem du deine Bewertung abgegeben hast, kannst du mir gerne mehr über deinen Tag schreiben.",

      display: "wellbeing",
      has_confirmed: false,
      specific_date: today_date,
    });
  };
  const createChecklistMessage = () => {
    createSysMessage({
      message:
        language === Language.English
          ? "##### What are your top 3 priorities for today?\n\n---\n\nAfter you've written them down, feel free to write me more about your day."
          : "##### Was sind deine 3 wichtigsten Sachen die du erledigen möchtest für heute?\n\n---\n\nNachdem du sie aufgeschrieben hast, kannst du mir gerne mehr über deinen Tag schreiben.",
      display: "checklist",
      has_confirmed: false,
      specific_date: today_date,
    });
  };
  const createChecklistMessagePartTwo = () => {
    createSysMessage({
      message:
        language === Language.English
          ? "##### Did you manage to finish your checklist today?"
          : "##### Hast du es geschafft, deine Checkliste heute zu erledigen?",
      display: "checklist",
      has_confirmed: false,
      specific_date: today_date,
    });
  };
  const createHabitsMessage = () => {
    createSysMessage({
      message:
        language === Language.English
          ? "Here are you habits for today. How did you do?"
          : "Hier sind deine Gewohnheiten für heute. Hast du sie gemacht?",
      display: "habits",
      has_confirmed: false,
      specific_date: today_date,
    });
  };
  const fetchNoteLength = () => {
    api.get("/daily_note/length/", { params: { specific_date: today_date } }).then(
      (response) => {
        setWordCount(response.data.note_length);
      }
    );

  }
  const sendMessage = (message: string) => {
    const data = {
      message: message,
      specific_date: today_date, // default to today's date
    };
    setIsAnswering(true);
    api
      .post("/chat/send_message/", data)
      .then((response) => {
        console.log("Message sent successfully:", response.data);
        fetchMessages();
        fetchNoteLength();
        setIsAnswering(false);
        processNote();
      })
      .catch((error) => {
        console.error("Error sending the message", error);
      });
  };

  const prevtext = useRef<string>(note);
  const saveNote = useCallback(
    (newText: string) => {
      if (note === newText || newText === "") {
        return;
      }
      api
        .post(
          "/daily_note/update/",
          { note: newText },
          { params: { specific_date: today_date } }
        )
        .then(() => {
          fetchDailyNote();
          const wordCount = calculateWordCount(newText);
          setWordCount(wordCount);
          if (wordCount >= minWordCount) {
            setCanProcess(true);
          }
          const oldText = prevtext.current;
          prevtext.current = newText;
          const oldLines = oldText
            .split("\n")
            .filter((line) => line.trim() !== "");
          const newLines = newText
            .split("\n")
            .filter((line) => line.trim() !== "");
          const lineDiff = newLines.filter((line) => !oldLines.includes(line));
          const hasSignificantChange =
            lineDiff.some((line) => !line.startsWith("#")) ||
            lineDiff.length > 1;
          if (
            hasSignificantChange &&
            autoProcess &&
            processAllowance > 0 &&
            wordCount >= minWordCount
          ) {
            processNote();
          }
        })

        .catch((error) => {
          console.error("Error updating the note", error);
        });
      setNoteInternal(newText);
    },
    [note, autoProcess, processAllowance]
  );

  const setNote = (newText: string) => {
    saveNote(newText);
  };

  const calculateWordCount = (text: string): number => {
    const trimmedText = text.trim();
    if (trimmedText === "") {
      return 0;
    }
    const words = trimmedText.split(/\s+/);
    return words.length;
  };

  const fetchEditEntry = () => {
    api
      .get(`/phaero_note/get/`, { params: { specific_date: today_date } })
      .then((response) => {
        const newEditEntry = response.data.result;
        setEditEntry(newEditEntry);
        if (
          JSON.stringify(newEditEntry) !== JSON.stringify(prevEditEntry.current)
        ) {
          setHasNewEditEntry(true);
          prevEditEntry.current = newEditEntry;
        }
      })
      .catch((error) => {
        console.error("Failed to fetch edit entry", error);
      });
  };
  const updateUserEditEntry = (newEditEntry: EntryData) => {
    const data = {
      note_dict: newEditEntry.result,
    };
    api
      .post("/phaero_note/update_user_changed_note/", data, {
        params: { specific_date: today_date },
      })
      .then(() => {
        fetchUserEditEntry();
      })
      .catch((error) => {
        console.error("Failed to update edit entry", error);
      });
  };
  const fetchUserEditEntry = () => {
    api
      .get(`/phaero_note/get_user_changed_note/`, {
        params: { specific_date: today_date },
      })
      .then((response) => {
        setUserChangedEditEntry(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch user edit entry", error);
      });
  };
  const updateEditEntry = (newEditEntry: EntryData | undefined) => {
    if (!newEditEntry) {
      return;
    }
    const data = {
      note_dict: newEditEntry.result,
    };
    api
      .post("/phaero_note/update/", data, { params: { specific_date: today_date } })
      .then((response) => {
        const updatedEditEntry = response.data;
        setEditEntry(updatedEditEntry);
        fetchUserEditEntry();
        if (
          JSON.stringify(updatedEditEntry) !==
          JSON.stringify(prevEditEntry.current)
        ) {
          setHasNewEditEntry(true);
          prevEditEntry.current = updatedEditEntry;
        }
      })
      .catch((error) => {
        console.error("Failed to update edit entry", error);
      });
  };

  const [hasNewEditEntry, setHasNewEditEntry] = useState<boolean>(false);

  const setHasNewEditEntryToFalse = () => {
    setHasNewEditEntry(false);
  };

  useEffect(() => {
    const words = calculateWordCount(note);
    setWordCount(words);
  }, [note]);
  useEffect(() => {
    if (wordCount >= minWordCount) {
      setCanProcess(true);
    } else {
      setCanProcess(false);
    }
  }, [wordCount]);

  return (
    <JournalNoteContext.Provider
      value={{
        note,
        setNote,
        fetchDailyNote,
        formatNote,
        images,
        deleteImages,
        isLoading,
        isProcessing,
        wordCount,
        hasNewEditEntry,
        fetchEditEntry,
        setHasNewEditEntryToFalse,
        processAllowance,
        autoProcess,
        processNote,
        updateAutoProcessSetting,
        canProcess,
        minWordCount,
        messagingView,
        setMessagingView,
        messages,
        getMessages: fetchMessages,
        sendMessage,
        isAnswering,
        setEditEntry,
        updateEditEntry,
        editEntry,
        createSysMessage,
        sleepSurvey,
        handleQuestionChange,
        username,
        userChangedEditEntry,
        updateUserEditEntry,
      }}
    >
      {children}
    </JournalNoteContext.Provider>
  );
};
