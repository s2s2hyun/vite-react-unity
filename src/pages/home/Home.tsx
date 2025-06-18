import { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function Home() {
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [_stream, setStream] = useState<MediaStream | null>(null);

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
        video: true,
        audio: false,
      });
      setStream(mediaStream);
      console.log("카메라 권한 허용됨");
      return true;
    } catch (err) {
      console.error("카메라 권한 거부됨:", err);
      alert("카메라 권한이 필요합니다.");
      return false;
    }
  }

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
