import { useState } from "react";
import Home from "./pages/Home.js";
import Login from "./pages/Login.js";
import Matchmaking from "./pages/Matchmaking.js";

function App() {
  const [page, setPage] = useState("home");

  const handleClick = (page) => {
    setPage(page);
  };

  return (
    <>
      {(() => {
        switch (page) {
          case "home":
            return <Home handleClick={handleClick} />;
          case "login":
            return <Login handleClick={handleClick} login={true} />;
          case "register":
            return <Login handleClick={handleClick} login={false} />;
          case "matchmaking-public":
            return <Matchmaking handleClick={handleClick} public={true} />;
          case "matchmaking-private":
            return <Matchmaking handleClick={handleClick} public={false} />;
          default:
            return null;
        }
      })()}
    </>
  );
}

export default App;
