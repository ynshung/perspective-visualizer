/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type PerspectiveMode = 'one-point' | 'two-point' | 'three-point';

export interface Point2D {
  x: number;
  y: number;
}

export interface RenderSettings {
  showGrid: boolean;
  showConstructionLines: boolean;
  showHorizonLine: boolean;
  showCoordinates: boolean;
  fillOpacity: number; // 0 to 1
  lineOpacity: number; // 0 to 1
  orthogonalColor: string;
  cubeColor: string;
  showVanishingPoints: boolean;
  autoSnap: boolean;
}

export interface Preset {
  id: string;
  name: string;
  description: string;
  mode: PerspectiveMode;
  settings: Partial<RenderSettings>;
  // Custom initializations can be set via preset ID
}

export interface WorkspaceState {
  mode: PerspectiveMode;
  settings: RenderSettings;
  // Draggable node positions (normalized, -1 to 1, or absolute canvas-based coordinates)
  // We'll use absolute state that initializes per mode or is responsive.
}
