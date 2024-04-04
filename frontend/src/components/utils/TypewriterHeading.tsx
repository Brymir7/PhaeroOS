import { useContext, useEffect, useState } from "react";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { AuthContext } from "../contexts/AuthContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { useApi } from "../../modules/apiAxios";
import Typewriter from "typewriter-effect";

const TypewriterHeading = () => {
  const { mapKeys } = useContext(MapKeysContext);
  const { hasAccess } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const api = useApi();

  const [timeOfDay, setTimeOfDay] = useState<string | undefined>(undefined);

  const [username, setUsername] = useState<string | undefined>(undefined);

  const getTimeOfDay = () => {
    const currentHour = new Date().getHours();
    let output = "Good_";
    if (currentHour < 12) {
      output += "morning";
    } else if (currentHour < 18) {
      output += "afternoon";
    } else {
      output += "evening";
    }
    setTimeOfDay(mapKeys(output));
  };

  useEffect(() => {
    if (hasAccess) {
      fetchUsername();
      getTimeOfDay();
    }
  }, [hasAccess]);

  const fetchUsername = () => {
    api
      .get(`/username/`)
      .then((response) => {
        if (response.data.username === "") {
          setUsername("User");
          return;
        }
        if (response.data.username.split(" ").length > 1) {
          setUsername(response.data.username.split(" ")[0]);
          return;
        }
        setUsername(response.data.username);
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };
  const windowWidth = window.innerWidth;
  return (
    <div className={`flex ${windowWidth < 768 ? "text-s mb-1 font-roboto" : "text-xl"} whitespace-nowrap w-full justify-center xsm:text-2xl sm:text-3xl px-4 pt-1 pb-2 mt-auto relative`}>
      <h2 className="opacity-0 ">
        {timeOfDay}, {username}
      </h2>
      {username && (
        <div className="absolute top-2 ">
          <Typewriter
            onInit={(typewriter) => {
              typewriter
                .changeDelay(30)
                .typeString(`${timeOfDay}, ${username}`)
                .start();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default TypewriterHeading;
