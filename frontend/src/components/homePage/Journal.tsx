import { useEffect, useState, useContext, useRef } from "react";
import RecordRTC from "recordrtc";
import { useApi } from "../../modules/apiAxios";
import { useNavigate } from "react-router-dom";
import { StreakContext } from "../contexts/StreakContext";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { AuthContext } from "../contexts/AuthContext";
import ConfirmProcessing, { UserSurvey } from "./ConfirmProcessing";
import RecordUI from "./RecordUI";
import TranscriptionText from "./JournalText";
1;

import TutorialStep from "../utils/TutorialStep";
import DisplayFile from "./DisplayFile";
import { useBadges } from "../contexts/BadgeContext";

import FoodDialog from "./FoodDialog";
import ExerciseDialog from "./ExerciseDialog";
import { JournalNoteContext } from "../contexts/JournalNoteContext";
import AddCustomFoodDialog from "./AddCustomFoodDialog";
import { CircularProgress, Paper } from "@mui/material";
import ToggleButtons, { ToggleButtonBluePrint } from "./ToggleButtons";

function Transcription() {
  const api = useApi();
  const navigate = useNavigate();
  const { note, setNote, fetchDailyNote, images, deleteImages, isLoading, wordCount } =
    useContext(JournalNoteContext);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [uploadType, setUploadType] = useState<
    "handwriting" | "food" | "attachment"
  >("handwriting");
  const [fileUploadLoading, setFileUploadLoading] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [editNoteOpen, setEditNoteOpen] = useState<boolean>(false);
  // const [journalTutorialOpen, setJournalTutorialOpen] =
  //   useState<boolean>(false);
  const [text, setText] = useState<string>("");
  const [processState, setProcessState] = useState<number>(0); // 0 = not started, 1 = can process, 2 = processing, 3 = processed
  const [transcriptionAllowance, setTranscriptionAllowance] =
    useState<number>(0);
  const [conversionAllowance, setConversionAllowance] = useState<number>(0);
  const [formatAllowance, setFormatAllowance] = useState<number>(0);
  const [imageAllowance, setImageAllowance] = useState<number>(0);
  const [noteLengthRestriction, setNoteLengthRestriction] = useState<number[]>([
    100, 500,
  ]);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [duration, setDuration] = useState<number>(0);
  const [maxRecordingDuration, setMaxRecordingDuration] = useState<number>(0);

  const { streak, setStreak, fetchStreak } = useContext(StreakContext);
  const { mapKeys, mapExercises } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  const { setBadgeActive } = useBadges();
  useEffect(() => {
    if (hasAccess) {
      fetchConstants();
      fetchCanTranscribe();
      fetchImageAllowance();
      fetchConversionAllowance();
      fetchFormatAllowance();
      fetchDailyNote();
    }
  }, [hasAccess]);
  const fetchImageAllowance = () => {
    api
      .get("/phaero_note/image_allowance/")
      .then((response) => {
        setImageAllowance(response.data.imageAllowance);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  //utility functions ------------------------------------------------------------
  const fetchFormatAllowance = () => {
    api
      .get("/phaero_note/can-format/")
      .then((response) => {
        setFormatAllowance(response.data.formatAllowance);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };


  useEffect(() => {
    if (processState < 2) {
      if (
        wordCount >= noteLengthRestriction[0] &&
        wordCount <= noteLengthRestriction[1] &&
        !isListening
      ) {
        setProcessState(1);
      } else {
        setProcessState(0);
      }
    }
  }, [note, isListening]);

  //backend functions ------------------------------------------------------------
  const processDataBackend = (
    surveyData: UserSurvey,
    wellbeingScore: number,
    tags: number[]
  ) => {
    if (processState !== 1) {
      return;
    }

    setProcessState(2);
    const apiEndpoint = `/phaero_note/process/`;
    const data = {
      sleep_survey: surveyData,
      wellbeing_score: wellbeingScore,
      attached_tags: tags,
    };

    api
      .post(apiEndpoint, data, { timeout: 64000 })
      .then(() => {
        setBadgeActive("processing", false);
        setProcessState(3);
        setStreak(streak + 1);
        fetchStreak();
        navigate("/home/edit-entry");
      })
      .catch(() => {
        setProcessState(0);
        handleAllErrors(
          mapKeys(
            "Something went wrong while processing. If the error persists after refreshing, please contact support."
          )
        );
      });
  };
  const fetchConstants = () => {
    api
      .get("/upload-audio/max-duration/")
      .then((response) => {
        setMaxRecordingDuration(response.data.maxDuration);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
    api
      .get("/phaero_note/note_length_restriction/")
      .then((response) => {
        setNoteLengthRestriction([
          response.data.min_note_length,
          response.data.max_note_length,
        ]);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  // const fetchProcessState = () => {
  //   api
  //     .get("/phaero_note/process_state/")
  //     .then((response) => {
  //       if (response.data.has_been_processed) setProcessState(3);
  //       else if (
  //         wordCount > noteLengthRestriction[0] &&
  //         wordCount < noteLengthRestriction[1] &&
  //         !isListening
  //       )
  //         setProcessState(1);
  //       else setProcessState(0);
  //     })
  //     .catch((error) => {
  //       handleAllErrors(error);
  //     });
  // };

  const fetchCanTranscribe = () => {
    api
      .get("/upload-audio/can-transcribe/")
      .then((response) => {
        setTranscriptionAllowance(response.data.transcriptionAllowance);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const fetchConversionAllowance = () => {
    api
      .get("/phaero_note/can-convert/")
      .then((response) => {
        setConversionAllowance(response.data.conversionAllowance);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  //record audio functions -------------------------------------------------------
  // const accumulatedDurationRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recordRTCRef = useRef<RecordRTC | null>(null);
  let audioContext: AudioContext | null;

  useEffect(() => {
    // Cleanup function
    return () => {
      disposeRecordRTC();
    };
  }, []);

  const disposeRecordRTC = () => {
    disposeVisualizer();
    if (recordRTCRef.current) {
      recordRTCRef.current.stopRecording(() => {
        recordRTCRef.current?.destroy();
      });
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
  };
  const recordAndSendAudio = async () => {
    if (isListening) {
      if (isPaused) {
        if (streamRef.current) {
          recordRTCRef.current?.resumeRecording();
          streamRef.current
            .getAudioTracks()
            .forEach((track) => (track.enabled = true));
          setupVisualizer(streamRef.current);
        }
        setIsPaused(false);
      } else {
        await pauseRecording();
      }

      return;
    }

    if (transcriptionAllowance <= 0) {
      handleAllErrors(
        mapKeys("You have already used all of your transcriptions.")
      );
      return;
    }

    try {
      setIsListening(true);
      setIsPaused(false);

      disposeRecordRTC();
      if (audioContext) audioContext.resume();
      else audioContext = new (window.AudioContext || window.AudioContext)();

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(streamRef.current);
      source.connect(analyser);

      setupVisualizer(streamRef.current);
      // const frequency: number = await get_load_backend();

      // if (frequency < 30000) {
      //   setNotRealtime(false);
      // } else {
      //   handleAllErrors(
      //     mapKeys(
      //       "Realtime transcription is currently not available. Upload your audio at once instead."
      //     )
      //   );
      // setNotRealtime(true);
      // }

      // Initialize variables to keep track of the accumulated audio data and duration
      // let accumulatedBlobs: BlobPart[] | undefined = [];

      const newRecordRTC = new RecordRTC(streamRef.current, {
        type: "audio",
        mimeType: "audio/wav",
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 5000, // Time slice for data availability
        desiredSampRate: 16000,
        numberOfAudioChannels: 1,
        // ondataavailable: function (blob) {
        //   if (frequency < 30000) {
        //     const blobDuration = 5000;
        //     accumulatedDurationRef.current += blobDuration;
        //     accumulatedBlobs = accumulatedBlobs || [];
        //     accumulatedBlobs.push(blob);
        //     console.log("length", accumulatedBlobs.length);

        //     if (accumulatedDurationRef.current > frequency - 100) {
        //       console.log(
        //         "acumulatedDurationRef.current",
        //         accumulatedDurationRef.current
        //       );
        //       console.log("frequency", frequency);
        //       const concatenatedBlob = new Blob(accumulatedBlobs, {
        //         type: "audio/wav",
        //       });

        //       streamAudio(concatenatedBlob);
        //       accumulatedBlobs = [];
        //       accumulatedDurationRef.current = 0;
        //     }
        //   }
        // },
      });

      recordRTCRef.current = newRecordRTC;

      recordRTCRef.current?.startRecording();
    } catch (error: unknown) {
      handleAllErrors(error);
    }
  };
  const resetFile = () => {
    setFileUploadLoading(false);
    fetchConversionAllowance();

    setFile(undefined);
  };
  const convertFileToText = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file, file.name);
    setFileUploadLoading(true);
    api
      .post("/phaero_note/convert_image_to_text/", formData)
      .then(() => {
        resetFile();
        fetchDailyNote();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const convertFoodImageToText = async (file: File) => {
    const formData = new FormData();
    formData.append("image", file, file.name);
    setFileUploadLoading(true);
    api
      .post("/phaero_note/convert_food_to_text/", formData)
      .then(() => {
        resetFile();
        fetchDailyNote();
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  const convertImageToJPEG = (file: Blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgElement = document.createElement("img");
        imgElement.src = e.target?.result as string; // Add null check and type assertion
        imgElement.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = imgElement.width;
          canvas.height = imgElement.height;
          if (ctx) {
            // Add null check for ctx
            ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              resolve(blob);
            }, "image/jpeg");
          }
        };
        imgElement.onerror = reject;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const attachImageToText = async (file: File) => {
    try {
      const jpegBlob = await convertImageToJPEG(file);
      const formData = new FormData();
      formData.append("image", jpegBlob as Blob, "converted_image.jpeg"); // Specify filename as JPEG

      setFileUploadLoading(true); // Presuming you have a method to indicate loading

      api
        .post("/phaero_note/attach_image/", formData)
        .then(() => {
          resetFile(); // Presuming you have a method to reset the form
          fetchDailyNote(); // Presuming you have a method to fetch the updated note
        })
        .catch((error) => {
          handleAllErrors(error); // Handle errors appropriately
        })
        .finally(() => {
          setFileUploadLoading(false); // Turn off loading indication
        });
    } catch (error) {
      console.error("Error during image conversion or upload", error);
      handleAllErrors(error);
    }
  };
  //calculate time since recording start
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    // Only set up the interval if recording has started
    if (isListening && !isPaused) {
      interval = setInterval(() => {
        if (duration >= maxRecordingDuration) {
          pauseRecording();
          return;
        }
        // Increment the duration by 1000ms (1 second) every 1000ms
        setDuration((prevDuration) => {
          if (prevDuration >= maxRecordingDuration) {
            pauseRecording();
            return maxRecordingDuration;
          } else {
            return prevDuration + 1000;
          }
        });
      }, 1000);
    }

    // Cleanup on effect cleanup or when recording is paused/stopped
    return () => {
      if (interval) clearInterval(interval);
    };
    // Effect dependencies: changes in startTime or isPaused state should re-run this effect
  }, [isListening, isPaused]);

  const pauseRecording = async () => {
    if (!recordRTCRef.current) {
      return;
    }
    recordRTCRef.current.pauseRecording();
    if (streamRef.current)
      streamRef.current
        .getAudioTracks()
        .forEach((track) => (track.enabled = false));
    setIsPaused(true);
    disposeVisualizer();
  };

  const stopRecording = async (audioFileAction: "discard" | "confirm") => {
    disposeVisualizer();
    setIsListening(false);

    if (!recordRTCRef.current) {
      return;
    }
    recordRTCRef.current.stopRecording(() => {
      if (audioFileAction === "confirm") {
        const blob = recordRTCRef.current?.getBlob();
        sendAudioFile(blob);
      }
      setDuration(0);
      recordRTCRef.current?.destroy();
      recordRTCRef.current = null;
      streamRef.current?.getAudioTracks().forEach((track) => track.stop());
      streamRef.current = null;
    });
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  let buffer: Float32Array;
  let bufferIndex = 0;
  let initialized = false;

  const disposeVisualizer = () => {
    if (animationFrameIdRef.current !== null) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    if (canvasRef.current) {
      const canvasCtx = canvasRef.current.getContext("2d");
      if (canvasCtx) {
        canvasCtx.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
    }
  };

  const setupVisualizer = (stream: MediaStream) => {
    disposeVisualizer(); // Cleanup any previous visualizer setup

    const audioContext = new (window.AudioContext || window.AudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    if (canvasRef.current) {
      const canvasCtx = canvasRef.current.getContext("2d");
      if (canvasCtx) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const sampleRate = 32000;
        const duration = 1; // seconds
        buffer = new Float32Array(sampleRate * duration);
        buffer.fill(128);
        bufferIndex = 0;
        initialized = true;

        drawVisualizer(dataArray, canvasCtx);
      }
    }
  };

  const drawVisualizer = (
    dataArray: Uint8Array,
    canvasCtx: CanvasRenderingContext2D
  ) => {
    dataArray.fill(128);

    const frameInterval = 1000 / 60; // 60 FPS
    let lastFrameTime = 0;

    const draw = (currentTime: number) => {
      if (!canvasRef.current || !analyserRef.current || !initialized) return;

      if (currentTime - lastFrameTime > frameInterval) {
        lastFrameTime = currentTime;

        analyserRef.current.getByteTimeDomainData(dataArray);

        // Update the circular buffer with the new data
        for (let i = 0; i < dataArray.length; i++) {
          buffer[bufferIndex] = dataArray[i];
          bufferIndex = (bufferIndex + 1) % buffer.length;
        }

        const WIDTH = canvasRef.current.width;
        const HEIGHT = canvasRef.current.height;

        // Clear the canvas for each frame to maintain transparency
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        canvasCtx.lineWidth = 2;
        canvasCtx.strokeStyle = "rgb(0, 100, 0)";
        canvasCtx.beginPath();

        const sliceWidth = WIDTH / buffer.length;
        let x = 0;

        for (let i = 0; i < buffer.length; i++) {
          const v = buffer[(i + bufferIndex) % buffer.length] / 128.0;
          const y = (v * HEIGHT) / 2;

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            canvasCtx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.lineTo(WIDTH, HEIGHT / 2);
        canvasCtx.stroke();
      }

      animationFrameIdRef.current = requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sendAudioFile = async (blob: any) => {
    const formData = new FormData();
    formData.append("file", blob, "recording.wav");
    setIsTranscribing(true);
    setUploadComplete(false);

    const responsePromise = api.post("/upload-audio/", formData, {
      onUploadProgress: function (progressEvent) {
        if (progressEvent.loaded === progressEvent.total) {
          setTranscriptionAllowance(transcriptionAllowance - 1);
          setUploadComplete(true);
          fetchDailyNote();
        }
      },
      timeout: 75000,
    });

    responsePromise
      .then(() => {
        fetchDailyNote();
        fetchCanTranscribe();
      })
      .catch((error) => {
        setTranscriptionAllowance(transcriptionAllowance + 1);
        handleAllErrors(
          error.response?.data?.detail ? error.response.data.detail : error
        );
      })
      .finally(() => {
        setIsTranscribing(false);
      });
  };

  const saveNote = (newText: string) => {
    if (note === newText || newText === "") {
      return;
    }
    setNote(newText);
  };

  const [openFoodDialog, setOpenFoodDialog] = useState<boolean>(false);
  const [openExerciseDialog, setOpenExerciseDialog] = useState<boolean>(false);
  const [openAddCustomFoodDialog, setOpenAddCustomFoodDialog] =
    useState<boolean>(false);
  const addExercise = (exercise: {
    name: string;
    stats: { [key: string]: number };
  }) => {
    const exerciseString =
      `- ${mapExercises(exercise.name)}: ` +
      `${Object.keys(exercise.stats)
        .filter((statName) => exercise.stats[statName] !== 0)
        .map((statName) => ` ${mapKeys(statName)}: ${exercise.stats[statName]}`)
        .join(" | ")}`;
    const mappedExercisesHeadline = mapKeys("Exercises");
    const exercisesHeadlineRegex = new RegExp(
      `## ${mappedExercisesHeadline}`,
      "g"
    );
    const match = exercisesHeadlineRegex.exec(note);
    console.log("match", match);
    if (match) {
      const insertIndex = match.index + match[0].length;
      const updatedNote =
        note.slice(0, insertIndex) +
        "\n" +
        exerciseString +
        note.slice(insertIndex);
      saveNote(updatedNote);
    } else {
      saveNote(
        note + "\n\n## " + mappedExercisesHeadline + "\n" + exerciseString
      );
    }
  };
  const addFood = (food: { name: string; grams: number }) => {
    const foodString = `- ${food.name} ${food.grams}g`;
    const mappedFoodHeadline = mapKeys("Food");
    const foodHeadlineRegex = new RegExp(`## ${mappedFoodHeadline}`, "g");
    const match = foodHeadlineRegex.exec(note);
    if (match) {
      const insertIndex = match.index + match[0].length;
      const updatedNote =
        note.slice(0, insertIndex) +
        "\n" +
        foodString +
        note.slice(insertIndex);
      saveNote(updatedNote);
    } else {
      saveNote(note + "\n\n## " + mappedFoodHeadline + "\n" + foodString);
    }
  };
  const addMultipleFood = (foods: { name: string; grams: number }[]) => {
    const foodStrings = foods.map((food) => `- ${food.name} ${food.grams}g`);
    const mappedFoodHeadline = mapKeys("Food");
    const foodHeadlineRegex = new RegExp(`## ${mappedFoodHeadline}`, "g");
    const match = foodHeadlineRegex.exec(note);
    if (match) {
      const insertIndex = match.index + match[0].length;
      const updatedNote =
        note.slice(0, insertIndex) +
        "\n" +
        foodStrings.join("\n") +
        note.slice(insertIndex);
      saveNote(updatedNote);
    } else {
      saveNote(
        note + "\n\n## " + mappedFoodHeadline + "\n" + foodStrings.join("\n")
      );
    }
  }; const { messagingView, setMessagingView } =
    useContext(JournalNoteContext);
  const buttons: ToggleButtonBluePrint[] = [
    { text: "Chat", icon: undefined, disabled: false, selected: messagingView },
    {
      text: "Daily Entry",
      icon: undefined,
      disabled: false,
      selected: !messagingView,
    },
  ];
  return (
    <>
      {openFoodDialog && (
        <FoodDialog
          open={true}
          onClose={() => setOpenFoodDialog(false)}
          onAddFood={(food: { name: string; grams: number }) => {
            addFood(food);
            setOpenFoodDialog(false);
          }}
          onAddMultipleFoods={(foods: { name: string; grams: number }[]) => {
            addMultipleFood(foods);
            setOpenFoodDialog(false);
          }}
        ></FoodDialog>
      )}
      {openExerciseDialog && (
        <ExerciseDialog
          open={true}
          onClose={() => setOpenExerciseDialog(false)}
          onAddExercise={(exercise: {
            name: string;
            stats: { [key: string]: number };
          }) => {
            addExercise(exercise);
            setOpenExerciseDialog(false);
          }}
        ></ExerciseDialog>
      )}
      {openAddCustomFoodDialog && (
        <AddCustomFoodDialog
          open={true}
          setOpen={setOpenAddCustomFoodDialog}
          addToNote={(food: { name: string; grams: number }) => {
            addFood(food);
          }}
        ></AddCustomFoodDialog>
      )}
      {isOpen && (
        <ConfirmProcessing
          onCancel={() => setIsOpen(false)}
          onConfirm={(
            surveyData: UserSurvey,
            wellbeingScore: number,
            tags: number[]
          ) => {
            setIsOpen(false);
            processDataBackend(surveyData, wellbeingScore, tags);
          }}
        />
      )}

      <div className="flex flex-col w-full h-full overflow-y-hidden">
        {!editNoteOpen && <Paper className="mb-1">
          <div className="mx-auto min-w-[95%] " >
            <ToggleButtons
              buttons={buttons}
              onToggle={(value) =>
                setMessagingView(value === "Chat" ? true : false)
              }
            />
          </div>
        </Paper >}
        <TutorialStep extraClasses="flex flex-col h-full" step={0}>
          <div className="flex-grow ">
            {file ? (
              <DisplayFile
                uploadType={uploadType}
                file={file}
                setFile={setFile}
                convertFileToText={convertFileToText}
                convertFoodImageToText={convertFoodImageToText}
                fileUploadLoading={fileUploadLoading}
                attachImageToText={attachImageToText}
              />
            ) : isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <CircularProgress />
              </div>
            ) : (
              <TranscriptionText
                isTranscribing={isTranscribing}
                uploadComplete={uploadComplete}
                isListening={isListening}
                dailyNote={note}
                images={images}
                deleteImages={(imageIndicesToDelete: number[]) => {
                  deleteImages(imageIndicesToDelete);
                  imageIndicesToDelete.forEach((index) => {
                    const regex = new RegExp(`#i${index + 1}\\b`, "g");
                    setNote(note.replace(regex, ""));
                  });
                }}
                editingNote={editNoteOpen}
                setEditingNote={(open: boolean) => {
                  processState === 3 ? null : setEditNoteOpen(open);
                }}
                saveNote={saveNote}
                text={text}
                setText={setText}
              />
            )}
          </div>

          <div>
            {!editNoteOpen && (
              <RecordUI // make editing note bigger
                hasProcessed={processState === 3}
                isProcessing={processState === 2}
                isListening={isListening}
                isEditing={editNoteOpen}
                recordAndSendAudio={recordAndSendAudio}
                file={file}
                setFile={setFile}
                canvasRef={canvasRef}
                transcriptionAllwance={transcriptionAllowance}
                formatAllowance={formatAllowance}
                imageAllowance={imageAllowance}
                duration={duration}
                maxRecordingDuration={maxRecordingDuration}
                stopRecording={stopRecording}
                setUploadType={setUploadType}
                conversionAllowance={conversionAllowance}
                isPaused={isPaused}
                openExerciseDialog={() => {
                  setOpenExerciseDialog(true);
                }}
                openFoodDialog={() => {
                  setOpenFoodDialog(true);
                }}
                openAddCustomFoodDialog={() => {
                  setOpenAddCustomFoodDialog(true);
                }}
              />
            )}
          </div>
        </TutorialStep>
        {/* {journalTutorialOpen && (
          <JournalGuide
            onClose={() => {
              setJournalTutorialOpen(false);
            }}
          />
        )} */}
      </div>
    </>
  );
}

export default Transcription;
