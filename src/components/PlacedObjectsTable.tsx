import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';
import type { CanvasObject } from '../types/chart-data';

interface PlacedObjectsTableProps {
  objects: CanvasObject[];
  onUpdateObject: (id: string, updates: Partial<CanvasObject>) => void;
  onDeleteObject: (id: string) => void;
}

export default function PlacedObjectsTable({ 
  objects, 
  onUpdateObject,
  onDeleteObject,
}: PlacedObjectsTableProps) {
  // Helper to convert x position to km coordinate (based on canvas layout)
  const xToKm = (x: number) => {
    const baseWidth = 2400;
    // Objects placed between x=100 and x=2300 map to 0-200km
    const kmValue = ((x - 100) / (baseWidth - 200)) * 200;
    return Math.max(0, Math.min(200, kmValue));
  };

  // Helper to convert km back to x position
  const kmToX = (km: number) => {
    const baseWidth = 2400;
    return 100 + (km / 200) * (baseWidth - 200);
  };

  const formatObjectType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700">
            <TableHead className="text-gray-300">Тип</TableHead>
            <TableHead className="text-gray-300">Метка</TableHead>
            <TableHead className="text-gray-300">Координата (км)</TableHead>
            <TableHead className="text-gray-300 w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {objects.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-gray-400 text-xs py-4">
                Размещенных объектов нет
              </TableCell>
            </TableRow>
          ) : (
            objects.map((obj) => (
              <TableRow key={obj.id} className="border-gray-700">
                <TableCell className="text-gray-200 text-xs">
                  {obj.label || formatObjectType(obj.type)}
                </TableCell>
                <TableCell className="text-xs">
                  <Input
                    value={obj.subtype || ''}
                    onChange={(e) => onUpdateObject(obj.id, { subtype: e.target.value })}
                    className="h-7 text-xs bg-gray-700 border-gray-600 text-gray-200"
                    placeholder="-"
                  />
                </TableCell>
                <TableCell className="text-xs">
                  <Input
                    type="number"
                    step="0.1"
                    value={xToKm(obj.x).toFixed(1)}
                    onChange={(e) => {
                      const km = parseFloat(e.target.value);
                      if (!isNaN(km)) {
                        onUpdateObject(obj.id, { x: kmToX(km) });
                      }
                    }}
                    className="h-7 text-xs bg-gray-700 border-gray-600 text-gray-200 w-20"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteObject(obj.id)}
                    className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-gray-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
