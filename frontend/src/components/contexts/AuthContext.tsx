import React, { createContext, useContext, useEffect, useState } from "react";
import { HandleAllErrorsContext } from "./HandleAllErrors";
import axios from "axios";
import { useApi } from "../../modules/apiAxios";
export const AuthContext = createContext({
  isLoggedIn: false,
  loggedInUser: -1,
  login: async () => false,
  logout: () => { },
  refreshAccessToken: async () => false,
  refreshed: false,
  hasAccess: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUser] = useState<number>(-1);
  const [refreshed, setRefreshed] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const api = useApi();

  useEffect(() => {
    if (
      location.pathname === "/signup" ||
      location.pathname === "/pricing"
    ) {
      return;
    } else {
      api
        .get("/status/")
        .then(() => setHasAccess(true))
        .catch((error) => {
          handleAllErrors(error);
          setHasAccess(false);
        });
    }
  }, [isLoggedIn, location.pathname]);

  const verifyAccessToken = async () => {
    const apiEndpoint = `http://localhost:7000/api/v1/auth/verify_token/`;

    try {
      const response = await axios.post(
        apiEndpoint,
        {},
        {
          withCredentials: true,
        }
      );
      return response.data.authenticated;
    } catch (error: unknown) {
      handleAllErrors(error);
      return false;
    }
  };

  const getNewAccessToken = async () => {
    const apiEndpoint = `http://localhost:7000/api/v1/auth/refresh_token/`;
    try {
      const response = await axios.post(
        apiEndpoint,
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error: unknown) {
      handleAllErrors(error);

      return false;
    }
  };

  const login = async (): Promise<boolean> => {
    const isValidAccessToken = await verifyAccessToken();
    if (!isValidAccessToken) {
      const accessTokenData = await getNewAccessToken();
      if (accessTokenData.authenticated) {
        setIsLoggedIn(true);
        return true;
      } else {
        setIsLoggedIn(false);
        return false;
      }
    } else {
      setIsLoggedIn(true);
      return true;
    }
  };

  const refreshAccessToken = async () => {
    const isValidAccessToken = await verifyAccessToken();
    if (!isValidAccessToken) {
      const accessTokenData = await getNewAccessToken();
      if (accessTokenData.authenticated) {
        setRefreshed(!refreshed);
        setIsLoggedIn(true);
        return true;
      } else {
        setIsLoggedIn(false);
        return false;
      }
    }
    setIsLoggedIn(false);
    return false;
  };
  const logout = () => {
    axios.get("http://localhost:7000/api/v1/auth/logout", {
      withCredentials: true,
    });
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        loggedInUser,
        login,
        logout,
        refreshAccessToken,
        refreshed,
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
