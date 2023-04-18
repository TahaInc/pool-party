import { useRef } from "react";

function PrivateMatch(props) {
  const gameCode = useRef(null);

  return (
    <>
      <div className="centered_menu">
        <div id="setting_menu">
          <h3>Join Game</h3>
          <input type="text" id="game_code" ref={gameCode} placeholder="Game Code" />
          <br />
          <button onClick={() => props.findPrivateGame(gameCode.current.value)}>Find game</button>
          <br />
          <hr style={{ width: "100%" }} />
          <br />
          <button onClick={() => props.handleClick("private_settings")}>Create game</button>
        </div>

        <button className="back" onClick={() => props.handleClick("home")}>
          Main Menu
        </button>
      </div>
    </>
  );
}

export default PrivateMatch;
