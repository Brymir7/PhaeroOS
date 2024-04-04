const CircularAudioProgress = ({ seconds, maxSeconds } : {seconds: number, maxSeconds: number}) => {
  const radius = 20; // Smaller radius for a smaller circle
  const circumference = 2 * Math.PI * radius;
  const progress = (seconds / maxSeconds) * circumference;

  return (
    <div className="absolute flex items-center justify-center translate-y-[33%] left-0 top-3">
      <div className="relative">
      <svg width="50" height="45" className="rotate-[-90deg]">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke="#e6e6e6"
          strokeWidth="8"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="transparent"
          stroke="#22c55e" // Green color
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
        />
      </svg>
    </div></div>
  );
};

export default CircularAudioProgress;
