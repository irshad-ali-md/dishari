"use client";

import React, { useEffect, useState } from "react";
import {
  GestureRecognizer,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";

// import "@material/button/dist/mdc.button.css";
// import "@material/ripple/dist/mdc.ripple.css";

export default function Home() {
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [runningMode, setRunningMode] = useState("IMAGE");

  useEffect(() => {
    const initializeGestureRecognizer = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://cloud-object-storage-cos-standard-0pw.s3.us-east.cloud-object-storage.appdomain.cloud/asl_dataset.task",
        },
        runningMode
      });
      setGestureRecognizer(recognizer);
    };
    initializeGestureRecognizer();
  }, [runningMode]);

  const enableCam = () => {
    if (!gestureRecognizer) {
      alert("Please wait for gestureRecognizer to load");
      return;
    }

    if (webcamRunning) {
      setWebcamRunning(false);
    } else {
      setWebcamRunning(true);
    }

    const constraints = {
      video: true
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      const video = document.getElementById("webcam");
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });
  };

  let lastVideoTime = -1;

  const predictWebcam = async () => {
    const video = document.getElementById("webcam");
    const canvasElement = document.getElementById("output_canvas");
    const canvasCtx = canvasElement.getContext("2d");
    const gestureOutput = document.getElementById("gesture_output");

    if (gestureRecognizer) {
      if (runningMode === "IMAGE") {
        setRunningMode("VIDEO");
        gestureRecognizer.setOptions({ runningMode: "VIDEO" });
      }
      let nowInMs = Date.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = await gestureRecognizer.recognizeForVideo(video, nowInMs);
        setResults(results);
      }

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // const drawingUtils = new DrawingUtils(canvasCtx);

      if (results && results.landmarks) {
        for (const landmarks of results.landmarks) {
          drawConnectors(
            landmarks,
            HAND_CONNECTIONS,
            {
              color: "#00FF00",
              lineWidth: 5
            }
          );
          drawLandmarks(landmarks, {
            color: "#FF0000",
            lineWidth: 2
          });
        }
      }
      canvasCtx.restore();
      if (results && results.gestures.length > 0) {
        gestureOutput.style.display = "block";
        const categoryName = results.gestures[0][0].categoryName;
        const categoryScore = parseFloat(results.gestures[0][0].score * 100).toFixed(2);
        const handedness = results.handednesses[0][0].displayName;
        gestureOutput.innerText = `GestureRecognizer: ${categoryName}\n Confidence: ${categoryScore} %\n Handedness: ${handedness}`;
      } else {
        gestureOutput.style.display = "none";
      }
      if (webcamRunning) {
        window.requestAnimationFrame(predictWebcam);
      }
    }
  };

  return (
    <div>
      <h1>Recognize hand gestures using the MediaPipe HandGestureRecognizer task</h1>
      <section id="demos" className={gestureRecognizer ? "" : "invisible"}>
        <h2><br />Demo: Webcam continuous hand gesture detection</h2>
        <p>Use your hand to make gestures in front of the camera to get gesture classification.<br />Click <b>enable webcam</b> below and grant access to the webcam if prompted.</p>

        <div id="liveView" className="videoView">
          <button id="webcamButton" className="mdc-button mdc-button--raised" onClick={enableCam}>
            <span className="mdc-button__ripple"></span>
            <span className="mdc-button__label">{webcamRunning ? "DISABLE PREDICTIONS" : "ENABLE PREDICTIONS"}</span>
          </button>
          <div style={{ position: "relative" }}>
            <video id="webcam" autoPlay playsInline></video>
            <canvas className="output_canvas" id="output_canvas" width="1280" height="720" style={{ position: "absolute", left: "0px", top: "0px" }}></canvas>
            <p id='gesture_output' className="output"></p>
          </div>
        </div>
      </section>
    </div>
  );
};
