import { IconDefinition, faChartSimple, faFileLines, faHouse, faMessage, faSquareCheck, faTasks } from '@fortawesome/free-solid-svg-icons';
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

interface PossibleRoutesContextType {
  currentLayout: Layout;
  setCurrentLayout: (layout: Layout) => void;
  navigateToPage: (route: string) => void;
  primaryRoutes: string[];
  secondaryRoutes: { text: string, route: string, icon: IconDefinition }[];
  currentPage: string;
}

const primaryRoutes = [
  "Chat",
  'Sleep Diagrams',
  'My Entries',
  'Nutrition Diagrams',
  'Bench Press Progression',
  'Step Count Diagram',
  'My Habits',
  'My Checklist',
  'My Feedback',
] as const;
export type Layout = typeof primaryRoutes[number];

const secondaryRoutes = [
  { text: 'Main', route: '/home', icon: faHouse },
  { text: 'Habits', route: '/home/habits', icon: faTasks },
  { text: 'Checklist', route: '/home/checklist', icon: faSquareCheck },
  { text: "Feedback", route: '/home/feedback', icon: faMessage },
  { text: 'All Statistics', route: '/home/statistics', icon: faChartSimple },
  { text: 'Notes', route: '/home/notes', icon: faFileLines }
];

const PossibleRoutesContext = createContext<PossibleRoutesContextType | undefined>(undefined);

export const PossibleRoutesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLayout, setCurrentLayout] = useState<Layout>('Chat');
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<string>('Main');
  const location = useLocation();
  useEffect(() => {
    switch (location.pathname) {
      case "/home":
        setCurrentPage("Dashboard");
        break;
      case "/home/":
        setCurrentPage("Dashboard");
        break;
      case "/home/checklist":
        setCurrentPage("Checklist");
        break;
      case "/home/edit-entry":
        setCurrentPage("Edit");
        break;
      case "/home/edit-entry/food":
        setCurrentPage("Edit");
        break;
      case "/home/edit-entry/exercise":
        setCurrentPage("Edit");
        break;
      case "/home/edit-entry/note":
        setCurrentPage("Edit");
        break;
      case "/home/edit-entry/sleep":
        setCurrentPage("Edit");
        break;
      case "/home/edit-entry/weight":
        setCurrentPage("Edit");
        break;
      case "/home/statistics":
        setCurrentPage("Statistics");
        break;
      case "/home/notes":
        setCurrentPage("Notes");
        break;
      case "/home/feedback":
        setCurrentPage("Feedback");
        break;
      case "/home/goals":
        setCurrentPage("Goals");
        break;
      case "/home/insights":
        setCurrentPage("Insights");
        break;
      case "/home/habits":
        setCurrentPage("Habits");
        break;
      default:
        break;
    }
  }, [location.pathname]);
  const navigateToPage = (route: string) => {
    navigate( route);
  };

  return (
    <PossibleRoutesContext.Provider value={{ currentLayout, setCurrentLayout, navigateToPage, primaryRoutes: [...primaryRoutes], secondaryRoutes, currentPage }}>
      {children}
    </PossibleRoutesContext.Provider>
  );
};

export const usePossibleRoutes = (): PossibleRoutesContextType => {
  const context = useContext(PossibleRoutesContext);
  if (!context) {
    throw new Error('usePossibleRoutes must be used within a PossibleRoutesProvider');
  }
  return context;
};
