"use client";

import { useEffect, useRef } from "react";

export default function Particles({
  color = "rgba(255, 120, 50, ",
  count = 60,
  minSize = 1,
  maxSize = 4,
  speed = 0.5,
  className = "",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    let width, height;

    const init = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push(createParticle());
      }
    };

    const createParticle = () => {
      return {
        x: Math.random() * width,
        y: Math.random() * height + height, // Start slightly below
        size: Math.random() * (maxSize - minSize) + minSize,
        speedY: Math.random() * speed + speed * 0.5,
        speedX: (Math.random() - 0.5) * speed * 0.8,
        opacity: Math.random() * 0.8 + 0.1,
        life: Math.random() * 100,
      };
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p, index) => {
        p.y -= p.speedY;
        p.x += p.speedX;
        p.life += 1;

        // Wavering motion
        p.x += Math.sin(p.life * 0.05) * 0.5;

        // Fade out near top
        const fadeY = height * 0.2;
        let currentOpacity = p.opacity;
        if (p.y < fadeY) {
          currentOpacity = (p.y / fadeY) * p.opacity;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${color}${currentOpacity})`;
        // Add glow
        ctx.shadowBlur = p.size * 2;
        ctx.shadowColor = `${color}1)`;
        ctx.fill();

        // Reset particle if it goes off screen
        if (p.y < -10 || p.x < -10 || p.x > width + 10) {
          particles[index] = {
            ...createParticle(),
            y: height + 10,
            x: Math.random() * width,
          };
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(animationFrameId);
    };
  }, [color, count, maxSize, minSize, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}
