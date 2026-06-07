/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sparkles,
  Settings,
  Eye,
  Sliders,
  Palette,
  RotateCcw,
  LayoutGrid,
  TrendingUp,
  Building,
  Plane,
  EyeOff
} from 'lucide-react';
import { PerspectiveMode, RenderSettings } from '../types';

interface SidebarProps {
  mode: PerspectiveMode;
  setMode: (mode: PerspectiveMode) => void;
  settings: RenderSettings;
  updateSettings: (newSettings: Partial<RenderSettings>) => void;
  onReset: () => void;
  onApplyPreset: (presetId: string) => void;
}

export default function Sidebar({
  mode,
  setMode,
  settings,
  updateSettings,
  onReset,
  onApplyPreset,
}: SidebarProps) {
  
  const presets = [
    {
      id: 'default-1p',
      name: 'Deep Corridor',
      desc: 'Typical central focal point drawing structure.',
      mode: 'one-point' as PerspectiveMode,
      icon: LayoutGrid,
    },
    {
      id: 'default-2p',
      name: 'City Corner',
      desc: 'Looking angularly at structural front edge.',
      mode: 'two-point' as PerspectiveMode,
      icon: Building,
    },
    {
      id: 'skyscraper-3p',
      name: 'Worm\'s Eye Block',
      desc: 'Looking straight up rendering massive vertical scale.',
      mode: 'three-point' as PerspectiveMode,
      icon: TrendingUp,
    },
    {
      id: 'birdseye-3p',
      name: 'Bird\'s Eye View',
      desc: 'Hovering high above, looking down towards nadir.',
      mode: 'three-point' as PerspectiveMode,
      icon: Plane,
    },
  ];

  return (
    <div className="bg-[#f2f1ef]/85 backdrop-blur-md border border-charcoal overflow-hidden h-full flex flex-col shadow-none">
      {/* Perspective Tab Selection */}
      <div className="bg-[#E4E3E0] border-b border-charcoal p-4">
        <label className="block text-[10px] font-bold text-charcoal uppercase tracking-[0.2em] mb-2.5">
          Projection Mode
        </label>
        <div className="flex p-0.5 bg-charcoal rounded-none">
          <button
            onClick={() => setMode('one-point')}
            className={`flex-1 text-center py-2 text-[10px] uppercase tracking-wider font-bold rounded-none transition-all duration-150 ${
              mode === 'one-point'
                ? 'bg-[#E4E3E0] text-charcoal'
                : 'text-white/80 hover:text-white'
            }`}
          >
            1-Point
          </button>
          <button
            onClick={() => setMode('two-point')}
            className={`flex-1 text-center py-2 text-[10px] uppercase tracking-wider font-bold rounded-none transition-all duration-150 ${
              mode === 'two-point'
                ? 'bg-[#E4E3E0] text-charcoal'
                : 'text-white/80 hover:text-white'
            }`}
          >
            2-Point
          </button>
          <button
            onClick={() => setMode('three-point')}
            className={`flex-1 text-center py-2 text-[10px] uppercase tracking-wider font-bold rounded-none transition-all duration-150 ${
              mode === 'three-point'
                ? 'bg-[#E4E3E0] text-charcoal'
                : 'text-white/80 hover:text-white'
            }`}
          >
            3-Point
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Presets & Configurations */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-widest text-[#141414] flex items-center gap-1.5 font-sans">
            <Sparkles className="w-4 h-4" />
            Quick Presets
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {presets.map((preset) => {
              const IconComp = preset.icon;
              return (
                <button
                  key={preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                  className="flex items-start text-left p-2.5 rounded-none border border-charcoal/20 hover:border-charcoal hover:bg-white transition-all text-xs group"
                >
                  <div className="p-2 bg-[#E4E3E0]/70 group-hover:bg-charcoal group-hover:text-white rounded-none mr-2.5 transition-colors">
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-charcoal flex items-center gap-1.5 font-mono">
                      {preset.name}
                      <span className="text-[9px] font-bold bg-charcoal text-white px-1.5 py-0.2 uppercase tracking-wide">
                        {preset.mode.split('-')[0]}p
                      </span>
                    </h4>
                    <p className="text-[11px] opacity-70 mt-0.5 leading-snug font-mono">
                      {preset.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visibility Toggles */}
        <div className="space-y-3 pt-4 border-t border-charcoal/30">
          <h3 className="font-bold text-xs uppercase tracking-widest text-[#141414] flex items-center gap-1.5 font-sans">
            <Settings className="w-4 h-4" />
            System View Toggles
          </h3>

          <div className="space-y-2">
            {/* Show Horizon */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-charcoal inline-block"></span>
                Horizon line
              </span>
              <input
                type="checkbox"
                checked={settings.showHorizonLine}
                onChange={(e) => updateSettings({ showHorizonLine: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Show Construction Lines */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#dc2626] inline-block"></span>
                Orthogonal Guidelines
              </span>
              <input
                type="checkbox"
                checked={settings.showConstructionLines}
                onChange={(e) => updateSettings({ showConstructionLines: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Show Horizon grid */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 border border-charcoal inline-block"></span>
                Spatial grid background
              </span>
              <input
                type="checkbox"
                checked={settings.showGrid}
                onChange={(e) => updateSettings({ showGrid: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Show Draggable VPs */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-charcoal rounded-full inline-block"></span>
                Vanishing Point Handles
              </span>
              <input
                type="checkbox"
                checked={settings.showVanishingPoints}
                onChange={(e) => updateSettings({ showVanishingPoints: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Show Coordinates */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-neutral-400 inline-block"></span>
                Vertex Coordinates
              </span>
              <input
                type="checkbox"
                checked={settings.showCoordinates}
                onChange={(e) => updateSettings({ showCoordinates: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>

            {/* Auto-Snap */}
            <label className="flex items-center justify-between p-2.5 rounded-none border border-charcoal/10 bg-white/40 hover:bg-white cursor-pointer select-none">
              <span className="text-xs font-bold uppercase tracking-wider text-charcoal flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-charcoal inline-block"></span>
                Snap to canvas grids
              </span>
              <input
                type="checkbox"
                checked={settings.autoSnap}
                onChange={(e) => updateSettings({ autoSnap: e.target.checked })}
                className="w-4 h-4 rounded-none border-charcoal text-charcoal focus:ring-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Aspect Fine Tuning sliders */}
        <div className="space-y-4 pt-4 border-t border-charcoal/30">
          <h3 className="font-bold text-xs uppercase tracking-widest text-[#141414] flex items-center gap-1.5 font-sans">
            <Sliders className="w-4 h-4" />
            Line Density Fine-Tuning
          </h3>

          {/* Cube Facet Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold font-mono text-charcoal">
              <span>Facet Shading Opacity</span>
              <span>{Math.round(settings.fillOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.fillOpacity}
              onChange={(e) => updateSettings({ fillOpacity: parseFloat(e.target.value) })}
              className="w-full accent-charcoal h-1 cursor-pointer bg-charcoal/20 rounded-none"
            />
          </div>

          {/* Guideline Opacity */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold font-mono text-charcoal">
              <span>Guideline Opacity</span>
              <span>{Math.round(settings.lineOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.lineOpacity}
              onChange={(e) => updateSettings({ lineOpacity: parseFloat(e.target.value) })}
              className="w-full accent-charcoal h-1 cursor-pointer bg-charcoal/20 rounded-none"
            />
          </div>
        </div>

        {/* Color configurations */}
        <div className="space-y-3 pt-4 border-t border-charcoal/30">
          <h3 className="font-bold text-xs uppercase tracking-widest text-[#141414] flex items-center gap-1.5 font-sans">
            <Palette className="w-4 h-4" />
            Lead and Ink Colorways
          </h3>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-charcoal/70 uppercase mb-1">
                Cube Outline Ink
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={settings.cubeColor}
                  onChange={(e) => updateSettings({ cubeColor: e.target.value })}
                  className="w-8 h-8 rounded-none cursor-pointer border border-charcoal p-0 bg-transparent"
                />
                <span className="text-[10px] uppercase text-charcoal font-mono">
                  {settings.cubeColor}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#141414]/70 uppercase mb-1">
                Wax Guideline Lead
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={settings.orthogonalColor}
                  onChange={(e) => updateSettings({ orthogonalColor: e.target.value })}
                  className="w-8 h-8 rounded-none cursor-pointer border border-charcoal p-0 bg-transparent"
                />
                <span className="text-[10px] uppercase text-charcoal font-mono">
                  {settings.orthogonalColor}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer controls - Reset button */}
      <div className="p-4 bg-[#E4E3E0] border-t border-charcoal flex gap-2">
        <button
          onClick={onReset}
          className="flex-1 py-3 px-3 text-xs uppercase tracking-widest font-bold text-[#141414] bg-white border border-charcoal hover:bg-charcoal hover:text-white rounded-none flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Coordinates
        </button>
      </div>
    </div>
  );
}
