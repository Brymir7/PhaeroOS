import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="37778987241-jtucnkhgsaaidd4keomvfk3uvnv76r6s.apps.googleusercontent.com">
    {/*<React.StrictMode>*/}
      <App />
    {/* </React.StrictMode> */}
  </GoogleOAuthProvider>
);
