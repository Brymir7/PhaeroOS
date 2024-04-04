import { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { HandleAllErrorsContext } from "../contexts/HandleAllErrors";
import { MapKeysContext } from "../contexts/MapKeysContext";
import { TextField, Button, Typography, Paper } from "@mui/material";
interface FormData {
  email_address: string;
  password: string;
}
function Login() {
  const { login } = useContext(AuthContext);
  const { handleAllErrors } = useContext(HandleAllErrorsContext);
  const { mapKeys } = useContext(MapKeysContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    email_address: "",
    password: "",
  });

  const [errors, setErrors] = useState<any>({
    email_address: "",
    password: "",
    form: "",
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:7000/api/v1/auth/login", formData, { withCredentials: true });
      if (response.data.access_token) {
        login();
        navigate("/home");
      }
    } catch (error: any) {
      if (error.response && error.response.data.detail) {
        setErrors({ ...errors, form: error.response.data.detail });
      } else {
        handleAllErrors(mapKeys("Login Failed"));
      }
    }
  };

  return (
    <Paper elevation={3} className="p-4">
      <form onSubmit={handleSubmit} noValidate>
        <Typography variant="h5">{mapKeys("Login")}</Typography>
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
        <a
          href="mailto:gorillabrainai@gmail.com"
          className="items-center justify-center flex pb-2 gap-3"
        >
          <Typography>{mapKeys("Forgot your password?")}</Typography>
          <Button
            variant="outlined"
            color="primary"
            sx={{
              textTransform: "none",
            }}
          >
            {mapKeys("Email Support")}
          </Button>
        </a>

        {errors.form && <Typography color="error">{errors.form}</Typography>}
        <Button type="submit" variant={formData.password && formData.email_address ? "contained" : "outlined"} color="primary" fullWidth>
          {mapKeys("Login")}
        </Button>

      </form>
    </Paper>
  );
}

export default Login;
