import { LinearProgress } from "@mui/material";
import React from "react";
import { SkyTooltip } from "../../utils/Tooltips";

interface ProgressBarProps {
  value: [number, string];
  recommendation?: [number, string];
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  recommendation = [0, ""],
}) => {
  const percentage = Math.round((value[0] / recommendation[0]) * 100);
  const validPercentage = Math.min(100, Math.max(0, percentage));
  return (
    <>
      {recommendation[0] == 0 ? (
        <div />
      ) : (
        <SkyTooltip enterDelay={100} disableInteractive placement="top" title={`${percentage}%`}>
          <div className="py-2 xsm:w-20 w-14">
            <LinearProgress

              color={"primary"}
              variant="determinate"
              value={validPercentage}
            />
          </div>
        </SkyTooltip>
      )}
    </>
  );
};
export default ProgressBar;
