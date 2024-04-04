import { useState } from "react";
import TimePicker from "./TimePicker";
import { Grid, Paper, Typography } from "@mui/material";

interface Props {
  date: Date;
  handleDateEdit: (newDate: Date) => void;
  viewOnly?: boolean;
  label: JSX.Element;
}

const EditDatetime = ({
  date,
  handleDateEdit,
  label,
  viewOnly = false,
}: Props) => {
  const [editDate, setEditDate] = useState<Date>(new Date(date));
  return (
    <Paper
      elevation={2}
      className="flex items-center justify-between align-middle"
    >
      <Grid container spacing={2} direction={"row"} sx={{paddingTop: 1}}>
        <Grid item className="whitespace-nowrap" xs={12} sm={12}>
          <Typography component={"label"} sx={{ fontSize: "18px" }}>
            {label}
          </Typography>
        </Grid>
        <Grid item className="flex px-4 py-2 items-center justify-center" xs={12} sm={12}>
          <TimePicker
            editDate={editDate}
            viewOnly={viewOnly}
            setEditDate={setEditDate}
            handleDateEdit={handleDateEdit}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default EditDatetime;
