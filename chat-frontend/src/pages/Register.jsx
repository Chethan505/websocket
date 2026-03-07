import { useState } from "react";
import axios from "axios";
import "./Auth.css"

function Register({ goToLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    console.log("Registering:", username, password);
    try {
      await axios.post("http://localhost:8000/api/auth/register", {
        username,

        password
      });

      alert("Registration successful");
      goToLogin();

    } catch (err) {

      const message =
        err.response?.data?.message || "Registration failed";

      alert(message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">

        <h2>Create Account</h2>


        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleRegister}>Register</button>

        <p className="auth-switch">

          Already have an account?
          <span onClick={goToLogin}>Login</span>
        </p>

      </div>
    </div>
  );
}

export default Register;