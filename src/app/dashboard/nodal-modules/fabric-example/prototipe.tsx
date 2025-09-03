'use client';

import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

//   const svgUrl = '/BHA SVG_s/Bull Pug-02.svg'; // ruta del SVG en public
const SVG_LIST: string[] = [
    '/BHA SVG_s/bull-edit.svg',
    '/BHA SVG_s/on-of-edit.svg',
    '/BHA SVG_s/bomba-edit.svg',
];

function App() {
    const canvasElRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

    const currentGroupRef = useRef<fabric.Group | null>(null);
    const currentSvgUrlRef = useRef<string | null>(null);

    useEffect(() => {
        if (!canvasElRef.current) return;

        // 2) Crear canvas
        const canvas = new fabric.Canvas(canvasElRef.current, {
            width: 700,
            height: 500,
            backgroundColor: '#eeeeee',
            selection: false,
        });
        fabricCanvasRef.current = canvas;

        return () => {
            canvas.dispose();
        };
    }, []);

    // 3) Función para cargar un SVG por URL
    const loadSvg = (url: string) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        fabric.loadSVGFromURL(url, (objects, options) => {

            // Eliminar grupo previo si existe
              if (currentGroupRef.current) {
                canvas.remove(currentGroupRef.current);
                currentGroupRef.current = null;
              }

            // Agrupar todos los objetos del SVG
            const group = fabric.util.groupSVGElements(objects, options) as fabric.Group;

            // Fijar: sin interacción
            group.set({
                selectable: false,
                hasControls: false,
                hasBorders: false,
                // hoverCursor: 'default',
                // lockMovementX: true,
                // lockMovementY: true,
                // lockRotation: true,
                // lockScalingX: true,
                // lockScalingY: true,
            });

            // Calcular escala usando tamaño "sólido" (ignora stroke) y encajar en canvas
            const bounds = group.getBoundingRect(false); // false => ignora stroke
            const scaleFactor = (canvas.getWidth() * 0.8) / bounds.width;
            group.scale(scaleFactor);


            // Añadir y centrar
            canvas.add(group);
            canvas.centerObject(group);
            canvas.requestRenderAll();

            // Guardar referencias
            currentGroupRef.current = group;
            currentSvgUrlRef.current = url;

            // (Opcional) Asegurar que no quede seleccionable luego de un click
            canvas.discardActiveObject();
            canvas.requestRenderAll();
        });
    };

    // 4) Descargar PNG del canvas
    const downloadPNG = () => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const dataURL = canvas.toDataURL({ format: 'png' });
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'canvas.png';
        a.click();
    };

    return (
        <div className="flex flex-col items-center gap-4 p-6 bg-gray-900 min-h-screen text-white">
            {/* Controles */}
            <div className="flex flex-wrap gap-2">
                {SVG_LIST.map((url) => (
                    <button
                        key={url}
                        onClick={() => loadSvg(url)}
                        className="px-4 py-2 rounded bg-yellow-500 hover:bg-yellow-600"
                        title={url}
                    >
                        Cargar: {url.split('/').pop()}
                    </button>
                ))}
            </div>

            {/* Canvas */}
            <canvas ref={canvasElRef} className="border border-gray-700 bg-white" />

            {/* Exportaciones */}
            <div className="flex gap-3">
                <button
                    onClick={downloadPNG}
                    className="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600"
                >
                    Descargar PNG
                </button>
            </div>
        </div>
    );
}

export default App;
