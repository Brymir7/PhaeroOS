import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../components/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useApi } from "../modules/apiAxios";
import SetUserInfoUi from "../components/setupPage/SetUserInfoUi";
import SetLanguageUi from "../components/setupPage/SetLanguageUi";
import { MapKeysContext } from "../components/contexts/MapKeysContext";
import { HandleAllErrorsContext } from "../components/contexts/HandleAllErrors";
import Disclaimer from "../components/setupPage/Disclaimer";
import { Paper, Typography } from "@mui/material";

function SetupPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { isLoggedIn, login, refreshed } = useContext(AuthContext);
  const { mapKeys } = useContext(MapKeysContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { hasAccess } = useContext(AuthContext);

  useEffect(() => {
    if (hasAccess) initialLoad();
  }, [hasAccess]);

  useEffect(() => {
    // we have to check for validity of access token every time we load the page
    const asyncLoginWrapper = async () => {
      const authenticationValid = await login();
      if (!authenticationValid) {
        navigate("/login");
      }
    };
    asyncLoginWrapper();
  }, [isLoggedIn, refreshed]);

  const initialLoad = () => {
    api
      .get("/setup_user/check/")
      .then((response) => {
        if (response.data == true) {
          navigate("/home");
        }
      })
      .catch((error) => {
        handleAllErrors(error);
      });
  };

  return (
    <div className="flex flex-col bg-custom w-screen min-h-screen justify-center items-center">
      <div id="overlay"></div>
      <Paper
        elevation={3}
        className="bright-div px-4 py-6 space-y-4 flex flex-col"
      >
        <Typography
          variant="h5"
          className="text-center mx-auto whitespace-nowrap font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
        >
          {mapKeys("Welcome to Phaero")}
        </Typography>

        {step === 1 && <SetLanguageUi onSubmit={() => setStep(2)} />}
        {step === 2 && (
          <Disclaimer
            onCancel={() => navigate("/")}
            onSubmit={() => setStep(3)}
          />
        )}

        {step === 3 && <SetUserInfoUi />}
      </Paper>
    </div>
  );
}

export default SetupPage;
