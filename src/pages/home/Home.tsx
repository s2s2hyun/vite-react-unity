import { useEffect, useState, useRef } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function Home() {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [_stream, setStream] = useState<MediaStream | null>(null); // 타입 지정
  const videoRef = useRef<HTMLVideoElement>(null); // 타입 지정
  const canvasRef = useRef<HTMLCanvasElement>(null); // 타입 지정

  const { unityProvider, isLoaded, sendMessage } = useUnityContext({
    loaderUrl: "unity/Build/Build.loader.js",
    dataUrl: "unity/Build/Build.data.br",
    frameworkUrl: "unity/Build/Build.framework.js.br",
    codeUrl: "unity/Build/Build.wasm.br",
  });

  useEffect(() => {
    async function requestPermission() {
      const permissionGranted = await requestCameraPermission();
      if (permissionGranted) {
        setCameraPermissionGranted(true);
      }
    }
    requestPermission();
  }, []);

  async function requestCameraPermission() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      setStream(mediaStream);

      // 비디오 엘리먼트에 스트림 연결
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      console.log("카메라 권한 허용됨");
      return true;
    } catch (err) {
      console.error("카메라 권한 거부됨:", err);
      alert("카메라 권한이 필요합니다.");
      return false;
    }
  }

  // 비디오 프레임을 Unity로 전송
  function sendVideoFrameToUnity() {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return; // null 체크

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // 비디오 프레임을 캔버스에 그리기
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 캔버스 데이터를 base64로 변환
    const imageData = canvas.toDataURL("image/jpeg", 0.5);

    // Unity로 이미지 데이터 전송
    sendMessage("CameraController", "ReceiveVideoFrame", imageData);
  }

  // 주기적으로 프레임 전송 (30fps)
  useEffect(() => {
    if (cameraPermissionGranted && isLoaded) {
      const interval = setInterval(sendVideoFrameToUnity, 33); // ~30fps
      return () => clearInterval(interval);
    }
  }, [cameraPermissionGranted, isLoaded, sendMessage]); // sendMessage 의존성 추가

  function handleClickSpawnEnemies() {
    if (isLoaded && cameraPermissionGranted) {
      sendMessage("HelloWorld", "SpawnEnemies", 1000);
      console.log("SpawnEnemies 메시지를 Unity에 전송했습니다.");
    } else {
      console.log("카메라 권한 또는 Unity가 준비되지 않았습니다.");
    }
  }

  return (
    <div className="home">
      <h1>Unity WebGL Game with Camera</h1>

      {/* 숨겨진 비디오 및 캔버스 엘리먼트 */}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        autoPlay
        muted
        playsInline
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="unity-wrapper">
        <Unity
          style={{
            width: "100%",
            height: "calc(var(--vh, 1vh) * 100)",
          }}
          unityProvider={unityProvider}
        />
      </div>

      <div className="game-info">
        <button
          onClick={handleClickSpawnEnemies}
          disabled={!isLoaded || !cameraPermissionGranted}
        >
          유니티 함수 전달
        </button>
        {!cameraPermissionGranted && <p>카메라 권한을 허용해주세요.</p>}
      </div>
    </div>
  );
}
