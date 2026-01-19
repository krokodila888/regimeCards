import React from 'react';
import { LOCOMOTIVES } from '../data/consts';
import { Locomotive } from '../types/chart-data';
import { ObjectCategory, PaletteObject } from '../types/types';
import { staticObjectCategories } from '../data/visioObjectPaletteData';

export const generateTractionModeObjects = (locomotive: Locomotive): PaletteObject[] => {
  return locomotive.tractionModes.map((mode) => ({
    id: `traction-${locomotive.id}-${mode.id}`,
    name: `Traction Mode ${mode.label}`,
    nameRu: `${mode.label}`,
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20">
        <line
          x1="2"
          y1="10"
          x2="18"
          y2="10"
          stroke={mode.color}
          strokeWidth="3"
          strokeDasharray={
            mode.lineStyle === 'dashed' ? '4,3' : mode.lineStyle === 'dotted' ? '2,2' : 'none'
          }
        />
        <text x="10" y="7" fontSize="5" fill={mode.color} textAnchor="middle" fontWeight="bold">
          {mode.label}
        </text>
      </svg>
    ),
    canvasIcon: (
      <svg width="32" height="32" viewBox="0 0 32 32">
        <rect
          x="4"
          y="10"
          width="24"
          height="12"
          fill="white"
          stroke={mode.color}
          strokeWidth="2"
          rx="2"
        />
        <line
          x1="8"
          y1="16"
          x2="24"
          y2="16"
          stroke={mode.color}
          strokeWidth="3"
          strokeDasharray={
            mode.lineStyle === 'dashed' ? '4,3' : mode.lineStyle === 'dotted' ? '2,2' : 'none'
          }
        />
        <text x="16" y="19" fontSize="6" fill={mode.color} textAnchor="middle" fontWeight="bold">
          {mode.label}
        </text>
        <line x1="16" y1="22" x2="16" y2="32" stroke={mode.color} strokeWidth="2" />
      </svg>
    ),
    category: 'traction-modes',
    description: `Режим тяги: ${mode.label} (${locomotive.name})`,
  }));
};

export const getAllCategories = (): ObjectCategory[] => {
  return staticObjectCategories;
};

export function getPaletteObjectById(objectId: string): PaletteObject | null {
  for (const category of staticObjectCategories) {
    const object = category.objects.find((obj) => obj.id === objectId);
    if (object) return object;
  }

  for (const locomotive of LOCOMOTIVES) {
    const tractionObjects = generateTractionModeObjects(locomotive);
    const object = tractionObjects.find((obj) => obj.id === objectId);
    if (object) return object;
  }

  return null;
}

export const OBJECT_CATEGORIES = getAllCategories();
