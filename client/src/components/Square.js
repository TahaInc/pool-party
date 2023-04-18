const Square = (props) => {
  function getLighterShade(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);

    const lightenFactor = 0.5; // Change this value to adjust the lightness
    const newR = Math.min(255, r + r * lightenFactor);
    const newG = Math.min(255, g + g * lightenFactor);
    const newB = Math.min(255, b + b * lightenFactor);

    return "#" + ((1 << 24) | (newR << 16) | (newG << 8) | newB).toString(16).slice(1);
  }

  return (
    <div onClick={() => props.pickSquare(props.number)} className={"square" + (props?.color ? " picked" : "") + (props.selected ? " selected" : "") + (props.done ? " done" : "")} style={{ backgroundColor: props.selected ? getLighterShade(props.color) : props.color }}>
      {props.number + 1}
    </div>
  );
};

export default Square;
