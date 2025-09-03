'use client';

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  const svgUrl = '/BHA SVG_s/Bomba-02.svg'

  useEffect(() => {
    if (!canvasRef.current) return;

    // Crear canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#eeeeee',
    });
    fabricCanvasRef.current = canvas;

    // Cargar SVG
    fabric.loadSVGFromURL(svgUrl, (objects, options) => {
      const group = fabric.util.groupSVGElements(objects, options) as fabric.Group;

      // Escalar al ancho del canvas
      const bounds = group.getBoundingRect(false); // solo relleno sólido
      const scaleFactor = (canvas.getWidth() * 0.5) / bounds.width;
      group.scale(scaleFactor);

      // Fijar en canvas (sin interacción)
      group.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
      });

      // Agregar al canvas y centrar
      canvas.add(group);
      canvas.centerObject(group);
      canvas.renderAll();
    });

    // Cleanup
    return () => {
      canvas.dispose();
    };
  }, []);

  // Descargar canvas como PNG
  const downloadPNG = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL({ format: 'png' });
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'canvas.png';
    a.click();
  };

  // Descargar SVG original
  const downloadSVG = () => {
    fetch(svgUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'original.svg';
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-gray-900 gap-4">
      <canvas ref={canvasRef} className="border border-gray-700" />
      <div className="flex gap-4">
        <button
          onClick={downloadPNG}
          className="py-2 px-4 bg-indigo-500 text-white rounded"
        >
          Descargar PNG
        </button>
        <button
          onClick={downloadSVG}
          className="py-2 px-4 bg-green-500 text-white rounded"
        >
          Descargar SVG original
        </button>
      </div>
    </div>
  );
}

export default App;

