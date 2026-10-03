import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { useLocale } from "../../hooks/usePreferences";
import type { RegionId } from "../../data/labourMarket";

export interface SpatialNode { id: RegionId; label: string; position: readonly [number, number, number]; value: number }
export function SpatialIntelligenceView({ nodes, selected, layer, onSelect }: { nodes: readonly SpatialNode[]; selected: RegionId; layer: string; onSelect: (id: RegionId) => void }) {
  const { t } = useLocale();
  const host = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" }); }
    catch { queueMicrotask(() => setAvailable(false)); return; }
    const scene = new THREE.Scene();
    const readColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const surface = new THREE.Color(); surface.setStyle(readColor("--bg-surface") || "#222622"); scene.background = surface;
    const camera = new THREE.PerspectiveCamera(38, 1, .1, 100); camera.position.set(4.8, 5.2, 7.6);
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, .25, 0); controls.enableDamping = !reducedMotion; controls.dampingFactor = .08;
    controls.minDistance = 5; controls.maxDistance = 13; controls.enablePan = true; controls.enableZoom = true;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x514939, 2.2));
    const light = new THREE.DirectionalLight(0xffffff, 1.8); light.position.set(-3, 7, 4); scene.add(light);
    const ground = new THREE.Mesh(new THREE.BoxGeometry(5.2, .08, 4.4), new THREE.MeshStandardMaterial({ color: readColor("--bg-subtle") || "#2c302b", roughness: .9 }));
    ground.position.y = -.07; scene.add(ground);
    const grid = new THREE.GridHelper(5.2, 13, readColor("--border-control") || "#7e847a", readColor("--border-subtle") || "#40473e");
    grid.position.y = -.02; scene.add(grid);
    const nodesGroup = new THREE.Group(); scene.add(nodesGroup);
    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const pickTargets: THREE.Mesh[] = [];
    const cssColor = (name: string) => { const color = new THREE.Color(); color.setStyle(readColor(name) || "#e4b76b"); return color; };
    const accent = cssColor("--chart-series-1"); const teal = cssColor("--chart-series-2");
    const low = cssColor("--chart-series-3");
    const gridMat = new THREE.LineBasicMaterial({ color: cssColor("--border-control"), transparent: true, opacity: .38 });
    const max = Math.max(1, ...nodes.map(node => node.value));
    for (const node of nodes) {
      const [x, , z] = node.position; const normal = Math.max(.1, node.value / max);
      const height = .18 + normal * 1.35;
      const material = new THREE.MeshStandardMaterial({ color: node.id === selected ? accent : teal, roughness: .55, metalness: .05 });
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.11, .15, height, 9), material);
      pillar.position.set(x, height / 2, z); pillar.userData.regionId = node.id; nodesGroup.add(pillar); pickTargets.push(pillar);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(node.id === selected ? .16 : .12, 12, 8), new THREE.MeshStandardMaterial({ color: node.id === selected ? accent : low, roughness: .4 }));
      cap.position.set(x, height + .1, z); cap.userData.regionId = node.id; nodesGroup.add(cap); pickTargets.push(cap);
      const canvas = document.createElement("canvas"); canvas.width = 256; canvas.height = 64;
      const context = canvas.getContext("2d");
      if (context) { context.clearRect(0, 0, 256, 64); context.fillStyle = readColor("--text-primary") || "#eee"; context.font = "500 28px Inter, Noto Sans Devanagari, sans-serif"; context.textAlign = "center"; context.fillText(node.label, 128, 42, 248); }
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
      label.position.set(x, height + .48, z); label.scale.set(.96, .24, 1); nodesGroup.add(label);
    }
    for (let index = 0; index < nodes.length; index++) {
      const from = nodes[index]; const to = nodes[(index + 3) % nodes.length];
      const points = [new THREE.Vector3(from.position[0], .02, from.position[2]), new THREE.Vector3(to.position[0], .02, to.position[2])];
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMat));
    }
    const width = Math.max(1, element.clientWidth); const height = Math.max(1, element.clientHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5)); renderer.setSize(width, height); renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true"); renderer.domElement.className = "spatial-canvas"; element.replaceChildren(renderer.domElement);
    const render = () => renderer.render(scene, camera);
    controls.addEventListener("change", render);
    const resize = new ResizeObserver(entries => { const box = entries[0]?.contentRect; if (!box) return; camera.aspect = box.width / Math.max(1, box.height); camera.updateProjectionMatrix(); renderer.setSize(box.width, box.height); render(); });
    resize.observe(element);
    const onPointer = (event: PointerEvent) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(pickTargets)[0]; if (hit?.object.userData.regionId) onSelect(hit.object.userData.regionId as RegionId); };
    renderer.domElement.addEventListener("click", onPointer);
    let active = true; let frame = 0;
    const observer = new IntersectionObserver(entries => { active = entries[0]?.isIntersecting ?? true; if (active && !reducedMotion && !frame) frame = requestAnimationFrame(animate); else if (!active && frame) { cancelAnimationFrame(frame); frame = 0; } });
    const animate = () => { if (!active || reducedMotion) { frame = 0; return; } controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); };
    observer.observe(element); render();
    if (!reducedMotion) frame = requestAnimationFrame(animate);
    return () => {
      observer.disconnect(); resize.disconnect(); if (frame) cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener("click", onPointer); controls.removeEventListener("change", render); controls.dispose();
      scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) { object.geometry?.dispose?.(); const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach(material => { if ("map" in material && material.map) material.map.dispose(); material.dispose(); }); } });
      renderer.dispose(); element.replaceChildren();
    };
  }, [nodes, selected, layer, onSelect]);
  return <div className="spatial-view">
    <div ref={host} className="spatial-stage" aria-label={t("workspace.spatialIntro")}>
      {!available && <div className="spatial-fallback" role="status">{t("workspace.spatialFallback")}</div>}
    </div>
  </div>;
}
