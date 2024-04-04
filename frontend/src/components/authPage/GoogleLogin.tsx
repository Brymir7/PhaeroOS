import { useContext, useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Button, Typography } from "@mui/material";


function GoogleLogin() {
  const { login } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);

  const [code, setCode] = useState<unknown>();

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: (codeResponse) => setCode(codeResponse),
    onError: () => handleAllErrors(mapKeys("Login Failed")),
  });
  const loginWithGoogle = async () => {
    try {
      const authentication = await axios.post(
        "http://localhost:7000/api/v1/auth/google/login",
        code,
        { withCredentials: true }
      );
      if (authentication.data.authenticated) {
        login();
        homePage();
      }
    } catch (error) {
      handleAllErrors(mapKeys("Login Failed"));
    }
  };
  useEffect(() => {
    if (code) {
      loginWithGoogle();
    }
  }, [code]);

  const navigate = useNavigate();
  const homePage = () => {
    return navigate("/home");
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* <p>or</p> */}
      <Button
        variant="outlined"
        className="gap-3"
        sx={{
          textTransform: "none",
        }}
        onClick={() => googleLogin()}
      >
        <Typography>{mapKeys("Log in with Google")}</Typography>
        <img
          draggable="false"
          className="w-6 h-6"
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          loading="lazy"
          alt="google logo"
        />
      </Button>
    </div>
  );
}
export default GoogleLogin;
