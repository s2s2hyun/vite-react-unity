import { useEffect, useState, useRef, useCallback } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function Home() {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 768);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const { unityProvider, isLoaded, sendMessage } = useUnityContext({
    loaderUrl: "unity/Build/Build.loader.js",
    dataUrl: "unity/Build/Build.data.br",
    frameworkUrl: "unity/Build/Build.framework.js.br",
    codeUrl: "unity/Build/Build.wasm.br",
  });

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    async function requestCameraPermission() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: isLargeScreen ? 1280 : 640 },
            height: { ideal: isLargeScreen ? 720 : 480 },
            frameRate: { ideal: 15, max: 15 }, // 프레임레이트 15fps
            facingMode: "environment",
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }

        setCameraPermissionGranted(true);
        console.log("카메라 권한 허용됨");
        return true;
      } catch (err) {
        console.error("카메라 권한 거부됨:", err);
        alert("카메라 권한이 필요합니다.");
        return false;
      }
    }

    requestCameraPermission();
  }, [isLargeScreen]);

  const sendVideoFrameToUnity = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    const currentTime = Date.now();
    if (currentTime - lastFrameTimeRef.current < 66) return; // 15fps
    lastFrameTimeRef.current = currentTime;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const targetWidth = isLargeScreen ? 1280 : 640;
    const targetHeight = isLargeScreen ? 720 : 480;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    const imageData = canvas.toDataURL("image/webp", 0.9); // WebP 사용, 90% 품질

    frameCountRef.current++;
    if (frameCountRef.current % 50 === 0) {
      console.log(
        `전송된 프레임: ${frameCountRef.current}, 데이터 크기: ${Math.round(
          imageData.length / 1024
        )}KB`
      );
    }

    try {
      sendMessage("CameraController", "ReceiveVideoFrame", imageData);
    } catch (error) {
      console.error("Unity 메시지 전송 실패:", error);
    }
  }, [isLoaded, sendMessage, isLargeScreen]);

  useEffect(() => {
    let animationId: number;

    if (cameraPermissionGranted && isLoaded) {
      const animate = () => {
        sendVideoFrameToUnity();
        animationId = requestAnimationFrame(animate);
      };
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [cameraPermissionGranted, isLoaded, sendVideoFrameToUnity]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

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
      {/* 디버깅용 비디오 미리보기 */}
      <div className="unity-wrapper">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            maxWidth: "400px",
            borderRadius: "8px",
            marginBottom: "1rem",
            display: "block", // 디버깅용으로 표시, 필요 시 none으로 변경
          }}
        />
      </div>
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
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          현재 설정: {isLargeScreen ? "1280x720" : "640x480"}, 15fps, WebP 90%
          품질
        </div>
      </div>
    </div>
  );
}
