import { useEffect, useState, useRef, useCallback } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function Home() {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [_stream, setStream] = useState<MediaStream | null>(null);
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
      // 해상도를 대폭 줄임 (메모리 절약)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15, max: 15 }, // 프레임레이트 제한
        },
        audio: false,
      });

      setStream(mediaStream);

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

  // 메모리 최적화된 프레임 전송
  const sendVideoFrameToUnity = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isLoaded) return;

    const currentTime = Date.now();

    // 프레임 스킵 (10fps로 제한)
    if (currentTime - lastFrameTimeRef.current < 100) return;
    lastFrameTimeRef.current = currentTime;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // 캔버스 크기를 더 작게 설정 (메모리 절약)
    const targetWidth = 320;
    const targetHeight = 240;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // 비디오를 축소하여 그리기
    ctx.drawImage(video, 0, 0, targetWidth, targetHeight);

    // 압축률을 더 높임 (화질 vs 메모리 트레이드오프)
    const imageData = canvas.toDataURL("image/jpeg", 1);

    // 프레임 카운터 (디버깅용)
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
  }, [isLoaded, sendMessage]);

  // 애니메이션 프레임 사용 (setInterval보다 효율적)
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

  // 컴포넌트 언마운트 시 스트림 정리
  useEffect(() => {
    return () => {
      if (_stream) {
        _stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [_stream]);

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
      <h1>Unity WebGL Game with Camera (최적화됨)</h1>

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

        {/* 메모리 사용량 모니터링 */}
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
          현재 설정: 320x240, 10fps, JPEG 30% 품질
        </div>
      </div>
    </div>
  );
}
