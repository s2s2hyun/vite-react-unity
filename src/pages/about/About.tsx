import { useEffect, useRef, useState } from "react";

export default function About() {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function requestCameraPermission() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // 후방 카메라
            width: { ideal: 1280 }, // HD 해상도
            height: { ideal: 720 },
            frameRate: { ideal: 15, max: 15 },
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        setCameraPermissionGranted(true);
        setErrorMessage("");
        console.log("후방 카메라 권한 허용됨");
      } catch (err) {
        console.error("카메라 권한 거부됨:", err);
        setCameraPermissionGranted(false);
        setErrorMessage(
          "카메라 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용하고, HTTPS 환경인지 확인하세요."
        );
      }
    }

    requestCameraPermission();

    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <>
      <style>
        {`
          .main-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
          }
          @media (max-width: 767px) {
            .main-content {
              padding: 0;
            }
          }

          .about {
            max-width: 800px;
            margin: 0 auto;
            text-align: left;
          }

          .about h1 {
            text-align: center;
            margin-bottom: 2rem;
          }

          .unity-wrapper {
            margin: 2rem 0;
            padding: 1rem;
            background-color: #f5f5f5;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .unity-wrapper video {
            width: 100%;
            max-width: 800px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          .error-message {
            color: #ff4d4f;
            text-align: center;
            margin: 1rem 0;
          }
        `}
      </style>
      <div className="main-content">
        <div className="about">
          <h1>Webcam Preview</h1>
          {!cameraPermissionGranted && errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}
          <div className="unity-wrapper">
            <video ref={videoRef} autoPlay playsInline muted />
          </div>
        </div>
      </div>
    </>
  );
}