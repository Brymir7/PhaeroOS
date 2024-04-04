import { useEffect } from "react";
import { useNavigate } from "react-router";


export const RedirectToHomePage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate("/home");
  }, []);
  return null;
}
