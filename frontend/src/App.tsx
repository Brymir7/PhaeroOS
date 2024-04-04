import React, { Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext.tsx";
import "./App.css";
import { useWindowWidth } from "./components/utils/CustomHooks.tsx";
import { MapKeysProvider } from "./components/contexts/MapKeysContext.tsx";
import { HandleAllErrorsProvider } from "./components/contexts/HandleAllErrors.tsx";
import HomeLayout from "./components/homeLayout/HomeLayout.tsx";
import CheckListPage from "./pages/ChecklistPage.tsx";
import EditEntryPage from "./pages/EditEntryPage.tsx";
// import FeedbackPage from "./pages/FeedbackPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import NotesPage from "./pages/NotesPage.tsx";
import StatisticsPage from "./pages/StatisticsPage.tsx";
import TranscriptionPage from "./pages/TranscriptionPage.tsx";
import PrivacyNotice from "./pages/PrivacyNotice.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import { CircularProgress } from "@mui/material";
import { JournalNoteProvider } from "./components/contexts/JournalNoteContext.tsx";
import { RedirectToHomePage } from "./pages/RedirectToHomepage.tsx";
import HabitPage from "./pages/HabitPage.tsx";
import { PossibleRoutesProvider } from "./components/contexts/PossiblesRoutesContext.tsx";
import { ThemeProvider } from "./ThemeContext.tsx";
const AuthPage = React.lazy(() => import("./pages/AuthPage.tsx"));
const PaymentPage = React.lazy(() => import("./pages/PricingPage"));
const SetupPage = React.lazy(() => import("./pages/SetupPage"));
const App: React.FunctionComponent = () => {
  const windowWidth = useWindowWidth();
  return (
    <BrowserRouter>
      <HandleAllErrorsProvider>
        <AuthProvider>
          <MapKeysProvider>
            <ThemeProvider>
              <JournalNoteProvider>
                <PossibleRoutesProvider>
                  <Suspense
                    fallback={
                      <div className="flex justify-center items-center h-screen bg-secondary">
                        <div className="w-10 h-10">
                          <CircularProgress color="primary" />
                        </div>
                      </div>
                    }
                  >
                    <Routes>
                      <Route path="/home" element={<HomeLayout />}>
                        <Route
                          index
                          element={
                            windowWidth < 1080 ? (
                              <TranscriptionPage />
                            ) : (
                              <HomePage />
                            )
                          }
                        />
                        <Route path="edit-entry" element={<EditEntryPage />}>
                          <Route path=":view" element={<EditEntryPage />} />
                        </Route>

                        <Route path="checklist" element={<CheckListPage />} />
                        <Route path="habits" element={<HabitPage />} />
                        <Route path="statistics" element={<StatisticsPage />} />
                        <Route path="notes" element={<NotesPage />} >
                          <Route path="notes" element={<NotesPage />} />
                          <Route path=":view" element={<NotesPage />} />
                        </Route>
                        {/* <Route path="feedback" element={<FeedbackPage />} /> */}
                      </Route>
                      <Route path="/login" element={<AuthPage />} />
                      <Route path="*" element={<RedirectToHomePage />} />
                      <Route path="/signup" element={<AuthPage />} />
                      <Route path="/pricing" element={<PaymentPage />} />
                      <Route path="/setup" element={<SetupPage />} />
                      <Route
                        path="/privacy-policy"
                        element={<PrivacyNotice />}
                      />
                      <Route
                        path="/terms-and-conditions"
                        element={<TermsOfService />}
                      />
                    </Routes>
                  </Suspense>
                </PossibleRoutesProvider>
              </JournalNoteProvider>
            </ThemeProvider>
          </MapKeysProvider>
        </AuthProvider>
      </HandleAllErrorsProvider>
    </BrowserRouter>
  );
};

export default App;
