import Header from "../components/authPage/Header";
import GoogleLogin from "../components/authPage/GoogleLogin";
import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Link } from "react-router-dom";
import GoogleSignUp from "../components/authPage/GoogleSignUp";
import { Button, Paper, Typography } from "@mui/material";
import Login from "../components/authPage/RegularLogin";
import Signup from "../components/authPage/RegularSignUp";
import { AuthContext } from "../components/contexts/AuthContext";
import { MapKeysContext } from "../components/contexts/MapKeysContext";

let deferredPrompt: any;

export default function AuthPage() {
  const { mapKeys } = useContext(MapKeysContext);
  const location = useLocation();
  const [installable, setInstallable] = useState(false);

  useEffect(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      setInstallable(true);
    });

    window.addEventListener("appinstalled", () => {
      console.log("INSTALL: Success");
    });
  }, []);

  const handleInstallClick = () => {
    setInstallable(false);
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === "accepted") {
        console.log("User accepted the install prompt");
      } else {
        console.log("User dismissed the install prompt");
      }
    });
  };

  const { hasAccess } = useContext(AuthContext);
  const navigate = useNavigate();

  const isLogin = location.pathname !== "/signup";

  useEffect(() => {
    if (hasAccess && isLogin) {
      navigate("/home");
    }
  }, [hasAccess, isLogin]);

  return (
    <div
      className={`min-h-full h-screen flex items-center bg-custom justify-center py-12 px-4 sm:px-6 lg:px-8`}
    >
      <Paper
        elevation={3}
        className="max-w-md w-full bright-div space-y-1  p-4 rounded-lg"
      >
        {isLogin ? (
          <>
            <Header
              heading={mapKeys("Login to your account")}
              paragraph={mapKeys("Don't have an account yet?")}
              linkName="Signup"
              linkUrl="/signup"
            />            <GoogleLogin />

            <Typography className="text-center text-sm mt-5">
              {mapKeys("or")}
            </Typography>
            <Login />
          </>
        ) : (
          <>
            <Header
              heading={mapKeys("Signup to create an account")}
              paragraph={mapKeys("Already have an account?")}
              linkName="Login"
              linkUrl="/login"
            />
            {installable && (
              <div className="flex justify-center">
                <Button
                  onClick={handleInstallClick}
                  variant="contained"
                  color="primary"
                >
                  {mapKeys("Click here to install Phaero")}
                </Button>
              </div>
            )}            <GoogleSignUp />

            <Typography className="text-center text-sm mt-5">
              {mapKeys("or")}
            </Typography>
            <Signup />
            <div className="text-sm px-6 text-center">
              <span>
                {mapKeys("By registering with Phaero, you agree to our")}{" "}
              </span>
              <Link className="text-sky-400" to={"/privacy-policy"}>
                {mapKeys("Privacy Policy")}
              </Link>
              <span> {mapKeys("and")} </span>
              <Link className="text-sky-400" to={"/terms-and-conditions"}>
                {mapKeys("Terms and Conditions")}
              </Link>
              <span>{mapKeys("AGB zu")}</span>
            </div>
          </>
        )}
      </Paper>
      <div id="overlay"></div>
    </div>
  );
}
