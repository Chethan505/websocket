import { useState } from "react";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ChatApp from "./chatApp";
//App content
function App() {

  const [page, setPage] = useState("register");
  const [user, setUser] = useState(null);

  if (!user) {
    if (page === "register") {
      return (
        <Register goToLogin={() => setPage("login")} />
      );
    }

    return (
      <Login
        setUser={setUser}
        goToRegister={() => setPage("register")}
      />
    );
  }

  return <ChatApp user={user} />;
}

export default App;