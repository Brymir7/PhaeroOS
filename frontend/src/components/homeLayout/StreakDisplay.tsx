import { useState, useEffect } from 'react';

const StreakDisplay = ({ streak, getStreakNumberColor, displayFlame }: {
  streak: number;
  getStreakNumberColor: () => string;
  displayFlame: () => JSX.Element;

}) => {
  const [showStreak, setShowStreak] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 376);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 450);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStreakClick = () => {
    if (isSmallScreen) {
      setShowStreak(!showStreak);
    }
  };

return (
    streak > 0 && (
      <div
        className="w-fit flex-shrink-0 h-12  text-lg flex items-center justify-center"
        onClick={handleStreakClick}
        style={{ cursor: isSmallScreen ? 'pointer' : 'default' }}
      >
        {(!isSmallScreen || showStreak) && (
          <p
            style={{ fontWeight: '500' }}
            className={`mt-1 text-3xl text-flm ${getStreakNumberColor()}`}
          >
            {streak}
          </p>
        )}
        <div className="h-8 w-10 flex items-center justify-center">
          {displayFlame()}
        </div>
      </div>
    )
  );
};

export default StreakDisplay;
