"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import "./Detect.css";
import { FilesetResolver, GestureRecognizer } from "@mediapipe/tasks-vision";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import { HAND_CONNECTIONS } from "@mediapipe/hands";
import Webcam from "react-webcam";
import {
  Button,
  Col,
  Flex,
  Image,
  Layout,
  Progress,
  Row,
  Typography,
  message,
} from "antd";
import {
  PicCenterOutlined,
  RobotOutlined,
  SendOutlined,
  SyncOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { faBackspace } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const { Content } = Layout;
const { Text, Title } = Typography;

let startTime = "";

const layoutStyle = {
  minHeight: "100vh",
};
const contentStyle = {
  minHeight: 100,
  color: "#fff",
  backgroundColor: "#fff",
};

const Creator = {
  Me: 0,
  Bot: 1,
};

const ChatMessage = ({ text, from }) => {
  return (
    <>
      {from == Creator.Me && (
        <div className="bg-sky-100 mt-2 p-4 rounded-lg flex gap-4 items-center whitespace-pre-wrap">
          <UserOutlined className="bg-blue-500 p-2 text-xl rounded" />
          <p className="text-gray-700">{text}</p>
        </div>
      )}
      {from == Creator.Bot && (
        <div className="bg-teal-100 mt-2 p-4 rounded-lg flex gap-4 items-center whitespace-pre-wrap">
          <RobotOutlined className="bg-teal-600 p-2 text-xl rounded" />
          <p className="text-gray-700">{text}</p>
        </div>
      )}
    </>
  );
};

const ChatInput = ({ value, setValue, onSend, loading, inputText, setShowGuide }) => {
  const sendInput = () => {
    onSend();
    setValue([]);
  };

  const handleKeyDown = (event) => {
    if (event.keyCode === 13) {
      sendInput();
    }
  };

  const onClear = () => {
    let inputTextCopy = [...inputText];
    inputTextCopy.pop();
    setValue(inputTextCopy);
  };

  const onSpace = () => {
    let inputTextCopy = [...inputText];
    inputTextCopy.push(" ");
    setValue(inputTextCopy);
  };

  return (
    <div
      className="bg-white border-2 p-2 flex justify-center"
      style={{ borderRadius: 32 }}
    >
      <input
        value={value}
        className="w-full py-2 px-3 text-gray-800 rounded-lg focus:outline-none"
        type="text"
        placeholder="Wave at the camera to communicate.."
        disabled={loading}
        onKeyDown={(ev) => handleKeyDown(ev)}
        contentEditable={false}
        readOnly
      />
      <Button
        type="text"
        icon={<SyncOutlined />}
        onClick={setShowGuide}
        className="h-auto"
        title="show / hide guide"
        // disabled={!value}
      />
      <Button
        type="text"
        icon={<PicCenterOutlined />}
        onClick={onSpace}
        className="h-auto"
        title="spacebar"
        disabled={!value}
      />
      <Button
        type="text"
        shape="circle"
        icon={<FontAwesomeIcon icon={faBackspace} />}
        onClick={onClear}
        className="h-auto"
        title="backspace"
        disabled={!value}
      />
      <Button
        type="text"
        shape="circle"
        icon={<SendOutlined />}
        onClick={sendInput}
        className="h-auto"
        loading={loading}
        title="send"
        disabled={!value}
      />
    </div>
  );
};

export default function Home() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const requestRef = useRef();

  const [webcamRunning, setWebcamRunning] = useState(false);
  const [gestureOutput, setGestureOutput] = useState("");
  const [gestureRecognizer, setGestureRecognizer] = useState(null);
  const [runningMode, setRunningMode] = useState("VIDEO");
  const [progress, setProgress] = useState(0);
  const [detectedData, setDetectedData] = useState([]);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectKey, setDetectKey] = useState("");
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    document.addEventListener("keydown", detectKeyDown);
    document.addEventListener("keyup", detectKeyUp);

    return () => {
      document.removeEventListener("keydown", detectKeyDown);
      document.removeEventListener("keyup", detectKeyUp);
    };
  }, []);

  const detectKeyDown = (e) => {
    if (e.key === " ") {
      setDetectKey("Detection started");
    }
  };

  const detectKeyUp = (e) => {
    if (e.key === " ") {
      setDetectKey("Detection stopped!");
    }
  };

  useEffect(() => {
    async function loadGestureRecognizer() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://cloud-object-storage-cos-standard-0pw.s3.us-east.cloud-object-storage.appdomain.cloud/asl_dataset2.task",
        },
        numHands: 2,
        runningMode: runningMode,
      });
      setGestureRecognizer(recognizer);
    }
    loadGestureRecognizer();
  }, [runningMode]);

  useEffect(() => {
    if (detectKey) {
      enableCam();
    }
  }, [detectKey]);

  const handleChatGenerate = async () => {
    setLoading(true);

    let input = (inputText || []).join("");

    const myMessage = {
      text: input,
      from: Creator.Me,
      key: new Date().getTime(),
    };

    setMessages((prevState) => [...prevState, myMessage]);

    const response = await fetch("/api/chat/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: input,
      }),
    }).then((response) => response.json());

    setLoading(false);

    if (response.text) {
      const botMessage = {
        text: response.text,
        from: Creator.Bot,
        key: new Date().getTime(),
      };
      setMessages((prevState) => [...prevState, botMessage]);
      setInputText([]);
    }
    setShowGuide(false);
  };

  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production"
  ) {
    console.log("messages", messages);
  }

  const predictWebcam = useCallback(() => {
    if (runningMode === "IMAGE") {
      setRunningMode("VIDEO");
      gestureRecognizer.setOptions({ runningMode: "VIDEO" });
    }

    let nowInMs = Date.now();
    const results = gestureRecognizer.recognizeForVideo(
      webcamRef.current.video,
      nowInMs
    );

    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // Set video width
    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;

    // Set canvas height and width
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    // Draw the results on the canvas, if any.
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#001aff",
          lineWidth: 5,
        });

        drawLandmarks(canvasCtx, landmarks, { color: "#00FF00", lineWidth: 2 });
      }
    }
    if (results.gestures.length > 0) {
      let categoryName = results.gestures[0][0].categoryName;

      setDetectedData((prevData) => [
        ...prevData,
        {
          SignDetected: categoryName,
        },
      ]);

      setGestureOutput(categoryName);
      setProgress(Math.round(parseFloat(results.gestures[0][0].score) * 100));
    } else {
      setGestureOutput("");
      setProgress("");
    }

    if (webcamRunning) {
      requestRef.current = requestAnimationFrame(predictWebcam);
    }
  }, [webcamRunning, runningMode, gestureRecognizer, setGestureOutput]);

  const animate = useCallback(() => {
    requestRef.current = requestAnimationFrame(animate);
    predictWebcam();
  }, [predictWebcam]);

  const enableCam = useCallback(() => {
    if (!gestureRecognizer) {
      message.warning("Please wait for the gesture recognizer to load..");
      return;
    }

    if (webcamRunning) {
      setWebcamRunning(false);
      cancelAnimationFrame(requestRef.current);
      setDetectedData([]);
      const canvasCtx = canvasRef.current.getContext("2d");
      canvasCtx.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      setGestureOutput((prevGestureOutput) => {
        setInputText((prevState) => {
          const intArr = [...(prevState || [])];
          intArr.push(prevGestureOutput);
          // const uniqArr = intArr.filter((o, i) => intArr[i - 1] !== o);
          return intArr;
        });

        return "";
      });
      setProgress("");
    } else {
      setWebcamRunning(true);
      startTime = new Date();
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [webcamRunning, gestureRecognizer, animate, detectedData]);

  return (
    <Layout style={layoutStyle}>
      <Content
        style={contentStyle}
        className="bg-gradient-to-r from-cyan-500 to-blue-500"
      >
        <Row className="min-h-screen">
          <Col span={10} className="">
            <div className="min-h-screen">
              <div className="cam_container">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  // className="signlang_webcam"
                />
                <canvas ref={canvasRef} className="signlang_canvas" />
              </div>

              <div className="signlang_data-container px-3">
                <Title level={3}>Instructions:</Title>
                <Text>1. Press and hold the Spacebar Key to start the detection</Text>
                <Text>
                  2. Decide your hand gesture based on the guide provided
                </Text>
                <Text>
                  3. Release the Spacebar key to capture the hand gesture
                </Text>
                <Text>
                  4. Hit the send button to get results for your desired keyword search
                </Text>

                <Title level={4} className="text-center">
                  {detectKey}
                </Title>

                {gestureOutput ? (
                  <Flex vertical>
                    <Flex gap="middle" align="baseline">
                      <Title level={5}>Detected Key:</Title>
                      <Text>{gestureOutput}</Text>
                    </Flex>
                    <Flex gap="middle" align="center">
                      <Title level={5}>Accuracy:</Title>
                      <Progress
                        percent={progress}
                        status="active"
                        className="w-6/12"
                      />
                    </Flex>
                  </Flex>
                ) : null}
              </div>
            </div>
          </Col>
          <Col span={14} className="">
            <div className="relative max-w-2xl mx-auto">
              <div className="sticky top-0 w-full pt-10 px-4">
                <ChatInput
                  value={(inputText || []).join("")}
                  setValue={setInputText}
                  onSend={handleChatGenerate}
                  loading={loading}
                  inputText={inputText}
                  setShowGuide={() => {
                    setShowGuide((prevState) => !prevState);
                  }}
                />
              </div>

              <div
                className="mt-10 px-4 overscroll-y-auto overflow-auto"
                style={{ height: "80vh" }}
              >
                {showGuide ? (
                  <div className="w-100 text-center">
                    <Image
                      src="/images/sign_guide.jpg"
                      preview={false}
                      width="80%"
                    />
                  </div>
                ) : (
                  <>
                    {!messages.length ? (
                      <Text>Search to see results!</Text>
                    ) : (
                      <>
                        {messages.map(({ key, text, from }) => (
                          <ChatMessage key={key} text={text} from={from} />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
