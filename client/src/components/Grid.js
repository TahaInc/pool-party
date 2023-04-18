import { useState, useEffect } from "react";
import Square from "./Square.js";

function Grid(props) {
  const [square, setSquare] = useState(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let revealTimeout = props.result[0];
    for (let i = 1; i < props.result.length; i++) {
      setTimeout(() => {
        if (i + 1 === props.result.length) {
          setSquare(props.result[i]);
          setTimeout(() => {
            setDone(true);

            setTimeout(() => {
              props.finishGame(props.result[i]);
            }, 3000);
          }, revealTimeout); // Random time between 500ms & 1500ms
        } else {
          setSquare(props.result[i]);
        }
      }, i * 100 + 3.5 ** (i / 5));
    }

    return () => {};
  }, [props.result, props.picks]);

  let squares = [];
  for (let i = 0; i < props.playerAmount * 5; i++) squares.push(<Square key={i} number={i} pickSquare={props.pickSquare} selected={square === i ? true : false} done={done ? true : false} color={props.picks[i]?.color} />);

  return (
    <div className="grid_container">
      {props.mouseDots}
      <div className="grid" onMouseMove={props.updateMouse} onMouseLeave={props.removeMouse}>
        {squares}
      </div>
    </div>
  );
}

export default Grid;
