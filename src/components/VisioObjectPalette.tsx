import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Trash2,
  MapPin,
  Activity,
  AlertTriangle,
  Power,
  Route,
  Zap,
  Gauge,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { LOCOMOTIVES } from '../data/consts';
import { ObjectCategory, PaletteObject, PlacedObject } from '../types/types';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { staticObjectCategories } from '@/data/visioObjectPaletteData';
import { generateTractionModeObjects } from '@/utils/visioObjectPaletteUtils';

const getAllCategories = (): ObjectCategory[] => {
  return staticObjectCategories;
};

const OBJECT_CATEGORIES = getAllCategories();

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

interface VisioObjectPaletteProps {
  selectedObjectId?: string | null;
  placedObjects?: PlacedObject[];
  onDeleteObject?: (id: string) => void;
  onSelectObject?: (id: string | null) => void;
  onUpdateObject?: (id: string, updates: Partial<PlacedObject>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function VisioObjectPalette({
  selectedObjectId = null,
  placedObjects = [],
  onDeleteObject,
  onSelectObject,
  onUpdateObject,
  collapsed = false,
  onToggleCollapse,
}: VisioObjectPaletteProps) {
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([
      'speed-curve',
      'control-modes',
      'track-objects',
      'electrical',
      'structures',
      'power-supply',
      'signals',
    ])
  );

  const [editCoordinate, setEditCoordinate] = useState('');
  const [editStationName, setEditStationName] = useState('');

  const displayedObject = selectedObjectId
    ? placedObjects.find((obj) => obj.id === selectedObjectId)
    : placedObjects.length > 0
      ? placedObjects[placedObjects.length - 1]
      : null;

  const displayedObjectWithIcon = displayedObject
    ? {
        ...displayedObject,
        objectType:
          getPaletteObjectById(displayedObject.objectType.id) || displayedObject.objectType,
      }
    : null;

  useEffect(() => {
    if (displayedObjectWithIcon) {
      setEditCoordinate(displayedObjectWithIcon.coordinate.toFixed(1));
      setEditStationName(displayedObjectWithIcon.stationName || '');
    }
  }, [
    displayedObjectWithIcon?.id,
    displayedObjectWithIcon?.coordinate,
    displayedObjectWithIcon?.stationName,
  ]);

  const handleResizeStart = (e: React.MouseEvent) => {
    if (collapsed) return;
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(280, Math.min(500, window.innerWidth - e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => setIsResizing(false);

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(categoryId) ? next.delete(categoryId) : next.add(categoryId);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, object: PaletteObject) => {
    e.dataTransfer.setData('application/x-palette-object-id', object.id);
    e.dataTransfer.setData(
      'application/x-palette-object-data',
      JSON.stringify({
        id: object.id,
        name: object.name,
        nameRu: object.nameRu,
        category: object.category,
        description: object.description,
      })
    );
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditCoordinate(e.target.value);
  };

  const handleCoordinateBlur = () => {
    if (!displayedObjectWithIcon || !onUpdateObject) return;

    const newCoord = parseFloat(editCoordinate);
    if (!isNaN(newCoord) && newCoord >= 1610 && newCoord <= 1782) {
      if (Math.abs(newCoord - displayedObjectWithIcon.coordinate) > 0.01) {
        onUpdateObject(displayedObjectWithIcon.id, { coordinate: newCoord });
      }
    } else {
      setEditCoordinate(displayedObjectWithIcon.coordinate.toFixed(1));
    }
  };

  const handleStationNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditStationName(e.target.value);
  };

  const handleStationNameBlur = () => {
    if (!displayedObjectWithIcon || !onUpdateObject) return;
    onUpdateObject(displayedObjectWithIcon.id, { stationName: editStationName });
  };

  if (collapsed) {
    return (
      <div
        className="w-24 h-full bg-gray-800 text-white flex flex-col items-center py-4"
        style={{ marginRight: 10 }}
      >
        <button
          onClick={onToggleCollapse}
          className="p-2 mb-4 hover:bg-gray-700 rounded"
          style={{ marginRight: 42 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 14,
            marginRight: 42,
          }}
        >
          Палитра объектов
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex"
      style={{ width: `${sidebarWidth}px`, minWidth: 280, marginRight: 56 }}
    >
      <div
        className="w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize"
        onMouseDown={handleResizeStart}
        style={{ boxShadow: '-3px 0 5px rgb(0 0 0 / 84%)' }}
      />

      <div className="flex-1 bg-white border-l border-gray-300 flex flex-col shadow-lg">
        <div className="p-4 border-b bg-gray-50 flex items-center gap-2">
          <button onClick={onToggleCollapse} className="p-2 hover:bg-gray-200 rounded">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <h3 className="flex-1 font-medium text-gray-700">Палитра объектов</h3>
        </div>

        <div className="p-3 border-b bg-gray-50">
          <p className="text-xs text-gray-500">Перетащите объекты на холст</p>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-auto p-2 space-y-1">
          {OBJECT_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.id);

            if (category.id === 'control-modes') {
              return (
                <div key={category.id} className="rounded-lg border border-gray-200">
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <div className="text-gray-600">{category.icon}</div>
                    <span className="flex-1 text-sm font-medium text-left">{category.nameRu}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white">
                      {category.objects.length + LOCOMOTIVES[0].tractionModes.length}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="bg-white p-1.5 space-y-2">
                      {/* Основные режимы управления */}
                      <div className="grid grid-cols-2 gap-1">
                        {category.objects.map((object) => (
                          <div
                            key={object.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, object)}
                            className="flex flex-col items-center gap-1 p-2 rounded border hover:border-blue-400 hover:bg-blue-50 cursor-move"
                            title={object.description}
                          >
                            <div className="w-8 h-8 flex items-center justify-center">
                              {object.icon}
                            </div>
                            <span className="text-xs text-center leading-tight">
                              {object.nameRu}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Локомотивы */}
                      {Array(LOCOMOTIVES[0]).map((locomotive) => {
                        const tractionObjects = generateTractionModeObjects(locomotive);
                        return (
                          <div key={locomotive.id} className="border-t pt-2">
                            <div className="flex items-center gap-2 mb-2 px-2">
                              <Gauge className="w-4 h-4 text-blue-700" />
                              <span className="text-sm font-semibold text-blue-900">
                                {locomotive.name}
                              </span>
                              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100">
                                {tractionObjects.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {tractionObjects.map((mode) => (
                                <div
                                  key={mode.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, mode)}
                                  className="flex flex-col items-center gap-1 p-2 rounded border border-blue-200 hover:border-blue-400 hover:bg-blue-50 cursor-move"
                                  title={mode.description}
                                >
                                  <div className="w-8 h-8 flex items-center justify-center">
                                    {mode.icon}
                                  </div>
                                  <span className="text-xs text-center leading-tight">
                                    {mode.nameRu}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div key={category.id} className="rounded-lg border border-gray-200">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center gap-2 p-2.5 bg-gray-50 hover:bg-gray-100"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <div className="text-gray-600">{category.icon}</div>
                  <span className="flex-1 text-sm font-medium text-left">{category.nameRu}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-white">
                    {category.objects.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="bg-white p-1.5 grid grid-cols-2 gap-1">
                    {category.objects.map((object) => (
                      <div
                        key={object.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, object)}
                        className="flex flex-col items-center gap-1 p-2 rounded border hover:border-blue-400 hover:bg-blue-50 cursor-move"
                        title={object.description}
                      >
                        <div className="w-8 h-8 flex items-center justify-center">
                          {object.icon}
                        </div>
                        <span className="text-xs text-center leading-tight">{object.nameRu}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Separator */}
        {displayedObjectWithIcon && (
          <div className="h-0.5 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-400" />
        )}

        {/* Info panel */}
        {displayedObjectWithIcon && (
          <div
            className="border-t-2 border-blue-500 bg-blue-50 p-4 space-y-4"
            style={{ borderTop: '1px solid var(--color-gray-300)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white rounded border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                {displayedObjectWithIcon.objectType.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4
                    className="text-sm text-gray-700"
                    style={{ fontStyle: 'normal', fontWeight: '300' }}
                  >
                    {selectedObjectId ? 'Выбранный объект:' : 'Последний объект'}
                  </h4>
                </div>
                <p className="text-sm font-medium text-gray-700 break-words">
                  {displayedObjectWithIcon.objectType.nameRu}
                </p>
              </div>
            </div>

            <div
              className="space-y-2 flex-1"
              style={{
                position: 'relative',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
              }}
            >
              {displayedObjectWithIcon.objectType.id === 'station' && (
                <div
                  className="space-y-2 flex"
                  style={{
                    position: 'relative',
                    gap: 12,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <Input
                    type="text"
                    value={editStationName}
                    onChange={handleStationNameChange}
                    onBlur={handleStationNameBlur}
                    placeholder="Введите название станции"
                    className="h-9 text-sm text-gray-700"
                    style={{ width: 160 }}
                  />
                  <Label
                    className="text-sm text-gray-500"
                    style={{ paddingTop: 8, fontStyle: 'normal', fontWeight: 'normal' }}
                  >
                    Название
                  </Label>
                </div>
              )}

              <div
                className="flex items-center gap-2"
                style={{
                  position: 'relative',
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                }}
              >
                <MapPin
                  className="w-5 h-5 text-gray-500 flex flex-shrink-0"
                  style={{ position: 'absolute', top: 8, left: 8 }}
                />
                <div className="flex-1" style={{ width: 'fit-content' }}>
                  <Input
                    type="number"
                    step="0.1"
                    min="1610"
                    max="1782"
                    value={editCoordinate}
                    onChange={handleCoordinateChange}
                    onBlur={handleCoordinateBlur}
                    className="h-9 text-sm pl-8 text-gray-700"
                    style={{ width: 160 }}
                  />
                  <p className="text-xs text-gray-500 mt-1" style={{ width: 'fit-content' }}>
                    Диапазон: 1610-1782 км
                  </p>
                </div>
                <Label
                  className="text-sm text-gray-500"
                  style={{ paddingTop: 8, fontStyle: 'normal', fontWeight: 'normal' }}
                >
                  Координата (км)
                </Label>
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={() => onDeleteObject?.(displayedObjectWithIcon.id)}
              className="w-full h-9"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить объект
            </Button>
          </div>
        )}

        {!displayedObjectWithIcon && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-600 text-center italic">
              Разместите объект на холсте, чтобы увидеть его свойства
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
