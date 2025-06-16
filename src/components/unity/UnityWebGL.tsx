import { useEffect, useRef } from "react";

interface UnityWebGLProps {
  width?: string;
  height?: string;
  buildPath?: string;
}

declare global {
  interface Window {
    createUnityInstance: (
      canvas: HTMLCanvasElement,
      config: any
    ) => Promise<any>;
    unityInstance: any;
  }
}

export default function UnityWebGL({
  width = "960px",
  height = "600px",
  buildPath = "/Build/Build",
}: UnityWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const unityInstanceRef = useRef<any>(null);

  useEffect(() => {
    const loadUnity = async () => {
      if (!canvasRef.current) return;

      try {
        // Unity loader script 동적 로드
        const script = document.createElement("script");
        script.src = `${buildPath}/Build.loader.js`;
        script.onload = async () => {
          if (window.createUnityInstance && canvasRef.current) {
            const config = {
              dataUrl: `${buildPath}/Build.data`,
              frameworkUrl: `${buildPath}/Build.framework.js`,
              codeUrl: `${buildPath}/Build.wasm`,
              streamingAssetsUrl: "StreamingAssets",
              companyName: "DefaultCompany",
              productName: "pprk-react",
              productVersion: "0.1",
            };

            try {
              unityInstanceRef.current = await window.createUnityInstance(
                canvasRef.current,
                config,
                (progress: number) => {
                  console.log(
                    `Unity 로딩 진행률: ${Math.round(progress * 100)}%`
                  );
                }
              );
              window.unityInstance = unityInstanceRef.current;
              console.log("Unity 인스턴스가 성공적으로 로드되었습니다!");
            } catch (error) {
              console.error("Unity 인스턴스 생성 실패:", error);
            }
          }
        };

        script.onerror = () => {
          console.error("Unity loader script 로드 실패");
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error("Unity 로드 중 오류 발생:", error);
      }
    };

    loadUnity();

    // 정리 함수
    return () => {
      if (unityInstanceRef.current) {
        unityInstanceRef.current.Quit();
        unityInstanceRef.current = null;
      }
    };
  }, [buildPath]);

  return (
    <div className="unity-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: width,
          height: height,
          display: "block",
          margin: "0 auto",
          border: "1px solid #ccc",
        }}
      />
    </div>
  );
}
