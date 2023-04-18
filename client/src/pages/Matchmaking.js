import { useState, useEffect } from "react";
import Settings from "./Settings.js";
import PrivateMatch from "./PrivateMatch.js";
import Game from "./Game.js";
import End from "./End.js";

function Matchmaking(props) {
  const [userInfo, setUserInfo] = useState(false);
  const [winningAmount, setWinningAmount] = useState(0);
  const [page, setPage] = useState(null);
  const [filter, setFilter] = useState({});

  const handleClick = (page) => {
    if (page === "home") {
      props.handleClick("home");
    } else {
      setPage(page);
    }
  };

  function findPublicGame(players, wager) {
    setFilter({ public: true, playerAmount: players, wagerAmount: wager });
    setPage("game");
  }

  function findPrivateGame(gameCode) {
    setFilter({ public: false, gameCode: gameCode });
    setPage("game");
  }

  function createPrivateGame(players, wager) {
    setFilter({ public: false, playerAmount: players, wagerAmount: wager });
    setPage("game");
  }

  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/user", { credentials: "include" })
      .then(async (response) => response.json())
      .then((data) => {
        if (data) {
          setUserInfo(data);
          if (props.public) {
            setPage("public_settings");
          } else {
            setPage("private_match");
          }
        } else {
          props.handleClick("login");
        }
      });
  }, [props]);

  return (
    <>
      {(() => {
        switch (page) {
          case "public_settings":
            return <Settings handleClick={handleClick} findPublicGame={findPublicGame} public={true} />;
          case "private_settings":
            return <Settings handleClick={handleClick} createPrivateGame={createPrivateGame} public={false} />;
          case "private_match":
            return <PrivateMatch handleClick={handleClick} findPrivateGame={findPrivateGame} />;
          case "game":
            return <Game handleClick={handleClick} mainMenu={props.handleClick} filter={filter} username={userInfo.username} setWinningAmount={setWinningAmount} />;
          case "end_won":
            return <End handleClick={handleClick} winner={true} winningAmount={winningAmount} />;
          case "end_lost":
            return <End handleClick={handleClick} winner={false} />;
          default:
            return null;
        }
      })()}
    </>
  );
}

export default Matchmaking;
