"use client";

import React, { useState, useRef, useEffect } from "react";
import { Stage, Layer, Image as KonvaImage, Transformer } from "react-konva";
import { ChevronLeft, ChevronRight, ScreenShare, Camera, Download, Circle } from "lucide-react";

type MediaLayer = {
  id: string;
  type: "screen" | "camera";
  stream: MediaStream | null;
  videoElement: HTMLVideoElement;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
};

const ScreenRecorder: React.FC = () => {
  const [layers, setLayers] = useState<MediaLayer[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRefs = useRef<Map<string, MediaRecorder>>(new Map());
  const chunksRef = useRef<Map<string, Blob[]>>(new Map());
  const konvaImagesRef = useRef<{ [key: string]: any }>({});
  const transformerRef = useRef<any>(null);
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });

  // Estado para controle da barra lateral
  const [sidebarWidth, setSidebarWidth] = useState(192); // Largura inicial da barra lateral
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Estado para controle de expansão

  // Atualizando as dimensões da janela
  useEffect(() => {
    setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // Atualizando o quadro da captura
  useEffect(() => {
    const renderFrames = () => {
      layers.forEach((layer) => {
        const konvaImage = konvaImagesRef.current[layer.id];
        if (konvaImage && layer.videoElement.readyState === 4) {
          konvaImage.image(layer.videoElement);
          konvaImage.getLayer().batchDraw();
        }
      });
      requestAnimationFrame(renderFrames);
    };

    renderFrames();
  }, [layers]);

  const addScreenLayer = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      await videoElement.play();

      setLayers((prev) => [
        ...prev,
        {
          id: `screen-${Date.now()}`,
          type: "screen",
          stream,
          videoElement,
          x: 50,
          y: 50,
          width: 640,
          height: 360,
          isSelected: false,
        },
      ]);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRefs.current.set(`screen-${Date.now()}`, mediaRecorder);
      const screenChunks: Blob[] = [];
      chunksRef.current.set(`screen-${Date.now()}`, screenChunks);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) screenChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(screenChunks, { type: "video/webm" });
        setRecordedBlob((prevBlob) => (prevBlob ? new Blob([prevBlob, blob]) : blob));
      };
    } catch (error) {
      console.error("Erro ao capturar a tela:", error);
    }
  };

  const addCameraLayer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoElement = document.createElement("video");
      videoElement.srcObject = stream;
      await videoElement.play();

      setLayers((prev) => [
        ...prev,
        {
          id: `camera-${Date.now()}`,
          type: "camera",
          stream,
          videoElement,
          x: 200,
          y: 200,
          width: 320,
          height: 240,
          isSelected: false,
        },
      ]);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRefs.current.set(`camera-${Date.now()}`, mediaRecorder);
      const cameraChunks: Blob[] = [];
      chunksRef.current.set(`camera-${Date.now()}`, cameraChunks);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) cameraChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(cameraChunks, { type: "video/webm" });
        setRecordedBlob((prevBlob) => (prevBlob ? new Blob([prevBlob, blob]) : blob));
      };
    } catch (error) {
      console.error("Erro ao capturar a câmera:", error);
    }
  };

  const startRecording = () => {
    mediaRecorderRefs.current.forEach((recorder) => recorder.start());
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRefs.current.forEach((recorder) => recorder.stop());
    setIsRecording(false);
  };

  const downloadRecording = () => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "gravacao.webm";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const selectLayer = (id: string) => {
    setLayers((prev) =>
      prev.map((layer) => ({
        ...layer,
        isSelected: layer.id === id,
      }))
    );
  };

  useEffect(() => {
    if (transformerRef.current) {
      const selectedLayer = layers.find((layer) => layer.isSelected);
      if (selectedLayer) {
        transformerRef.current.nodes([konvaImagesRef.current[selectedLayer.id]]);
        transformerRef.current.getLayer().batchDraw();
      } else {
        transformerRef.current.nodes([]);
      }
    }
  }, [layers]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
    setSidebarWidth(isSidebarCollapsed ? 192 : 64); // Alterar a largura da barra lateral
  };

  const handleDragMove = (e: any, layerId: string) => {
    const newX = e.target.x();
    const newY = e.target.y();
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? { ...layer, x: newX, y: newY }
          : layer
      )
    );
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Cabeçalho fixo no topo */}
      <header className="w-full fixed top-0 left-0 bg-zinc-900 text-white p-4 flex items-center z-10">
        <h1 className="text-lg font-bold">Screen Recorder</h1>
      </header>

      {/* Barra lateral fixa à esquerda, com altura 100% */}
      <div
        className={`transition-all ease-in-out ${isSidebarCollapsed ? "w-16" : "w-48"} bg-zinc-900 pt-14 p-4`}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0, // Garante que a barra lateral vai até o final da tela
          height: "100vh", // A barra lateral vai ocupar 100% da altura da tela
        }}
      >
        <div className={`flex ${isSidebarCollapsed ? "justify-center" : "justify-end"}`}>
          <button onClick={toggleSidebar} className="mb-4 text-white">
            {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </button>
        </div>

        {!isSidebarCollapsed && (
          <div>
            <button className="flex items-center mb-4 text-white" onClick={addScreenLayer}>
              <ScreenShare className="mr-2" />
              <span>Captura de Tela</span>
            </button>
            <button className="flex items-center mb-4 text-white" onClick={addCameraLayer}>
              <Camera className="mr-2" />
              <span>Câmera</span>
            </button>
            <button
              onClick={() => (isRecording ? stopRecording() : startRecording())}
              className="flex items-center mb-4 text-white"
            >
              <Circle className="mr-2" />
              <span>{isRecording ? "Parar Gravação" : "Iniciar Gravação"}</span>
            </button>
            {recordedBlob && (
              <button className="flex items-center mb-4 text-white" onClick={downloadRecording}>
                <Download className="mr-2" />
                <span>Baixar Gravação</span>
              </button>
            )}
          </div>
        )}

        {isSidebarCollapsed && (
          <div>
            <button onClick={addScreenLayer} className="text-white">
              <ScreenShare />
            </button>
            <button onClick={addCameraLayer} className="text-white">
              <Camera />
            </button>
            <button onClick={() => (isRecording ? stopRecording() : startRecording())} className="text-white">
              <Circle />
            </button>
            {recordedBlob && (
              <button onClick={downloadRecording} className="text-white">
                <Download />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Área principal de visualização, considerando a largura da barra lateral */}
      <div
        className="flex-grow pt-16"
        style={{ marginLeft: sidebarWidth }}
      >
        <Stage width={windowDimensions.width - sidebarWidth} height={windowDimensions.height - 80}>
          <Layer>
            {layers.map((layer) => (
              <KonvaImage
		  key={layer.id}
		  ref={(node) => {
		    konvaImagesRef.current[layer.id] = node; // Armazena o nó no objeto de referência
		  }}
		  image={layer.videoElement}  // Adiciona a propriedade 'image' para o vídeo
		  x={layer.x}
		  y={layer.y}
		  width={layer.width}
		  height={layer.height}
		  onClick={() => selectLayer(layer.id)}
		  draggable
		  onDragMove={(e) => handleDragMove(e, layer.id)}
		/>
            ))}
          </Layer>
          <Layer>
            <Transformer ref={transformerRef} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default ScreenRecorder;

