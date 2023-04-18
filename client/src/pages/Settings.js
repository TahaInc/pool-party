import { useState } from "react";

function Settings(props) {
  const [players, setPlayers] = useState(null);
  const [wager, setWager] = useState(null);

  function findGame() {
    if (props.public) {
      props.findPublicGame(players, wager);
    } else {
      props.createPrivateGame(players, wager);
    }
  }

  return (
    <>
      <div className="centered_menu">
        <div id="setting_menu">
          <h3>Settings</h3>
          <div className="settings_row">
            <div className={"settings_button" + (wager !== 3 ? "" : " disabled") + (players === 2 ? " selected" : "")} onClick={() => setPlayers(2)}>
              2 Players
            </div>
            <div className={"settings_button" + (wager !== 3 ? "" : " disabled") + (players === 3 ? " selected" : "")} onClick={() => setPlayers(3)}>
              3 Players
            </div>
            <div className={"settings_button" + (wager !== 100 ? "" : " disabled") + (players === 5 ? " selected" : "")} onClick={() => setPlayers(5)}>
              5 Players
            </div>
          </div>
          <div className="settings_row">
            <div className={"settings_button" + (players !== 2 && players !== 3 ? "" : " disabled") + (wager === 3 ? " selected" : "")} onClick={() => setWager(3)}>
              $3.00
            </div>
            <div className={"settings_button" + (wager === 5 ? " selected" : "")} onClick={() => setWager(5)}>
              $5.00
            </div>
            <div className={"settings_button" + (wager === 10 ? " selected" : "")} onClick={() => setWager(10)}>
              $10.00
            </div>
            <div className={"settings_button" + (wager === 25 ? " selected" : "")} onClick={() => setWager(25)}>
              $25.00
            </div>
            <div className={"settings_button" + (wager === 50 ? " selected" : "")} onClick={() => setWager(50)}>
              $50.00
            </div>
            <div className={"settings_button" + (players !== 5 ? "" : " disabled") + (wager === 100 ? " selected" : "")} onClick={() => setWager(100)}>
              $100.00
            </div>
          </div>
          <br />
          <button className={players !== null && wager !== null ? "" : "disable"} onClick={findGame}>
            Start
          </button>
        </div>

        <button className="back" onClick={() => props.handleClick("home")}>
          Main Menu
        </button>
      </div>
    </>
  );
}

export default Settings;
