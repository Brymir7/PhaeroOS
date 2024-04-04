import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { TextField, Button, Typography, Paper } from "@mui/material";

function Signup() {
  const { login } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email_address: "",
    password: "",
  });

  const [errors, setErrors] = useState<any>({});

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      axios.post("http://localhost:7000/api/v1/auth/register", formData, { withCredentials: true }).then(
        () => {
          login();
          navigate("/home");
        }
      );
    } catch (error: any) {
      if (error.response && error.response.data.detail) {
        setErrors({ ...errors, form: error.response.data.detail });
      } else {
        handleAllErrors(mapKeys("Signup Failed"));
      }
    }
  };

  return (
    <Paper elevation={3} className="p-4">
      <form onSubmit={handleSubmit} noValidate>
        <Typography variant="h5">{mapKeys("Sign Up")}</Typography>
        <TextField
          name="username"
          label={mapKeys("Username")}
          value={formData.username}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!errors.username}
          helperText={errors.username}
        />
        <TextField
          name="email_address"
          label={mapKeys("Email Address")}
          value={formData.email_address}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!errors.email_address}
          helperText={errors.email_address}
        />
        <TextField
          name="password"
          label={mapKeys("Password")}
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!errors.password}
          helperText={errors.password}
        />
        {errors.form && <Typography color="error">{errors.form}</Typography>}
        <Button type="submit" variant={formData.username && formData.email_address && formData.password ? "contained" : "outlined"} color="primary" fullWidth>
          {mapKeys("Sign Up")}
        </Button>
      </form>
    </Paper>
  );
}

export default Signup;
