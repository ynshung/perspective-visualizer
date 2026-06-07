/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PerspectiveMode, RenderSettings } from './types';
import Sidebar from './components/Sidebar';
import InteractiveCanvas from './components/InteractiveCanvas';
import EducationalPanel from './components/EducationalPanel';
import { Eye, Layers, Trash2, RotateCcw, Box, HelpCircle } from 'lucide-react';

const INITIAL_POINTS = {
  onePoint: {
    horizonY: 400,
    vp1: { x: 500, y: 400 },
    frontCenter: { x: 500, y: 650 },
    frontTR: { x: 620, y: 550 },
    depthT: 0.4,
  },
  twoPoint: {
    horizonY: 400,
    vp1: { x: 120, y: 400 },
    vp2: { x: 880, y: 400 },
    frontBottom: { x: 500, y: 700 },
    frontTopY: 420,
    depthLeft: 0.45,
    depthRight: 0.45,
  },
  threePoint: {
    vp1: { x: 150, y: 300 },
    vp2: { x: 850, y: 300 },
    vp3: { x: 500, y: 880 }, // Nadir / Bird's Eye
    centerC: { x: 500, y: 460 },
    depthLeft: 0.45,
    depthRight: 0.45,
    depthVertical: 0.45,
  },
};

const INITIAL_SETTINGS: RenderSettings = {
  showGrid: true,
  showConstructionLines: true,
  showHorizonLine: true,
  showCoordinates: false,
  fillOpacity: 0.1,
  lineOpacity: 0.5,
  orthogonalColor: '#dc2626', // Red technical lead wax
  cubeColor: '#141414', // Intense drafting black ink
  showVanishingPoints: true,
  autoSnap: false,
};

export default function App() {
  const [mode, setMode] = useState<PerspectiveMode>('two-point');
  const [settings, setSettings] = useState<RenderSettings>(INITIAL_SETTINGS);
  const [points, setPoints] = useState(INITIAL_POINTS);
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null);

  const updateSettings = (newSettings: Partial<RenderSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleResetPoints = () => {
    setPoints(INITIAL_POINTS);
  };

  const handleApplyPreset = (presetId: string) => {
    if (presetId === 'default-1p') {
      setMode('one-point');
      setPoints((prev) => ({
        ...prev,
        onePoint: JSON.parse(JSON.stringify(INITIAL_POINTS.onePoint)),
      }));
    } else if (presetId === 'default-2p') {
      setMode('two-point');
      setPoints((prev) => ({
        ...prev,
        twoPoint: JSON.parse(JSON.stringify(INITIAL_POINTS.twoPoint)),
      }));
    } else if (presetId === 'skyscraper-3p') {
      setMode('three-point');
      setPoints((prev) => ({
        ...prev,
        threePoint: {
          vp1: { x: 100, y: 650 }, // Low left vanishing point
          vp2: { x: 900, y: 650 }, // Low right vanishing point
          vp3: { x: 500, y: 100 }, // High vertical vanishing point (Zenith)
          centerC: { x: 500, y: 550 },
          depthLeft: 0.4,
          depthRight: 0.4,
          depthVertical: 0.5,
        },
      }));
    } else if (presetId === 'birdseye-3p') {
      setMode('three-point');
      setPoints((prev) => ({
        ...prev,
        threePoint: {
          vp1: { x: 150, y: 250 },
          vp2: { x: 850, y: 250 },
          vp3: { x: 500, y: 920 }, // Low vertical vanishing point (Nadir)
          centerC: { x: 500, y: 380 },
          depthLeft: 0.42,
          depthRight: 0.42,
          depthVertical: 0.42,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-concrete perspective-grid text-charcoal flex flex-col font-sans antialiased selection:bg-neutral-300 selection:text-black border-8 border-white relative">
      {/* Top Header Navigation Line */}
      <header className="bg-white/70 border-b border-charcoal px-6 py-4 sticky top-0 z-10 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <div className="bg-charcoal text-white p-2 rounded-none border border-white">
            <Box className="w-5 h-5" />
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="serif-display text-3xl sm:text-4xl text-charcoal font-black tracking-tight">
              Perspective.Lab
            </h1>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-50 hidden sm:inline">
              Interactive Blueprint Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex space-x-6 text-[10px] uppercase font-bold tracking-wider opacity-60">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-charcoal mr-2"></span>Grid: {settings.showGrid ? 'Active' : 'Off'}
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 border border-charcoal mr-2"></span>Snap: {settings.autoSnap ? 'On' : 'Off'}
            </div>
          </div>
          
          <button
            onClick={handleResetPoints}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-charcoal hover:bg-charcoal hover:text-white border border-charcoal bg-transparent transition-all cursor-pointer"
            title="Reset sandbox coordinates to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset State
          </button>
        </div>
      </header>

      {/* Main Grid Dashboard layout */}
      <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-0">
        
        {/* Left Side: Educational terms glossary - 3 cols */}
        <div className="lg:col-span-3 h-[calc(100vh-140px)] lg:sticky lg:top-[95px] order-2 lg:order-1 min-h-[300px] lg:min-h-0">
          <EducationalPanel
            mode={mode}
            hoveredTerm={hoveredTerm}
            setHoveredTerm={setHoveredTerm}
          />
        </div>

        {/* Center Canvas: Interactive drawing - 6 cols */}
        <div className="lg:col-span-6 flex flex-col h-[calc(100vh-140px)] order-1 lg:order-2 space-y-4">
          <div className="flex-1 min-h-0">
            <InteractiveCanvas
              mode={mode}
              settings={settings}
              points={points}
              setPoints={setPoints}
              hoveredTerm={hoveredTerm}
            />
          </div>
        </div>

        {/* Right Side: Controllers Sidebar - 3 cols */}
        <div className="lg:col-span-3 h-[calc(100vh-140px)] lg:sticky lg:top-[95px] order-3 min-h-[300px] lg:min-h-0 flex flex-col">
          <Sidebar
            mode={mode}
            setMode={setMode}
            settings={settings}
            updateSettings={updateSettings}
            onReset={handleResetPoints}
            onApplyPreset={handleApplyPreset}
          />
        </div>

      </main>

      {/* Footer statistics mimicking draft labels */}
      <footer className="bg-white/40 border-t border-charcoal/80 h-10 px-6 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-charcoal/60">
        <div className="flex space-x-6">
          <span>Engine: v1.0.6</span>
          <span className="hidden sm:inline">Engine_State: Stable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Drafting active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
        </div>
      </footer>
    </div>
  );
}
