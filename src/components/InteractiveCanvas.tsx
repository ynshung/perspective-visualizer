/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Point2D, PerspectiveMode, RenderSettings } from '../types';
import { Move, Settings, RefreshCw, Layers } from 'lucide-react';

interface InteractiveCanvasProps {
  mode: PerspectiveMode;
  settings: RenderSettings;
  points: any;
  setPoints: React.Dispatch<React.SetStateAction<any>>;
  hoveredTerm: string | null;
}

// Line-intersection solver
function lineIntersection(
  x1: number, y1: number, x2: number, y2: number,
  x3: number, y3: number, x4: number, y4: number
): Point2D | null {
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 0.0001) return null;

  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

// Project point onto segment and return fraction t
function projectPointToSegmentFraction(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 0.0001) return 0;
  
  const t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  return Math.max(0, Math.min(1, t));
}

export default function InteractiveCanvas({
  mode,
  settings,
  points,
  setPoints,
  hoveredTerm,
}: InteractiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 700, height: 550 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [hoveredHandle, setHoveredHandle] = useState<string | null>(null);

  // Resize boundaries tracking
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 350),
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Map virtual points to real pixels
  const virtualToReal = (p: Point2D): Point2D => {
    return {
      x: (p.x / 1000) * dimensions.width,
      y: (p.y / 1000) * dimensions.height,
    };
  };

  // Map real pixels to virtual coordinates
  const realToVirtual = (x: number, y: number): Point2D => {
    return {
      x: (x / dimensions.width) * 1000,
      y: (y / dimensions.height) * 1000,
    };
  };

  // Compute all key structures for 3D construction
  const getCubeGeometry = () => {
    if (mode === 'one-point') {
      const p = points.onePoint;
      const w = Math.max(20, Math.abs(p.frontTR.x - p.frontCenter.x) * 2);
      const h = Math.max(20, Math.abs(p.frontCenter.y - p.frontTR.y) * 2);

      // 4 Front Face Corners
      const v0 = { x: p.frontCenter.x - w / 2, y: p.frontCenter.y + h / 2 }; // Bottom Left
      const v1 = { x: p.frontCenter.x + w / 2, y: p.frontCenter.y + h / 2 }; // Bottom Right
      const v2 = { x: p.frontCenter.x + w / 2, y: p.frontCenter.y - h / 2 }; // Top Right
      const v3 = { x: p.frontCenter.x - w / 2, y: p.frontCenter.y - h / 2 }; // Top Left

      // 4 Back Face Corners (receded along orthogonals to vp1)
      const b0 = { x: v0.x + p.depthT * (p.vp1.x - v0.x), y: v0.y + p.depthT * (p.vp1.y - v0.y) };
      const b1 = { x: v1.x + p.depthT * (p.vp1.x - v1.x), y: v1.y + p.depthT * (p.vp1.y - v1.y) };
      const b2 = { x: v2.x + p.depthT * (p.vp1.x - v2.x), y: v2.y + p.depthT * (p.vp1.y - v2.y) };
      const b3 = { x: v3.x + p.depthT * (p.vp1.x - v3.x), y: v3.y + p.depthT * (p.vp1.y - v3.y) };

      // Faces list for rendering with simple volumetric shade mapping
      const faces = [
        { points: [v0, v1, v2, v3], shade: 1.0, label: 'Front' },
        { points: [b0, b1, b2, b3], shade: 0.6, label: 'Back' },
        { points: [v0, v3, b3, b0], shade: 0.75, label: 'Left' },
        { points: [v1, b1, b2, v2], shade: 0.85, label: 'Right' },
        { points: [v3, v2, b2, b3], shade: 0.95, label: 'Top' },
        { points: [v0, b0, b1, v1], shade: 0.55, label: 'Bottom' },
      ];

      // Front Face Size control
      const handles = [
        { id: 'vp1', pos: p.vp1, label: 'VP1', isVP: true },
        { id: 'frontCenter', pos: p.frontCenter, label: 'Center (Cube)' },
        { id: 'frontTR', pos: p.frontTR, label: 'Face Size (TR)' },
        { id: 'depthT', pos: { x: v0.x + p.depthT * (p.vp1.x - v0.x), y: v0.y + p.depthT * (p.vp1.y - v0.y) }, label: 'Depth Guide' },
      ];

      return { faces, handles, horizonY: p.horizonY, vps: [p.vp1], pointsList: [v0, v1, v2, v3, b0, b1, b2, b3] };
    } else if (mode === 'two-point') {
      const p = points.twoPoint;

      const cBottom = p.frontBottom;
      const cTop = { x: p.frontBottom.x, y: p.frontTopY };

      // Left & Right corners along the receding guidelines
      const lBottom = {
        x: cBottom.x + p.depthLeft * (p.vp1.x - cBottom.x),
        y: cBottom.y + p.depthLeft * (p.vp1.y - cBottom.y),
      };
      const lTop = {
        x: cTop.x + p.depthLeft * (p.vp1.x - cTop.x),
        y: cTop.y + p.depthLeft * (p.vp1.y - cTop.y),
      };

      const rBottom = {
        x: cBottom.x + p.depthRight * (p.vp2.x - cBottom.x),
        y: cBottom.y + p.depthRight * (p.vp2.y - cBottom.y),
      };
      const rTop = {
        x: cTop.x + p.depthRight * (p.vp2.x - cTop.x),
        y: cTop.y + p.depthRight * (p.vp2.y - cTop.y),
      };

      // Solve for back corners via intersections
      let bBottom = lineIntersection(lBottom.x, lBottom.y, p.vp2.x, p.vp2.y, rBottom.x, rBottom.y, p.vp1.x, p.vp1.y);
      let bTop = lineIntersection(lTop.x, lTop.y, p.vp2.x, p.vp2.y, rTop.x, rTop.y, p.vp1.x, p.vp1.y);

      if (!bBottom) {
        bBottom = { x: (lBottom.x + rBottom.x) / 2, y: (lBottom.y + rBottom.y) / 2 + 50 };
      }
      if (!bTop) {
        bTop = { x: (lTop.x + rTop.x) / 2, y: (lTop.y + rTop.y) / 2 - 50 };
      }

      const faces = [
        { points: [cBottom, lBottom, lTop, cTop], shade: 0.8, label: 'Front-Left' },
        { points: [cBottom, rBottom, rTop, cTop], shade: 0.95, label: 'Front-Right' },
        { points: [rBottom, bBottom, bTop, rTop], shade: 0.65, label: 'Back-Right' },
        { points: [lBottom, bBottom, bTop, lTop], shade: 0.5, label: 'Back-Left' },
        { points: [cTop, lTop, bTop, rTop], shade: 1.0, label: 'Top Lid' },
        { points: [cBottom, lBottom, bBottom, rBottom], shade: 0.45, label: 'Bottom Lid' },
      ];

      const handles = [
        { id: 'vp1', pos: p.vp1, label: 'Left VP', isVP: true },
        { id: 'vp2', pos: p.vp2, label: 'Right VP', isVP: true },
        { id: 'frontBottom', pos: p.frontBottom, label: 'Front Edge (Bottom)' },
        { id: 'frontTopY', pos: { x: p.frontBottom.x, y: p.frontTopY }, label: 'Front Edge (Height)' },
        { id: 'depthLeft', pos: lBottom, label: 'Left Wall Depth' },
        { id: 'depthRight', pos: rBottom, label: 'Right Wall Depth' },
      ];

      return { faces, handles, horizonY: p.horizonY, vps: [p.vp1, p.vp2], pointsList: [cBottom, cTop, lBottom, lTop, rBottom, rTop, bBottom, bTop] };
    } else {
      // Three-point Perspective
      const p = points.threePoint;

      const c = p.centerC;

      // Define depth extremities based on receding rails
      const l1 = { x: c.x + p.depthLeft * (p.vp1.x - c.x), y: c.y + p.depthLeft * (p.vp1.y - c.y) };
      const l2 = { x: c.x + p.depthRight * (p.vp2.x - c.x), y: c.y + p.depthRight * (p.vp2.y - c.y) };
      const l3 = { x: c.x + p.depthVertical * (p.vp3.x - c.x), y: c.y + p.depthVertical * (p.vp3.y - c.y) };

      // Compute geometric coordinate intersections of the back faces
      let l12 = lineIntersection(l1.x, l1.y, p.vp2.x, p.vp2.y, l2.x, l2.y, p.vp1.x, p.vp1.y);
      let l13 = lineIntersection(l1.x, l1.y, p.vp3.x, p.vp3.y, l3.x, l3.y, p.vp1.x, p.vp1.y);
      let l23 = lineIntersection(l2.x, l2.y, p.vp3.x, p.vp3.y, l3.x, l3.y, p.vp2.x, p.vp2.y);

      // Fallbacks in case parallel projection errors out
      if (!l12) l12 = { x: (l1.x + l2.x) / 2, y: (l1.y + l2.y) / 2 - 40 };
      if (!l13) l13 = { x: (l1.x + l3.x) / 2, y: (l1.y + l3.y) / 2 + 40 };
      if (!l23) l23 = { x: (l2.x + l3.x) / 2, y: (l2.y + l3.y) / 2 + 40 };

      // Solve for back-most corner (intersection of rails receding to VPs from opposite points)
      let bBack = lineIntersection(l12.x, l12.y, p.vp3.x, p.vp3.y, l13.x, l13.y, p.vp2.x, p.vp2.y);
      if (!bBack) bBack = { x: (l12.x + l13.x) / 2 + 20, y: (l12.y + l23.y) / 2 + 20 };

      const faces = [
        { points: [c, l1, l12, l2], shade: 0.95, label: 'Lid' },
        { points: [c, l1, l13, l3], shade: 0.75, label: 'Front-Left' },
        { points: [c, l2, l23, l3], shade: 0.85, label: 'Front-Right' },
        { points: [l3, l13, bBack, l23], shade: 0.45, label: 'Floor' },
        { points: [l1, l12, bBack, l13], shade: 0.55, label: 'Back-Left' },
        { points: [l2, l12, bBack, l23], shade: 0.65, label: 'Back-Right' },
      ];

      const handles = [
        { id: 'vp1', pos: p.vp1, label: 'Left VP', isVP: true },
        { id: 'vp2', pos: p.vp2, label: 'Right VP', isVP: true },
        { id: 'vp3', pos: p.vp3, label: 'Vertical VP', isVP: true },
        { id: 'centerC', pos: p.centerC, label: 'Center Front Corner' },
        { id: 'depthLeft', pos: l1, label: 'Left Wall Scale' },
        { id: 'depthRight', pos: l2, label: 'Right Wall Scale' },
        { id: 'depthVertical', pos: l3, label: 'Vertical Height Scale' },
      ];

      // In 3-point perspective, the horizon line is traditionally defined as the line connecting VP1 and VP2.
      return { faces, handles, horizonY: null, vps: [p.vp1, p.vp2, p.vp3], pointsList: [c, l1, l2, l3, l12, l13, l23, bBack] };
    }
  };

  const { faces, handles, horizonY, vps, pointsList } = getCubeGeometry();

  // Draw cycle for canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support High-DPI screen sharp lines
    const ratio = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * ratio;
    canvas.height = dimensions.height * ratio;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(ratio, ratio);

    // Clear Canvas with absolute crisp flat layout
    ctx.fillStyle = '#E4E3E0'; // concrete background
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 1. Draw light auxiliary grid background
    if (settings.showGrid) {
      ctx.strokeStyle = '#d1d1cf'; // light sand blueprint grid lines
      ctx.lineWidth = 0.5;
      const step = 25; // in pixels
      
      // Draw grid meshes
      for (let x = 0; x < dimensions.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, dimensions.height);
        ctx.stroke();
      }
      for (let y = 0; y < dimensions.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(dimensions.width, y);
        ctx.stroke();
      }
    }

    // 2. Draw Horizon Line (In 1p & 2p it fits a y index. In 3p, it connects VP1 & VP2)
    if (settings.showHorizonLine) {
      const isHorizonHovered = hoveredTerm === 'horizon';
      ctx.save();
      
      if (isHorizonHovered) {
        ctx.strokeStyle = '#dc2626'; // draft red wax
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = '#141414'; // charcoal line
        ctx.lineWidth = 1.2;
      }
      
      ctx.setLineDash([8, 4]);

      if (horizonY !== null) {
        const py = (horizonY / 1000) * dimensions.height;
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(dimensions.width, py);
        ctx.stroke();

        ctx.fillStyle = '#141414';
        ctx.font = '9px monospace';
        ctx.fillText('HORIZON LINE (EYE LEVEL)', 12, py - 6);
      } else if (mode === 'three-point') {
        // Horizon connecting vp1 and vp2
        const p1 = virtualToReal(points.threePoint.vp1);
        const p2 = virtualToReal(points.threePoint.vp2);

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        ctx.fillStyle = '#141414';
        ctx.font = '9px monospace';
        ctx.fillText('HORIZON PLANE (VP1 TO VP2)', Math.min(p1.x, p2.x) + 20, p1.y - 6);
      }
      ctx.restore();
    }

    // 3. Draw Perspective Flooring Grid Lines (Immersion grid)
    if (settings.showGrid) {
      ctx.save();
      ctx.strokeStyle = 'rgba(20, 20, 20, 0.08)'; // fine subtle grid rays
      ctx.lineWidth = 0.5;

      if (vps.length > 0) {
        // Draw floor rays originating from vanishing point to bottom bounds
        const primaryVP = virtualToReal(vps[0]);
        for (let x = 0; x <= dimensions.width; x += 40) {
          ctx.beginPath();
          ctx.moveTo(primaryVP.x, primaryVP.y);
          ctx.lineTo(x, dimensions.height);
          ctx.stroke();
        }

        if (vps.length > 1) {
          const secVP = virtualToReal(vps[1]);
          for (let x = 0; x <= dimensions.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(secVP.x, secVP.y);
            ctx.lineTo(x, dimensions.height);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    // 4. Draw Orthogonal Guidelines (Convergence lines)
    if (settings.showConstructionLines) {
      const isOrthogonalsHovered = hoveredTerm === 'orthogonals';
      ctx.save();
      
      if (isOrthogonalsHovered) {
        ctx.strokeStyle = settings.orthogonalColor;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = settings.orthogonalColor;
        ctx.globalAlpha = settings.lineOpacity;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([6, 3]);
      }

      // Draw lines joining vanishing points directly to vertices in question
      if (mode === 'one-point') {
        const vp = virtualToReal(points.onePoint.vp1);
        faces[0].points.forEach((corner) => {
          const rPos = virtualToReal(corner);
          ctx.beginPath();
          ctx.moveTo(rPos.x, rPos.y);
          ctx.lineTo(vp.x, vp.y);
          ctx.stroke();
        });
      } else if (mode === 'two-point') {
        const vpLeft = virtualToReal(points.twoPoint.vp1);
        const vpRight = virtualToReal(points.twoPoint.vp2);

        // Draw left paths
        const frontCorners = [
          virtualToReal(points.twoPoint.frontBottom),
          virtualToReal({ x: points.twoPoint.frontBottom.x, y: points.twoPoint.frontTopY })
        ];

        frontCorners.forEach((pt) => {
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(vpLeft.x, vpLeft.y);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(vpRight.x, vpRight.y);
          ctx.stroke();
        });

        // Left wall and right wall receding lines for clarity
        const lBot = virtualToReal(faces[0].points[1]); // lBottom
        const rBot = virtualToReal(faces[1].points[1]); // rBottom
        const lTop = virtualToReal(faces[0].points[2]); // lTop
        const rTop = virtualToReal(faces[1].points[2]); // rTop

        ctx.beginPath();
        ctx.moveTo(lBot.x, lBot.y);
        ctx.lineTo(vpRight.x, vpRight.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rBot.x, rBot.y);
        ctx.lineTo(vpLeft.x, vpLeft.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(lTop.x, lTop.y);
        ctx.lineTo(vpRight.x, vpRight.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rTop.x, rTop.y);
        ctx.lineTo(vpLeft.x, vpLeft.y);
        ctx.stroke();

      } else if (mode === 'three-point') {
        const vpL = virtualToReal(points.threePoint.vp1);
        const vpR = virtualToReal(points.threePoint.vp2);
        const vpV = virtualToReal(points.threePoint.vp3);
        const centralC = virtualToReal(points.threePoint.centerC);

        // Draw primary axes from center core
        ctx.beginPath(); ctx.moveTo(centralC.x, centralC.y); ctx.lineTo(vpL.x, vpL.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(centralC.x, centralC.y); ctx.lineTo(vpR.x, vpR.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(centralC.x, centralC.y); ctx.lineTo(vpV.x, vpV.y); ctx.stroke();

        // Draw auxiliary paths from scale extremity vertices to reciprocals
        const l1Real = virtualToReal(faces[0].points[1]); // L1
        const l2Real = virtualToReal(faces[0].points[3]); // L2
        const l3Real = virtualToReal(faces[1].points[3]); // L3

        ctx.beginPath(); ctx.moveTo(l1Real.x, l1Real.y); ctx.lineTo(vpR.x, vpR.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(l1Real.x, l1Real.y); ctx.lineTo(vpV.x, vpV.y); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(l2Real.x, l2Real.y); ctx.lineTo(vpL.x, vpL.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(l2Real.x, l2Real.y); ctx.lineTo(vpV.x, vpV.y); ctx.stroke();

        ctx.beginPath(); ctx.moveTo(l3Real.x, l3Real.y); ctx.lineTo(vpL.x, vpL.y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(l3Real.x, l3Real.y); ctx.lineTo(vpR.x, vpR.y); ctx.stroke();
      }

      ctx.restore();
    }

    // 5. Draw Transversals indicator highlights
    const isTransversalsHovered = hoveredTerm === 'transversals';
    if (isTransversalsHovered && (mode === 'one-point' || mode === 'two-point')) {
      ctx.save();
      ctx.strokeStyle = '#141414'; // high-contrast focus line
      ctx.lineWidth = 2.5;

      if (mode === 'one-point') {
        const v = [
          virtualToReal(pointsList[0]),
          virtualToReal(pointsList[1]),
          virtualToReal(pointsList[2]),
          virtualToReal(pointsList[3]),
        ];
        // horizontal front, vertical front
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y); ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[2].x, v[2].y); ctx.lineTo(v[3].x, v[3].y);
        ctx.closePath();
        ctx.stroke();

        // back transversals
        const b = [
          virtualToReal(pointsList[4]),
          virtualToReal(pointsList[5]),
          virtualToReal(pointsList[6]),
          virtualToReal(pointsList[7]),
        ];
        ctx.beginPath();
        ctx.moveTo(b[0].x, b[0].y); ctx.lineTo(b[1].x, b[1].y);
        ctx.lineTo(b[2].x, b[2].y); ctx.lineTo(b[3].x, b[3].y);
        ctx.closePath();
        ctx.stroke();
      } else if (mode === 'two-point') {
        // Vertical transversals
        const bottomCorners = [pointsList[0], pointsList[2], pointsList[4], pointsList[6]];
        const topCorners = [pointsList[1], pointsList[3], pointsList[5], pointsList[7]];

        for (let i = 0; i < 4; i++) {
          const ptBot = virtualToReal(bottomCorners[i]);
          const ptTop = virtualToReal(topCorners[i]);
          ctx.beginPath();
          ctx.moveTo(ptBot.x, ptBot.y);
          ctx.lineTo(ptTop.x, ptTop.y);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 6. Draw Cube Faces (shaded 3D rendering)
    faces.forEach((face) => {
      ctx.save();
      ctx.beginPath();
      const pStart = virtualToReal(face.points[0]);
      ctx.moveTo(pStart.x, pStart.y);
      for (let i = 1; i < face.points.length; i++) {
        const pNext = virtualToReal(face.points[i]);
        ctx.lineTo(pNext.x, pNext.y);
      }
      ctx.closePath();

      // Shaded Facet Fill
      ctx.fillStyle = settings.cubeColor;
      ctx.globalAlpha = settings.fillOpacity * face.shade;
      ctx.fill();

      // Solid Wireframe stroke
      ctx.strokeStyle = settings.cubeColor;
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    });

    // 7. Draw Vertex Coordinates Overlay Labels if enabled
    if (settings.showCoordinates) {
      ctx.save();
      ctx.fillStyle = '#141414';
      ctx.font = '9px monospace';
      
      pointsList.forEach((pt, idx) => {
        const real = virtualToReal(pt);
        const coordText = `v${idx}(${Math.round(pt.x)}, ${Math.round(pt.y)})`;
        
        ctx.fillStyle = 'rgba(228, 227, 224, 0.9)';
        const textWidth = ctx.measureText(coordText).width;
        ctx.fillRect(real.x - 2, real.y - 12, textWidth + 4, 11);
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(real.x - 2, real.y - 12, textWidth + 4, 11);
        
        ctx.fillStyle = '#141414';
        ctx.fillText(coordText, real.x, real.y - 3);
      });
      ctx.restore();
    }

    // 8. Draw Vanishing Point Labels
    if (settings.showVanishingPoints) {
      handles.filter(h => h.isVP).forEach((vpHandle) => {
        const real = virtualToReal(vpHandle.pos);
        ctx.save();
        ctx.fillStyle = settings.orthogonalColor;
        ctx.beginPath();
        ctx.arc(real.x, real.y, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.font = '9px monospace';
        ctx.fillStyle = '#141414';
        
        // Draw crosshairs around VP
        ctx.strokeStyle = settings.orthogonalColor;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(real.x - 8, real.y); ctx.lineTo(real.x + 8, real.y);
        ctx.moveTo(real.x, real.y - 8); ctx.lineTo(real.x, real.y + 8);
        ctx.stroke();

        ctx.fillText(vpHandle.label, real.x + 10, real.y + 3);
        ctx.restore();
      });
    }

    // 9. Draw interactive handles (glowing nodes)
    const isVP_Hovered = hoveredTerm === 'vp';
    
    handles.forEach((handle) => {
      const real = virtualToReal(handle.pos);
      const isVP = handle.isVP || false;
      const isActive = activeHandle === handle.id;
      const isHovered = hoveredHandle === handle.id;

      ctx.save();

      // Skip drawing VPs regular circle if showVanishingPoints is off,
      // unless actively hovered or focused.
      if (isVP && !settings.showVanishingPoints && !isActive && !isHovered) {
        return;
      }

      ctx.beginPath();
      const dotRadius = isVP ? 7 : 5;
      ctx.arc(real.x, real.y, dotRadius, 0, Math.PI * 2);

      // Handle coloring & styling to match draft pencils
      if (isVP) {
        ctx.fillStyle = isActive ? '#dc2626' : (isHovered || isVP_Hovered ? '#141414' : '#ffffff');
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 1.5;
      } else {
        // Regular structural handle
        ctx.fillStyle = isActive ? '#141414' : (isHovered ? '#ffffff' : '#f2f1ef');
        ctx.strokeStyle = '#141414';
        ctx.lineWidth = 1.5;

        // Draw a tiny dot inside active handle
        if (isActive) {
          ctx.beginPath();
          ctx.arc(real.x, real.y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = '#dc2626';
          ctx.fill();
        }
      }

      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

  }, [dimensions, mode, settings, points, activeHandle, hoveredHandle, hoveredTerm]);

  // Handle Drag calculations
  const findHandleAtPosition = (mx: number, my: number) => {
    // Determine proximity to handles
    for (const h of handles) {
      if (h.isVP && !settings.showVanishingPoints) {
        // Skip hidden VP handles
        continue;
      }
      
      const realPos = virtualToReal(h.pos);
      const dist = Math.hypot(mx - realPos.x, my - realPos.y);
      if (dist <= 15) {
        return h.id;
      }
    }

    // Proximity to horizon line for dragging Y in 1p/2p
    if (horizonY !== null && settings.showHorizonLine) {
      const horizonRealY = (horizonY / 1000) * dimensions.height;
      if (Math.abs(my - horizonRealY) <= 12) {
        return 'horizon';
      }
    }

    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const hitId = findHandleAtPosition(mx, my);
    if (hitId) {
      setActiveHandle(hitId);
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Handle cursor style and hover indicators
    if (!activeHandle) {
      const hoveredId = findHandleAtPosition(mx, my);
      setHoveredHandle(hoveredId);
    }

    if (!activeHandle) return;

    // Convert mouse pixels to 1000x1000 virtual space
    let vMouse = realToVirtual(mx, my);

    if (settings.autoSnap && activeHandle !== 'horizon') {
      vMouse.x = Math.round(vMouse.x / 25) * 25;
      vMouse.y = Math.round(vMouse.y / 25) * 25;
    }

    // Clamp coordinates safely
    vMouse.x = Math.max(10, Math.min(990, vMouse.x));
    vMouse.y = Math.max(10, Math.min(990, vMouse.y));

    // Execute state transformations based on which handle is dragged
    setPoints((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev));

      if (mode === 'one-point') {
        const p = copy.onePoint;
        if (activeHandle === 'horizon') {
          p.horizonY = vMouse.y;
          p.vp1.y = vMouse.y;
        } else if (activeHandle === 'vp1') {
          p.vp1.x = vMouse.x;
          p.vp1.y = p.horizonY; // lock Y to horizon
        } else if (activeHandle === 'frontCenter') {
          const dx = vMouse.x - p.frontCenter.x;
          const dy = vMouse.y - p.frontCenter.y;
          p.frontCenter = vMouse;
          // shift size TR handily to maintain dimensions of front face!
          p.frontTR.x += dx;
          p.frontTR.y += dy;
        } else if (activeHandle === 'frontTR') {
          // ensure TR handles stay diagonally opposite and logically positive
          p.frontTR.x = Math.max(p.frontCenter.x + 10, vMouse.x);
          p.frontTR.y = Math.min(p.frontCenter.y - 10, vMouse.y);
        } else if (activeHandle === 'depthT') {
          const hw = Math.abs(p.frontTR.x - p.frontCenter.x);
          const hh = Math.abs(p.frontCenter.y - p.frontTR.y);
          const v0 = { x: p.frontCenter.x - hw, y: p.frontCenter.y + hh };
          
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, v0.x, v0.y, p.vp1.x, p.vp1.y);
          p.depthT = Math.max(0.05, Math.min(0.95, t));
        }

      } else if (mode === 'two-point') {
        const p = copy.twoPoint;
        if (activeHandle === 'horizon') {
          p.horizonY = vMouse.y;
          p.vp1.y = vMouse.y;
          p.vp2.y = vMouse.y;
        } else if (activeHandle === 'vp1') {
          p.vp1.x = Math.min(p.vp2.x - 50, vMouse.x);
          p.vp1.y = p.horizonY;
        } else if (activeHandle === 'vp2') {
          p.vp2.x = Math.max(p.vp1.x + 50, vMouse.x);
          p.vp2.y = p.horizonY;
        } else if (activeHandle === 'frontBottom') {
          p.frontBottom = vMouse;
        } else if (activeHandle === 'frontTopY') {
          p.frontTopY = Math.min(p.frontBottom.y - 10, vMouse.y);
        } else if (activeHandle === 'depthLeft') {
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, p.frontBottom.x, p.frontBottom.y, p.vp1.x, p.vp1.y);
          p.depthLeft = Math.max(0.05, Math.min(0.95, t));
        } else if (activeHandle === 'depthRight') {
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, p.frontBottom.x, p.frontBottom.y, p.vp2.x, p.vp2.y);
          p.depthRight = Math.max(0.05, Math.min(0.95, t));
        }

      } else if (mode === 'three-point') {
        const p = copy.threePoint;
        if (activeHandle === 'vp1') {
          p.vp1 = vMouse;
        } else if (activeHandle === 'vp2') {
          p.vp2 = vMouse;
        } else if (activeHandle === 'vp3') {
          p.vp3 = vMouse;
        } else if (activeHandle === 'centerC') {
          p.centerC = vMouse;
        } else if (activeHandle === 'depthLeft') {
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, p.centerC.x, p.centerC.y, p.vp1.x, p.vp1.y);
          p.depthLeft = Math.max(0.05, Math.min(0.95, t));
        } else if (activeHandle === 'depthRight') {
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, p.centerC.x, p.centerC.y, p.vp2.x, p.vp2.y);
          p.depthRight = Math.max(0.05, Math.min(0.95, t));
        } else if (activeHandle === 'depthVertical') {
          const t = projectPointToSegmentFraction(vMouse.x, vMouse.y, p.centerC.x, p.centerC.y, p.vp3.x, p.vp3.y);
          p.depthVertical = Math.max(0.05, Math.min(0.95, t));
        }
      }

      return copy;
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (activeHandle) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setActiveHandle(null);
    }
  };

  // Dynamically calculate viewer pitch mode to display as high-value telemetry
  const getViewAngleDescription = () => {
    if (mode === 'one-point') {
      const cy = points.onePoint.frontCenter.y;
      const hy = points.onePoint.horizonY;
      if (cy > hy + 30) return "Looking Downward (Bird's Eye / Above Object)";
      if (cy < hy - 30) return "Looking Upward (Worm's Eye / Below Object)";
      return "Eye Level (Straight On)";
    } else if (mode === 'two-point') {
      const cy = points.twoPoint.frontBottom.y;
      const hy = points.twoPoint.horizonY;
      if (cy > hy + 100) return "Looking Downward (Worm's eye bottom visible, looking down on lid)";
      if (cy < hy) return "Looking high upward (Worm's eye, looking up at bottom)";
      return "Eye Level Perspective";
    } else {
      // 3-point
      const vp3Y = points.threePoint.vp3.y;
      const centerY = points.threePoint.centerC.y;
      if (vp3Y > centerY) return "Bird's Eye (Looking down towards Nadir)";
      return "Worm's Eye (Soaring celestial views, looking up towards Zenith)";
    }
  };

  return (
    <div className="bg-[#f2f1ef]/85 backdrop-blur-md border border-charcoal p-4 overflow-hidden flex flex-col h-full shadow-none relative">
      {/* Dynamic View Angle Stat Bar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-charcoal/30 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-charcoal text-[#E4E3E0] px-2.5 py-1 rounded-none font-bold font-mono text-[10px] uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Mode: {mode.toUpperCase().replace('-', ' ')}
          </div>
          <span className="font-bold opacity-80 text-[11px] uppercase tracking-wide hidden sm:inline">
            {getViewAngleDescription()}
          </span>
        </div>
        <div className="flex items-center gap-3 opacity-60 font-mono text-[10px] uppercase font-bold">
          <div>Grid: 25px</div>
          <div className="hidden md:block">Plate: {dimensions.width}×{dimensions.height}</div>
        </div>
      </div>

      {/* Canvas container */}
      <div
        ref={containerRef}
        className="flex-1 rounded-none border border-charcoal overflow-hidden relative cursor-crosshair select-none min-h-[300px]"
        style={{ cursor: activeHandle ? 'grabbing' : 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute inset-x-0 inset-y-0 w-full h-full block"
          id="perspectiveCanvas"
        />

        {/* Dynamic Drag Helpers Float Banner */}
        <div className="absolute bottom-3 left-3 bg-charcoal text-[#f2f1ef] px-3 py-1.5 rounded-none text-[10px] uppercase tracking-wider font-bold border border-[#f2f1ef]/50 flex items-center gap-1.5 pointer-events-none">
          <Move className="w-3.5 h-3.5" />
          <span>Interactive: Move handles, vertices & horizon lines</span>
        </div>
      </div>
    </div>
  );
}
