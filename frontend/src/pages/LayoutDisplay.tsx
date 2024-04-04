import React from 'react';
import { Layout } from '../components/contexts/PossiblesRoutesContext';
interface LayoutDisplayProps {
  layout: Layout;
}

// Mock components for each layout
const SleepDiagrams = () => <div>Sleep Diagrams Content</div>;
const MyEntries = () => <div>My Entries Content</div>;
const NutritionDiagrams = () => <div>Nutrition Diagrams Content</div>;
const BenchPressProgression = () => <div>Bench Press Progression Content</div>;
const StepCountDiagram = () => <div>Step Count Diagram Content</div>;
const MyHabits = () => <div>My Habits Content</div>;
const MyChecklist = () => <div>My Checklist Content</div>;
const MyFeedback = () => <div>My Feedback Content</div>;

// LayoutDisplay component that maps layout to components
const LayoutDisplay: React.FC<LayoutDisplayProps> = ({ layout }) => {
  const getComponent = () => {
    switch (layout) {
      case 'Sleep Diagrams': return <SleepDiagrams />;
      case 'My Entries': return <MyEntries />;
      case 'Nutrition Diagrams': return <NutritionDiagrams />;
      case 'Bench Press Progression': return <BenchPressProgression />;
      case 'Step Count Diagram': return <StepCountDiagram />;
      case 'My Habits': return <MyHabits />;
      case 'My Checklist': return <MyChecklist />;
      case 'My Feedback': return <MyFeedback />;
      default: return <div>Default Content</div>;
    }
  };

  return (
    <div>
      {getComponent()}
    </div>
  );
};

export default LayoutDisplay;
