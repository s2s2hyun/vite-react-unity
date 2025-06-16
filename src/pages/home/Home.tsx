import { useEffect } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

export default function Home() {
  const {
    unityProvider,
    isLoaded,
    // loadingProgression,
    // addEventListener,
    // removeEventListener,
    sendMessage,
  } = useUnityContext({
    loaderUrl: "unity/Build/Build.loader.js",
    dataUrl: "unity/Build/Build.data.br", // .br 추가 필요
    frameworkUrl: "unity/Build/Build.framework.js.br", // 이미 맞음
    codeUrl: "unity/Build/Build.wasm.br", // .br 추가 필요
  });

  // 카메라 권한 요청하는 함수 추가
  async function requestCameraPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      console.log("카메라 권한 허용됨");
      // 스트림 정리
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (err) {
      console.error("카메라 권한 거부됨:", err);
      return false;
    }
  }

  // Unity 로드 전에 권한 요청
  useEffect(() => {
    requestCameraPermission();
  }, []);

  function handleClickSpawnEnemies() {
    if (isLoaded) {
      sendMessage("HelloWorld", "SpawnEnemies", 1000);
      console.log("SpawnEnemies 메시지를 Unity에 전송했습니다.");
    } else {
      console.log("Unity가 아직 로드되지 않았습니다.");
    }
  }

  return (
    <div className="home">
      <h1>Unity WebGL Game</h1>
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
        <button onClick={handleClickSpawnEnemies}>유니티 함수 전달</button>
      </div>
    </div>
  );
}
