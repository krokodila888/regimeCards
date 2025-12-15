// src/components/modals/LayerSettingsModal.tsx
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import { Label } from '../components//ui/label';
import { Switch } from '../components//ui/switch';
import { Separator } from '../components//ui/separator';

interface LayerSettings {
  speedCurve: boolean;
  optimalCurve: boolean;
  profileCurve: boolean;
  regimeBars: boolean;
  gradientMarks: boolean;
}

interface LayerSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layers: LayerSettings;
  onLayersChange: (layers: LayerSettings) => void;
}

export default function LayerSettingsModal({
  open,
  onOpenChange,
  layers,
  onLayersChange,
}: LayerSettingsModalProps) {
  const handleToggle = (key: keyof LayerSettings) => {
    onLayersChange({
      ...layers,
      [key]: !layers[key],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Настройки отображения</DialogTitle>
          <DialogDescription>
            Выберите, какие элементы режимной карты отображать
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Кривые скорости */}
          <div>
            <h4 className="text-sm font-medium mb-3 text-gray-700">
              Кривые скорости
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="speed-curve" 
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Кривая скорости (зелёная)</span>
                </Label>
                <Switch
                  id="speed-curve"
                  checked={layers.speedCurve}
                  onCheckedChange={() => handleToggle('speedCurve')}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="optimal-curve" 
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Оптимальная кривая (красная)</span>
                </Label>
                <Switch
                  id="optimal-curve"
                  checked={layers.optimalCurve}
                  onCheckedChange={() => handleToggle('optimalCurve')}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Профиль пути */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="profile-curve" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Профиль пути (синий)</span>
            </Label>
            <Switch
              id="profile-curve"
              checked={layers.profileCurve}
              onCheckedChange={() => handleToggle('profileCurve')}
            />
          </div>

          <Separator />

          {/* Режимы тяги */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="regime-bars" 
              className="cursor-pointer"
            >
              Полосы режимов тяги
            </Label>
            <Switch
              id="regime-bars"
              checked={layers.regimeBars}
              onCheckedChange={() => handleToggle('regimeBars')}
            />
          </div>

          <Separator />

          {/* Уклоны */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="gradient-marks" 
              className="cursor-pointer"
            >
              Обозначения уклонов
            </Label>
            <Switch
              id="gradient-marks"
              checked={layers.gradientMarks}
              onCheckedChange={() => handleToggle('gradientMarks')}
            />
          </div>
        </div>

        {/* Статистика */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          Отображается {Object.values(layers).filter(Boolean).length} из {Object.keys(layers).length} элементов
        </div>
      </DialogContent>
    </Dialog>
  );
}