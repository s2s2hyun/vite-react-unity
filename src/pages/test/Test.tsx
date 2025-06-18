import { Unity, useUnityContext } from "react-unity-webgl";

export default function Test() {
  const { unityProvider, isLoaded } = useUnityContext({
    loaderUrl: "/test/Build/Build.loader.js",
    dataUrl: "/test/Build/Build.data.br",
    frameworkUrl: "/test/Build/Build.framework.js.br",
    codeUrl: "/test/Build/Build.wasm.br",
  });

  return (
    <div className="test-container">
      <style>
        {`
          .test-container {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }

          .unity-wrapper {
            width: 100%;
            max-width: 1280px;
            height: calc(100vh - 2rem);
            margin: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .unity-wrapper canvas {
            width: 100%;
            height: 100%;
            border-radius: 8px;
          }

          .loading-message {
            text-align: center;
            color: #666;
            font-size: 1.2rem;
          }
        `}
      </style>
      <div className="unity-wrapper">
        {!isLoaded && (
          <p className="loading-message">Unity 콘텐츠를 로딩 중...</p>
        )}
        <Unity
          unityProvider={unityProvider}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
