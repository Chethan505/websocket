import { useState } from "react";
import axios from "axios";
import './Login.css'

function Login({ setUser, goToRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {

      const res = await axios.post(
        "http://localhost:8000/api/auth/login",
        {
          username,
          password
        }
      );

      console.log(res.data);

      // save token
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data));

      setUser(res.data);

      // update app state
      setUser({
        username: res.data.username
      });

    } catch (err) {

      alert(err.response?.data?.message || "Login failed");

    }
  };

  return (
    <div className="auth-page">
      <div className="login-card">
        <h2>Login</h2>



        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          Login
        </button>
        <p onClick={goToRegister}>
          Create account
        </p>
      </div>


    </div>










  );
}

export default Login;