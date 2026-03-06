import { useState } from "react";
import axios from "axios";
import "./Auth.css"

function Register({ goToLogin }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      await axios.post("http://localhost:8000/api/auth/register", {
        username,
        email,
        password
      });

      alert("Registration successful");
      goToLogin();

    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
  <div className="auth-container">
    <div className="auth-card">

      <h2>Create Account</h2>

      <input type="text" placeholder="Username" />
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />

      <button>Register</button>

      <p className="auth-switch">

        Already have an account?
      <span onClick={goToLogin}>Login</span>
      </p>

    </div>
  </div>
);
}

export default Register;