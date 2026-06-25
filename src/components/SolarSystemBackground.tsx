import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Lightweight solar system rendered to a fixed canvas behind the app.
 * Planets orbit + rotate continuously. Pure visual; no interaction.
 */
export function SolarSystemBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = ref.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 35, 80);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Lighting
   // Lighting
scene.add(new THREE.AmbientLight(0xffffff, 1.5));

const sunLight = new THREE.PointLight(
  0xffffff,
  4,
  400
);

scene.add(sunLight);

    // Sun
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffcc55 })
    );
    scene.add(sun);

    // Sun halo
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(5.4, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.18 })
    );
    scene.add(halo);

    type Planet = { mesh: THREE.Mesh; pivot: THREE.Object3D; speed: number; spin: number };
    const planetDefs = [
      { color: 0xb5b5b5, size: 0.6, dist: 8, speed: 0.018, spin: 0.02 },   // Mercury
      { color: 0xeccc8e, size: 0.95, dist: 12, speed: 0.014, spin: 0.018 }, // Venus
      { color: 0x4fb0ff, size: 1.0, dist: 16, speed: 0.012, spin: 0.022 }, // Earth
      { color: 0xd97a4a, size: 0.8, dist: 20, speed: 0.01, spin: 0.02 },   // Mars
      { color: 0xd9b48a, size: 2.2, dist: 28, speed: 0.007, spin: 0.025 }, // Jupiter
      { color: 0xe8d39b, size: 1.9, dist: 36, speed: 0.0055, spin: 0.024 }, // Saturn
      { color: 0x9fe6e8, size: 1.3, dist: 44, speed: 0.0042, spin: 0.02 }, // Uranus
      { color: 0x5b7cff, size: 1.25, dist: 52, speed: 0.0035, spin: 0.02 }, // Neptune
    ];
    const planets: Planet[] = planetDefs.map((p) => {
      const pivot = new THREE.Object3D();
      pivot.rotation.x = (Math.random() - 0.5) * 0.1;
      scene.add(pivot);
     const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(p.size, 24, 24),
  new THREE.MeshBasicMaterial({
    color: p.color
  })
);
      // orbit ring
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(p.dist - 0.02, p.dist + 0.02, 128),
        new THREE.MeshBasicMaterial({ color: 0x4f7fff, side: THREE.DoubleSide, transparent: true, opacity: 0.12 })
      );
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      return { mesh, pivot, speed: p.speed, spin: p.spin };
    });

    // Saturn ring (planet index 5)
    const saturn = planets[5].mesh;
    const sRing = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.6, 64),
      new THREE.MeshBasicMaterial({ color: 0xe8d39b, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    sRing.rotation.x = Math.PI / 2.4;
    saturn.add(sRing);

    // Background stars
    const starGeo = new THREE.BufferGeometry();
    const starCount = 1200;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 400 + Math.random() * 400;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.8, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    let raf = 0;
    const animate = () => {
      sun.rotation.y += 0.002;
      planets.forEach((p) => {
        p.pivot.rotation.y += p.speed;
        p.mesh.rotation.y += p.spin;
      });
      stars.rotation.y += 0.0003;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-20 h-full w-full opacity-60"
      aria-hidden
    />
  );
}
