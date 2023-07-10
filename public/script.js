const img = document.querySelector("img");
const canvas = document.querySelector("canvas");
let lastModel;
let lastClassName;
let warmedUp = false;

setupButton(
  "tfjs-webgl",
  async () =>
    await tfTask.ImageSegmentation.Deeplab.TFJS.load({
      backend: "webgl"
    }),
  true
);

setupButton(
  "tflite",
  async () => await tfTask.ImageSegmentation.Deeplab.TFLite.load()
);

setupButton(
  "tflite-custom",
  async () =>
    await tfTask.ImageSegmentation.CustomModel.TFLite.load({
      // mobilenetv2-coco
      model:
        "https://tfhub.dev/sayakpaul/lite-model/mobilenetv2-coco/fp16/1?lite-format=tflite"
    })
);

async function setupButton(className, modelCreateFn, needWarmup) {
  document
    .querySelector(`.model.${className} .btn`)
    .classList.remove("disabled");
  const resultEle = document.querySelector(`.model.${className} .result`);
  document
    .querySelector(`.model.${className} .btn`)
    .addEventListener("click", async () => {
      let model;
      // Create the model when user clicks on a button.
      if (lastClassName !== className) {
        // Clean up the previous model if existed.
        if (lastModel) {
          lastModel.cleanUp();
        }
        // Create the new model and save it.
        resultEle.textContent = "Loading...";
        model = await modelCreateFn();
        lastModel = model;
        lastClassName = className;
      }
      // Reuse the model if user clicks on the same button.
      else {
        model = lastModel;
      }

      // Warm up if needed.
      if (needWarmup && !warmedUp) {
        await model.predict(img);
        warmedUp = true;
      }

      // Run inference and update result.
      const start = Date.now();
      const result = await model.predict(img);
      const latency = Date.now() - start;
      renderCanvas(result);
      resultEle.textContent = `Latency: ${latency}ms`;
    });
}

function renderCanvas(result) {
  const ctx = canvas.getContext("2d");
  canvas.width = result.width;
  canvas.height = result.height;
  ctx.clearRect(0, 0, result.width, result.height);
  ctx.putImageData(
    new ImageData(result.segmentationMap, result.width, result.height),
    0,
    0
  );
  document.querySelector(".img-container").appendChild(canvas);

  // Stretch the canvas to the same size as the image.
  canvas.style.width = `${img.width}px`;
  canvas.style.height = `${img.height}px`;
}
