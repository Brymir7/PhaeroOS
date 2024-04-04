import { useLocation, useNavigate } from "react-router-dom";
import React, { createContext } from "react";
import { Alert, Slide, SlideProps, Snackbar } from "@mui/material";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { JSX } from "react/jsx-runtime";

interface HandleAllErrorsContextType {
  handleAllErrors: (error: string | unknown) => void;
}
export const HandleAllErrorsContext = createContext<HandleAllErrorsContextType>(
  {
    handleAllErrors: () => "",
  }
);

export const HandleAllErrorsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState<string>("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setOpen(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAllErrors = (error: string | any) => {
    if (typeof error === "string") {
      setMessage(error);
      setOpen(true);
    }
    if (error.code === "ECONNABORTED") {
      setMessage(
        `Request timeout, please reload the page and check whether it has been processed, otherwise try again. If the problem persists, please don't hesitate to contact support`
      );
      setOpen(true);
    }
    if (error.response) {
      if (
        error.response.status === 401 &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup"
      ) {
        navigate("/login");
      }
      if (
        error.response.status === 402 &&
        location.pathname !== "/login" &&
        location.pathname !== "/signup" &&
        location.pathname !== "/setup"
      ) {
        navigate("/pricing");
      }
    }
  };
  const Transition = (props: JSX.IntrinsicAttributes & SlideProps) => (
    <Slide {...props} direction="up" />
  );

  return (
    <HandleAllErrorsContext.Provider value={{ handleAllErrors }}>
      {children}
      <Snackbar
        sx={{ pointerEvents: open ? "auto" : "none" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={Transition} // Apply custom Slide transition
      >
        <Alert
          sx={{
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
            outline: "solid 1px red",
            borderRadius: "4px",
            width: "100%",
          }}
          onClose={handleClose}
          severity="error"
          icon={<FontAwesomeIcon icon={faCircleExclamation} />}
        >
          {message}
        </Alert>
      </Snackbar>
    </HandleAllErrorsContext.Provider>
  );
};
