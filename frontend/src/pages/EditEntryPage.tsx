import { useState, useEffect, useContext } from "react";
import { useApi } from "../modules/apiAxios";
import EditEntry from "../components/editEntryPage/EditEntry";
import ConfirmationPopup from "../components/utils/ConfirmationPopup";
import { useNavigate, useParams } from "react-router-dom";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import { AuthContext } from "../components/contexts/AuthContext";
import dayjs from "dayjs";

interface Exercise {
  [key: string]: {
    [key: string]: number;
  };
}
export interface Nutrients {
  Macros: {
    [key: string]: [number, string];
  };
  Micros: {
    [key: string]: [number, string];
  };
  StatsFrom?: string;
}

export interface EntryData {
  result: {
    Exercise: {
      Steps: number;
      "absolute Rating": number;
      Exercises: {
        "Bodyweight Exercises": Exercise;
        "Cardio Exercises": Exercise;
        "Weight Lifting Exercises": Exercise;
        "Other Exercises": Exercise;
        [key: string]: Exercise;
      };
    };
    Food: {
      FoodList: {
        [key: string]: Nutrients;
      };
      "List of Supplements": string[];
      "Not found foods": {
        [key: string]: Nutrients;
      };
    };
    Note: { Note: string; Rating: number };
    Nutrition: {
      Total: Nutrients;
    };
    "Sleep & Weight": {
      "Sleep End": Date;
      "Sleep Start": Date;
      "Sleep Quality": number;
      Weight: [number, string];
    };
  };
}

function EditEntryPage() {
  const api = useApi();
    const { view } = useParams();
  const initialView = view || "Note"; // Default to "Note" if view is not specified

  const navigate = useNavigate();
  const [entryData, setEntryData] = useState<EntryData>();
  const [noteProcessed, setNoteProcessed] = useState<boolean>(true);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);
  const [images, setImages] = useState<string[]>([]);
  const today_date =
    dayjs().hour() < 3
      ? dayjs().subtract(1, "day").format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD");
  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  const initialLoad = async () => {
    api
      .get(`/phaero_note/get/`, { params: { specific_date: today_date } })
      .then((response) => {
        setEntryData(response.data.result);
        const decodedImages = response.data.images.map((img: string) => `data:image/jpeg;base64,${img}`);
        setImages(decodedImages);
        console.log(response.data.images);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  return (

    <div className="flex flex-col items-center w-full">
      {!noteProcessed && (
        <ConfirmationPopup
          setIsOpen={setNoteProcessed}
          message="You have to process your note before you can edit the details here."
          onCancel={() => navigate("/home")}
          onConfirm={() => navigate("/home")}
          hideCancel={true}
        />
      )}
      {entryData && (
        <EditEntry
          entryData={entryData}
          images={images}
          setEntryData={setEntryData}
          noteProcessed={noteProcessed}
          initialView={initialView as any}
        />
      )}
    </div>
  );
}

export default EditEntryPage;
