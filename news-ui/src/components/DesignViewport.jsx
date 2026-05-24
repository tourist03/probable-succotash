import React, { useEffect, useState } from 'react';

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;

export default function DesignViewport({ children }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const widthScale = window.innerWidth / DESIGN_WIDTH;
      const heightScale = window.innerHeight / DESIGN_HEIGHT;
      setScale(Math.min(1, widthScale, heightScale));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="resolution-root">
      <div
        className="resolution-canvas"
        style={{ '--resolution-scale': scale }}
        data-design-resolution="1920x1080"
      >
        {children}
      </div>
    </div>
  );
}
