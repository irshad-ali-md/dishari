"use client";

import React, { useRef, useEffect } from "react";
import useState from "react-usestateref";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import { Button, Col, Image, Layout, Row, Space, Typography } from "antd";
import {
  CloseCircleOutlined,
  RobotOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { drawRect } from "../utilities";

const { Sider, Content } = Layout;
const { Text, Title } = Typography;

const layoutStyle = {
  minHeight: "100vh",
};
const headerStyle = {
  color: "#fff",
  height: 64,
  paddingInline: 50,
  lineHeight: "64px",
  backgroundColor: "#7dbcea",
};
const contentStyle = {
  minHeight: 100,
  color: "#fff",
  backgroundColor: "#fff",
};
const siderStyle = {
  color: "#fff",
  backgroundColor: "#ddd",
};
const footerStyle = {
  color: "#fff",
  backgroundColor: "#eee",
};

const Creator = {
  Me: 0,
  Bot: 1,
};

const ChatMessage = ({ text, from }) => {
  return (
    <>
      {from == Creator.Me && (
        <div className="bg-sky-100 p-4 rounded-lg flex gap-4 items-center whitespace-pre-wrap">
          <UserOutlined className="bg-blue-500 p-2 text-xl rounded" />
          <p className="text-gray-700">{text}</p>
        </div>
      )}
      {from == Creator.Bot && (
        <div className="bg-teal-100 p-4 rounded-lg flex gap-4 items-center whitespace-pre-wrap">
          <RobotOutlined className="bg-teal-600 p-2 text-xl rounded" />
          <p className="text-gray-700">{text}</p>
        </div>
      )}
    </>
  );
};

const ChatInput = ({ value, setValue, onSend, loading, inputText }) => {
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

  return (
    <div className="bg-white border-2 p-2 rounded-lg flex justify-center">
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
        shape="circle"
        icon={<CloseCircleOutlined />}
        onClick={onClear}
        className="h-auto"
        disabled={!value}
      />
      <Button
        type="text"
        shape="circle"
        icon={<SendOutlined />}
        onClick={sendInput}
        className="h-auto"
        loading={loading}
        disabled={!value}
      />
    </div>
  );
};

export default function Home() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [messages, setMessages, messageRef] = useState([]);
  const [inputText, setInputText] = useState([]);
  const [loading, setLoading] = useState(false);
  const [triggerApiCall, setTriggerApiCall] = useState(false);
  console.log("inputText111", inputText);

  useEffect(() => {
    if (triggerApiCall) {
      handleChatGenerate();
    }
  }, [triggerApiCall]);

  const handleChatGenerate = async () => {
    setTriggerApiCall(false);
    setLoading(true);

    let input = (inputText || []).join(" ");

    const myMessage = {
      text: input,
      from: Creator.Me,
      key: new Date().getTime(),
    };

    setMessages([...messageRef.current, myMessage]);

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
      setMessages([...messageRef.current, botMessage]);
      setInputText([]);
    }
  };

  // Main function
  const runCoco = async () => {
    const net = await tf.loadGraphModel(
      "https://cloud-object-storage-cos-standard-0pw.s3.us-east.cloud-object-storage.appdomain.cloud/model.json"
    );

    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 24);
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // 4. TODO - Make Detections
      const img = tf.browser.fromPixels(video);
      const resized = tf.image.resizeBilinear(img, [640, 480]);
      const casted = img.cast("int32");
      const expanded = casted.expandDims(0);
      const obj = await net.executeAsync(expanded);
      // console.log({ obj });

      const boxes = await obj[1].array();
      const classes = await obj[2].array();
      const scores = await obj[4].array();
      // console.log({ boxes, classes, scores });

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");

      // 5. TODO - Update drawing utility
      // drawSomething(obj, ctx)
      requestAnimationFrame(() => {
        // console.log("requestAnimationFrame", new Date().getTime());
        drawRect(
          boxes[0],
          classes[0],
          scores[0],
          0.9,
          videoWidth,
          videoHeight,
          ctx,
          setInputText,
          setTriggerApiCall
        );
      });

      tf.dispose(img);
      tf.dispose(resized);
      tf.dispose(casted);
      tf.dispose(expanded);
      tf.dispose(obj);
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  return (
    <Layout style={layoutStyle}>
      {/* <Sider style={siderStyle} width={240}>
        <Webcam
          ref={webcamRef}
          muted={true}
          // className="cam_container"
          style={{
            zindex: 9,
          }}
        />

        <canvas
          ref={canvasRef}
          className="cam_container"
          style={{
            zindex: 8,
          }}
        />
      </Sider> */}
      <Layout>
        {/* <Header style={headerStyle}>Header</Header> */}
        <Content style={contentStyle}>
          <Row className="min-h-screen">
            <Col span={10} className="bg-gray-100">
              <Webcam
                ref={webcamRef}
                muted={true}
                // className="cam_container"
                style={{
                  zindex: 9,
                }}
              />

              <canvas
                ref={canvasRef}
                className="cam_container"
                style={{
                  zindex: 8,
                }}
              />
              <div className="p-3 text-center">
                <Title level={3}>Use the below hand signs to interact</Title>
                <div className="flex justify-around">
                  <Space direction="vertical">
                    <Space>
                      <Image src="/images/explain.png" width={70} />
                      <Text> - Explain</Text>
                    </Space>
                    <Space>
                      <Image src="/images/different.png" width={70} />
                      <Text> - Different</Text>
                    </Space>
                  </Space>
                  <Space direction="vertical">
                    <Space>
                      <Image src="/images/operating.png" width={70} height={70} />
                      <Text> - Operating</Text>
                    </Space>
                    <Space>
                      <Image src="/images/systems.png" width={70} />
                      <Text> - Systems</Text>
                    </Space>
                  </Space>
                </div>
              </div>
            </Col>
            <Col span={14} className="bg-sky-100">
              <div className="relative max-w-2xl mx-auto">
                <div className="sticky top-0 w-full pt-10 px-4">
                  <ChatInput
                    value={(inputText || []).join(" ")}
                    setValue={setInputText}
                    onSend={handleChatGenerate}
                    loading={loading}
                    inputText={inputText}
                  />
                </div>

                <div
                  className="mt-10 px-4 overscroll-y-auto overflow-auto"
                  style={{ height: "80vh" }}
                >
                  {messages.map(({ key, text, from }) => (
                    <ChatMessage key={key} text={text} from={from} />
                  ))}
                  {!messages.length && (
                    <p className="text-center text-black">
                      I am at your service
                    </p>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </Content>
        {/* <Footer style={footerStyle}>
          <Input
            size="large"
            placeholder="Wave at the camera to type.."
            value={inputText.join(" ")}
          />
        </Footer> */}
      </Layout>
    </Layout>
  );
}
