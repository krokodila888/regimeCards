import React from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Separator } from "./ui/separator";
import CanvasObjectIcon from "./CanvasObjectIcon";

interface ObjectPaletteProps {
  isOpen: boolean;
  onSelect: (objectType: string, label: string) => void;
  onClose: () => void;
}

export default function ObjectPalette({
  isOpen,
  onSelect,
  onClose,
}: ObjectPaletteProps) {
  if (!isOpen) return null;

  const objectCategories = [
    {
      title: "Сигналы",
      objects: [
        {
          id: "signal",
          label: "Входной сигнал",
          subtype: "Input",
        },
        {
          id: "signal",
          label: "Выходной сигнал",
          subtype: "Output",
        },
        {
          id: "signal",
          label: "Предупредительный сигнал",
          subtype: "Warning",
        },
      ],
    },
    {
      title: "Элементы пути",
      objects: [
        { id: "switch", label: "Переключатель" },
        {
          id: "crossing",
          label: "Переезд (регулируемый)",
          subtype: "Guarded",
        },
        {
          id: "crossing",
          label: "Переезд (нерегулируемый)",
          subtype: "Unguarded",
        },
      ],
    },
    {
      title: "Инфраструктура",
      objects: [
        { id: "tunnel", label: "Туннель" },
        { id: "bridge", label: "Мост" },
      ],
    },
  ];

  return (
    <Card className="fixed top-24 right-6 w-[420px] shadow-lg z-50 max-h-[80vh] overflow-auto bg-white">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Object Palette</CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {objectCategories.map((category, catIdx) => (
          <div key={catIdx}>
            <h3 className="text-sm mb-3 text-gray-700">
              {category.title}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {category.objects.map((obj, idx) => (
                <Button
                  key={`${obj.id}-${idx}`}
                  variant="outline"
                  className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400"
                  onClick={() => {
                    onSelect(
                      obj.subtype
                        ? `${obj.id}:${obj.subtype}`
                        : obj.id,
                      obj.label,
                    );
                    onClose();
                  }}
                >
                  <div className="flex items-center justify-center">
                    <CanvasObjectIcon
                      type={obj.id}
                      subtype={obj.subtype}
                      size={32}
                    />
                  </div>
                  <span className="text-xs text-center leading-tight whitespace-pre-line px-1">
                    {obj.label.split(' ').length >= 2 
                      ? obj.label.split(' ').reduce((acc, word, i, arr) => {
                          const mid = Math.ceil(arr.length / 2);
                          if (i === mid) return acc + '\n' + word;
                          return acc + (i === 0 ? '' : ' ') + word;
                        }, '')
                      : obj.label}
                  </span>
                </Button>
              ))}
            </div>
            {catIdx < objectCategories.length - 1 && (
              <Separator className="mt-4" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}