"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Eye, RotateCw, ZoomIn, Box } from "lucide-react";
import { Button } from "@/components/ui";

interface Character3DViewerProps {
  modelUrl?: string;
  wireframeDefault?: boolean;
}

export function Character3DViewer({ modelUrl, wireframeDefault = false }: Character3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wireframe, setWireframe] = useState(wireframeDefault);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.Material[]>([]);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    setLoading(true);
    setError(null);
    materialsRef.current = [];

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x07090e);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    containerRef.current.replaceChildren(renderer.domElement);

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.8, 0);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xddeeff, 1.5);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xaabbcc, 0.6);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Grid Floor
    const grid = new THREE.GridHelper(10, 20, 0x4f46e5, 0x1e293b);
    grid.position.y = -0.01;
    scene.add(grid);

    // 5. Load Model
    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        const root = gltf.scene;

        // Auto center and scale
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Center to origin
        root.position.x -= center.x;
        root.position.y -= box.min.y;
        root.position.z -= center.z;

        // Collect materials for wireframe toggle
        root.traverse((child: any) => {
          if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
              materialsRef.current.push(...child.material);
            } else {
              materialsRef.current.push(child.material);
            }
          }
        });

        scene.add(root);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("GLTF Load Error:", err);
        setError("Failed to render 3D model asset.");
        setLoading(false);
      }
    );

    // Render loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
    };
  }, [modelUrl]);

  // Handle wireframe toggle
  useEffect(() => {
    materialsRef.current.forEach((mat: any) => {
      if (mat) mat.wireframe = wireframe;
    });
  }, [wireframe]);

  return (
    <div className="relative w-full h-[540px] bg-[#07090e] border border-slate-800 rounded-2xl overflow-hidden group">
      <div ref={containerRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 bg-[#07090e]/80 flex flex-col items-center justify-center space-y-3 z-10">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-300 font-medium">Streaming 3D Mesh Geometry...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-[#07090e]/90 flex flex-col items-center justify-center p-6 text-center space-y-2 z-10">
          <Box className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-rose-400">{error}</p>
        </div>
      )}

      {/* OVERLAY CONTROLS */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl p-1.5 z-10">
        <Button
          size="sm"
          variant={wireframe ? "primary" : "ghost"}
          onClick={() => setWireframe(!wireframe)}
          className="text-xs px-2.5 py-1"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          {wireframe ? "Wireframe" : "Textured"}
        </Button>
      </div>

      <div className="absolute bottom-4 left-4 text-[10px] text-slate-500 bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 backdrop-blur">
        Orbit: Left Click &bull; Pan: Right Click &bull; Zoom: Scroll
      </div>
    </div>
  );
}
