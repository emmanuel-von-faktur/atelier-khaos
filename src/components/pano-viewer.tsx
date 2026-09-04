import { useEffect, useRef } from "react";
import * as THREE from "three";

const TILES = "/pano";
const FACE_ORDER = ["r", "l", "u", "d", "f", "b"] as const;
const FOV_MIN = 38;
const FOV_MAX = 100;

type Props = {
  onReady?: () => void;
  onError?: (message: string) => void;
};

function loadFace(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(url));
    img.src = url;
  });
}

function touchDist(a: Touch, b: Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function PanoViewer({ onReady, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 20);
    camera.position.set(0, 0, 0.01);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x12100e, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.touchAction = "none";
    host.appendChild(canvas);

    let lon = 90;
    let lat = 0;
    let fov = 75;
    let lastX = 0;
    let lastY = 0;
    let mouseDrag = false;
    let touching = false;
    let pinchStart = 0;
    let pinchFov = fov;
    let disposed = false;
    let env: THREE.CubeTexture | null = null;

    const applyFov = (next: number) => {
      fov = Math.max(FOV_MIN, Math.min(FOV_MAX, next));
      camera.fov = fov;
      camera.updateProjectionMatrix();
    };

    const resize = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };

    const look = () => {
      lat = Math.max(-85, Math.min(85, lat));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        Math.sin(phi) * Math.cos(theta),
        Math.cos(phi),
        Math.sin(phi) * Math.sin(theta),
      );
    };

    const onMouseDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      mouseDrag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMouseMove = (e: PointerEvent) => {
      if (!mouseDrag || e.pointerType !== "mouse") return;
      lon -= (e.clientX - lastX) * 0.18;
      lat += (e.clientY - lastY) * 0.18;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onMouseUp = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      mouseDrag = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      touching = true;
      if (e.touches.length >= 2) {
        pinchStart = touchDist(e.touches[0], e.touches[1]);
        pinchFov = fov;
      } else {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        pinchStart = 0;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length >= 2) {
        const dist = touchDist(e.touches[0], e.touches[1]);
        if (pinchStart > 1) applyFov(pinchFov * (pinchStart / dist));
        return;
      }
      if (e.touches.length === 1) {
        const t = e.touches[0];
        lon -= (t.clientX - lastX) * 0.18;
        lat += (t.clientY - lastY) * 0.18;
        lastX = t.clientX;
        lastY = t.clientY;
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length >= 2) {
        pinchStart = touchDist(e.touches[0], e.touches[1]);
        pinchFov = fov;
      } else if (e.touches.length === 1) {
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
        pinchStart = 0;
      } else {
        touching = false;
        pinchStart = 0;
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyFov(fov + e.deltaY * 0.04);
    };

    canvas.addEventListener("pointerdown", onMouseDown);
    canvas.addEventListener("pointermove", onMouseMove);
    canvas.addEventListener("pointerup", onMouseUp);
    canvas.addEventListener("pointercancel", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);
    resize();

    void Promise.all(FACE_ORDER.map((face) => loadFace(`${TILES}/cube_${face}.jpg?v=orig`)))
      .then((images) => {
        if (disposed) return;
        const texture = new THREE.CubeTexture(images);
        texture.needsUpdate = true;
        texture.colorSpace = THREE.SRGBColorSpace;
        env = texture;
        scene.background = texture;
        onReady?.();
      })
      .catch(() => {
        if (!disposed) onError?.("Les faces du cube n’ont pas pu se charger.");
      });

    renderer.setAnimationLoop(() => {
      if (!mouseDrag && !touching) lon += 0.012;
      look();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      renderer.setAnimationLoop(null);
      canvas.removeEventListener("pointerdown", onMouseDown);
      canvas.removeEventListener("pointermove", onMouseMove);
      canvas.removeEventListener("pointerup", onMouseUp);
      canvas.removeEventListener("pointercancel", onMouseUp);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
      canvas.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", resize);
      env?.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, [onReady, onError]);

  return <div ref={hostRef} className="absolute inset-0 touch-none" />;
}
