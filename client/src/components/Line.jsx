/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
const Line = ({ bgColour, width, padding = "0.3px", bgImage }) => {
  return (
    <div
      className={`rounded ${width ? "w-" + width : "w-75"} align-self-center`}
      style={{ backgroundColor: bgColour, padding: padding, backgroundImage: bgImage }}
    ></div>
  );
};

export default Line;
