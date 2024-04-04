import axios from "axios";
import { useContext } from "react";
import { AuthContext } from "../components/contexts/AuthContext";

export function useApi() {
  const api = axios.create({
    baseURL: "http://localhost:7000/api/v1/",
    withCredentials: true,
    timeout: 180000, // 3 minutes for feedback inclusion
  });
  const { refreshAccessToken } = useContext(AuthContext);

  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {

      if (error.message !== "Network Error") {
        return Promise.reject(error);
      }
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        const valid = await refreshAccessToken();
        if (!valid) {
          return Promise.reject(error);
        }
        return api(originalRequest);
      }
      return Promise.reject(error);
    }
  );
  return api;
}
