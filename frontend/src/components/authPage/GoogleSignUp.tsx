import { useContext, useState, useEffect } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { Button, Typography } from "@mui/material";

function GoogleSignUp() {
  const { login } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);

  const [code, setCode] = useState<unknown>();

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: (codeResponse) => setCode(codeResponse),
    onError: () => handleAllErrors(mapKeys("Login Failed")),
  });

  const createAccount = async () => {
    try {
      const authentication = await axios.post(
        "http://localhost:7000/api/v1/auth/google/signup",
        code,
        { withCredentials: true }
      );
      if (authentication.data.authenticated) {
        login();
        setupPage();
      }
    } catch (error) {
      handleAllErrors(mapKeys("User already exists"));
    }
  };
  useEffect(() => {
    if (code) {
      createAccount();
    }
  }, [code]);

  const navigate = useNavigate();
  const setupPage = () => {
    return navigate("/setup");
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      {/* <p>or</p> */}
      <Button
        variant="outlined"
        className="gap-2"
        sx={{
          textTransform: "none",
        }}
        onClick={() => googleLogin()}
      >
        <Typography>{mapKeys("Sign up with Google")}</Typography>
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
export default GoogleSignUp;
