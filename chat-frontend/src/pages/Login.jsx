import { useState } from "react";
import axios from "axios";
import './Login.css'

function Login({ setUser, goToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post(
        "http://localhost:8000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("token", res.data.token);

      setUser(res.data.user);

    } catch (err) {
      alert("Login failed");
    }
  };

  return (
    <div className="auth-page">
  <div className="login-card">
      <h2>Login</h2>
      
   

     <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
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