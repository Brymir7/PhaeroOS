interface ButtonConfig {
  [key: string]: { label: string; value: number }[];
}
export const buttonConfig: ButtonConfig = {
    weight: [
      { label: "0", value: 0 },
    { label: "-5 kg", value: -5 },
      { label: "-1.25 kg", value: -1.25 },
      { label: "+1.25 kg", value: 1.25 },
      { label: "+5 kg", value: 5 },
      { label: "+40 kg", value: 40 },
    ],
    rest: [
      { label: "0", value: 0 },
      { label: "-0.25 min", value: -0.25 },
      { label: "+0.25 min", value: 0.25 },
      { label: "+1 min", value: 1 },
      { label: "+3 min", value: 3 },
    ],
    duration: [
      { label: "0", value: 0 },
      { label: "-0.5 min", value: -0.5 },
      { label: "+0.5 min", value: 0.5 },
      { label: "+5 min", value: 5 },
      { label: "+10 min", value: 10 },
    ],
    distance: [
      { label: "0", value: 0 },
      { label: "-0.5 km", value: -0.5 },
      { label: "+0.5 km", value: 0.5 },
      { label: "+1 km", value: 1 },
      { label: "+2 km", value: 2 },
    ],
    calories: [
      { label: "0", value: 0 },
      { label: "-50 cal", value: -50 },
      { label: "+50 cal", value: 50 },
      { label: "+100 cal", value: 100 },
      { label: "+200 cal", value: 200 },
    ],
    reps: [
      { label: "0", value: 0 },
      { label: "-1 rep", value: -1 },
      { label: "+1 rep", value: 1 },
      { label: "+5 reps", value: 5 },
      { label: "+10 reps", value: 10 },
    ],
    sets: [
      { label: "0", value: 0 },
      { label: "-1 set", value: -1 },
      { label: "+1 set", value: 1 },
      { label: "+3 set", value: 3 },
      { label: "+5 set", value: 5 },
  ],
  elevation: [
    { label: "0", value: 0 },
    { label: "-10 m", value: -10 },
    { label: "+10 m", value: 10 },
    { label: "+50 m", value: 50 },
    { label: "+100 m", value: 100 },
  ],
  };
