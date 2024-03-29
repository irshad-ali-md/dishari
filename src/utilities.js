// Define our labelmap
const labelMap = {
  1: { name: "Explain", color: "red" },
  // 2: { name: "Thank You", color: "yellow" },
  3: { name: "Different", color: "lime" },
  4: { name: "Systems", color: "blue" },
  5: { name: "Operating", color: "purple" },
  1: { name: "one", color: "yellow" },
  2: { name: "two", color: "black" },
  3: { name: "three", color: "grey" },
  4: { name: "four", color: "white" },
  5: { name: "five", color: "brown" },
};

// Define a drawing function
export const drawRect = (
  boxes,
  classes,
  scores,
  threshold,
  imgWidth,
  imgHeight,
  ctx,
  setInputText,
  setTriggerApiCall
) => {
  for (let i = 0; i <= boxes.length; i++) {
    // let i = 0;
    if (boxes[i] && classes[i] && scores[i] > threshold) {
      // Extract variables
      const [y, x, height, width] = boxes[i];
      const text = classes[i];
      console.log("text::", text);
      const name = labelMap[text]["name"];
      // if (text === 3) {
      //   setTriggerApiCall(true);
      // } else {
        setInputText((prevState) => {
          const intArr = prevState || [];
          intArr.push(name);
          const uniqArr = intArr.filter((o, i) => intArr[i - 1] !== o);
          return console.log({ uniqArr }) || uniqArr;
        });
      // }
      // console.log("name::", name);
      const color = labelMap[text]["color"];

      // Set styling
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.fillStyle = "white";
      ctx.font = "30px Arial";

      // DRAW!!
      ctx.beginPath();
      ctx.fillText(
        name + " - " + Math.round(scores[i] * 100) / 100,
        x * imgWidth,
        y * imgHeight - 10
      );
      ctx.rect(
        x * imgWidth,
        y * imgHeight,
        (width * imgWidth) / 2,
        (height * imgHeight) / 1.5
      );
      ctx.stroke();
    }
  }
};
