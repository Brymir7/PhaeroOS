import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useApi } from "../../modules/apiAxios";
import { translateToEnglish, translateToGerman } from "../utils/MapKeys";
import { HandleAllErrorsContext } from "./HandleAllErrors";
import { AuthContext } from "./AuthContext";
import {
  translateExercisesToEnglish,
  translateExercisesToGerman,
} from "../utils/MapExercises";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/de";
import { translateSupplementsToEnglish, translateSupplementsToGerman } from "../utils/MapFoods";

export enum Language {
  English = "english",
  German = "german",
}

interface MapKeysContextType {
  mapKeys: (input: string) => string;
  mapExercises: (input: string) => string;
  mapSupplements: (input: string) => string;
  language: Language;
}
export const MapKeysContext = createContext<MapKeysContextType>({
  mapKeys: () => "",
  mapExercises: () => "",
  mapSupplements: () => "",
  language: Language.English,
});

export const MapKeysProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const browserLanguage = navigator.language.includes("de") ? Language.German : Language.English;
  const api = useApi();
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);

  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  const [language, setLanguage] = useState<Language>(() => {
    if (localStorage.getItem("language")) {
      return localStorage.getItem("language") as Language;
    } else {
      return browserLanguage;
    }
  });

  useEffect(() => {
    if (hasAccess) localStorage.setItem("language", language);
  }, [language]);

  const mapKeys = useCallback(
    (input: string): string => {
      switch (language) {
        case Language.English:
          return translateToEnglish(input);
        case Language.German:
          return translateToGerman(input);
        default:
          return input;
      }
    },
    [language]
  );

  const mapExercises = useCallback(
    (input: string): string => {
      switch (language) {
        case Language.English:
          return translateExercisesToEnglish(input);
        case Language.German: {
          return translateExercisesToGerman(input);
        }
        default:
          return input;
      }
    },
    [language]
  );

  const mapSupplements = useCallback(
    (input: string): string => {
      switch (language) {
        case Language.English:
          return translateSupplementsToEnglish(input);
        case Language.German: {
          return translateSupplementsToGerman(input);
        }
        default:
          return input;
      }
    },
    [language]
  );

  const initialLoad = () => {
    api
      .get("/settings/language/")
      .then((response) => {
        setLanguage(response.data || browserLanguage);
      })
      .catch((error) => {
        handleAllErrors(error);
        setLanguage(browserLanguage); // Fallback language
      });
  };

  return (
    <MapKeysContext.Provider
      value={{
        mapKeys,
        mapExercises,
        mapSupplements,
        language,
      }}
    >
      <LocalizationProvider
        adapterLocale={language === "german" ? "de" : "en"}
        dateAdapter={AdapterDayjs}
      >
        {children}
      </LocalizationProvider>
    </MapKeysContext.Provider>
  );
};
