/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, HelpCircle, Eye, Network, Layers, Sparkles } from 'lucide-react';
import { PerspectiveMode } from '../types';

interface EducationalPanelProps {
  mode: PerspectiveMode;
  hoveredTerm: string | null;
  setHoveredTerm: (term: string | null) => void;
}

export default function EducationalPanel({
  mode,
  hoveredTerm,
  setHoveredTerm,
}: EducationalPanelProps) {
  return (
    <div className="bg-[#f2f1ef]/85 backdrop-blur-md border border-charcoal overflow-hidden h-full flex flex-col shadow-none">
      {/* Header */}
      <div className="bg-charcoal border-b border-charcoal p-4 flex items-center gap-2 text-white">
        <BookOpen className="w-5 h-5" />
        <h2 className="font-bold uppercase tracking-widest text-[11px]">Perspective Drawing Guide</h2>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 overflow-y-auto space-y-6 text-sm text-charcoal">
        
        {/* Interactive Vocabulary Glossary */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 mb-2.5">
            <HelpCircle className="w-4 h-4 text-charcoal" />
            Interactive Terminology
          </h3>
          <p className="text-[11px] opacity-75 mb-3 leading-relaxed">
            Hover over a term below to highlight its corresponding geometric lines or points on the drafting canvas!
          </p>

          <div className="grid grid-cols-1 gap-2">
            {/* Horizon Line */}
            <div
              onMouseEnter={() => setHoveredTerm('horizon')}
              onMouseLeave={() => setHoveredTerm(null)}
              className={`p-3 border transition-all duration-150 cursor-help ${
                hoveredTerm === 'horizon'
                  ? 'border-charcoal bg-white font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] scale-[1.01]'
                  : 'border-charcoal/20 bg-[#E4E3E0]/30 hover:border-charcoal'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-charcoal" />
                <span className="font-bold uppercase tracking-wider text-[11px]">Horizon Line (Eye Level)</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed font-mono">
                Represents the exact level of the viewer's eyes. It acts as the vertical boundary separating looking up from looking down.
              </p>
            </div>

            {/* Vanishing Point */}
            <div
              onMouseEnter={() => setHoveredTerm('vp')}
              onMouseLeave={() => setHoveredTerm(null)}
              className={`p-3 border transition-all duration-150 cursor-help ${
                hoveredTerm === 'vp'
                  ? 'border-charcoal bg-white font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] scale-[1.01]'
                  : 'border-charcoal/20 bg-[#E4E3E0]/30 hover:border-charcoal'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Network className="w-3.5 h-3.5 text-charcoal" />
                <span className="font-bold uppercase tracking-wider text-[11px]">Vanishing Points</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed font-mono">
                Points on the horizon line where parallel lines in 3D space appear to meet and disappear. Drag them to skew the perspective projection.
              </p>
            </div>

            {/* Orthogonals */}
            <div
              onMouseEnter={() => setHoveredTerm('orthogonals')}
              onMouseLeave={() => setHoveredTerm(null)}
              className={`p-3 border transition-all duration-150 cursor-help ${
                hoveredTerm === 'orthogonals'
                  ? 'border-charcoal bg-white font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] scale-[1.01]'
                  : 'border-charcoal/20 bg-[#E4E3E0]/30 hover:border-charcoal'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Layers className="w-3.5 h-3.5 text-charcoal" />
                <span className="font-bold uppercase tracking-wider text-[11px]">Orthogonal (Receding) Lines</span>
              </div>
              <p className="text-xs opacity-80 leading-relaxed font-mono">
                Convergence lines connecting the corners of our cube to the Vanishing Points, forming the perspective skeletal scaffolding.
              </p>
            </div>

            {/* Transversals */}
            {(mode === 'one-point' || mode === 'two-point') && (
              <div
                onMouseEnter={() => setHoveredTerm('transversals')}
                onMouseLeave={() => setHoveredTerm(null)}
                className={`p-3 border transition-all duration-150 cursor-help ${
                  hoveredTerm === 'transversals'
                    ? 'border-charcoal bg-white font-bold shadow-[2px_2px_0px_0px_rgba(20,20,20,1)] scale-[1.01]'
                    : 'border-charcoal/20 bg-[#E4E3E0]/30 hover:border-charcoal'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="w-1.5 h-3 bg-charcoal inline-block"></div>
                  <span className="font-bold uppercase tracking-wider text-[11px]">Transversals</span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed font-mono">
                  Lines drawn parallel (horizontal or vertical) to the picture frame. They do not converge and maintain standard constant proportions.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mode Specific Educational Insight */}
        <div className="border-t border-charcoal/30 pt-5 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-widest flex items-center gap-1.5 text-charcoal">
            <Sparkles className="w-4 h-4 text-charcoal" />
            Active Projection: {mode === 'one-point' ? '1-Point' : mode === 'two-point' ? '2-Point' : '3-Point'}
          </h3>

          {mode === 'one-point' && (
            <div className="space-y-2.5 text-xs opacity-85 leading-relaxed font-mono">
              <p>
                <strong>One-Point Perspective</strong> is used when looking directly at flat, frontal faces of objects. Excellent for straight-on street views, long hallways, or railway tracks.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>One primary Vanishing Point on the horizon line.</li>
                <li>The front face of the cube occupies the picture plane (parallel to viewer, and contains strictly horizontal and vertical lines).</li>
                <li>Receding edges point directly at the single Vanishing Point.</li>
                <li>Drag the front face centers or adjust the depth handle to resize and stretch the cube.</li>
              </ul>
            </div>
          )}

          {mode === 'two-point' && (
            <div className="space-y-2.5 text-xs opacity-85 leading-relaxed font-mono">
              <p>
                <strong>Two-Point Perspective</strong> is used when objects are viewed at an angle. Perfect for looking at the corner of a building from street level.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Two Vanishing Points representing Left and Right horizons.</li>
                <li>All vertical edges of the cube remain strictly parallel and vertical.</li>
                <li>Left-facing edges converge to the Left VP, while right-facing edges converge to the Right VP.</li>
                <li>The rear-most edge is mathematically found at the intersection of the reciprocal lines going to both VPs.</li>
              </ul>
            </div>
          )}

          {mode === 'three-point' && (
            <div className="space-y-2.5 text-xs opacity-85 leading-relaxed font-mono">
              <p>
                <strong>Three-Point Perspective</strong> creates extreme scale looking directly up (Zenith view) or directly down (Nadir / Bird's Eye view). Perfect for soaring skyscrapers or canyons.
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Three Vanishing Points: Left, Right, plus a Vertical VP representing vertical scale.</li>
                <li>No lines are parallel to the viewport anymore. Every line of the cube points to one of the three vanishing points.</li>
                <li>The center corner is closest to the viewer. Drag it to change position, and drag the individual width, height, and depth guides along the rays to alter dimensions.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Fun Challenge / Play Prompt */}
        <div className="bg-[#E4E3E0] rounded-none p-4 border border-charcoal/50 flex flex-col gap-1.5 relative">
          <span className="font-bold text-charcoal text-xs uppercase tracking-wider">💡 System Sandbox Tasks</span>
          <ol className="list-decimal pl-4 space-y-1 text-xs opacity-85 font-mono">
            <li>In 1-Point, drag the front face directly on top of the Vanishing Point. The receding sides will completely hide behind it!</li>
            <li>In 2-Point, drag the vertical edge above vs. below the horizon. See how the top and bottom lids flip visibility.</li>
            <li>In 3-Point, drag the third vanishing point far away vs. close to the center to see depth distortion.</li>
          </ol>
        </div>

      </div>
    </div>
  );
}
