import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Trash2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  type?: 'number' | 'text';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onDataChange: (data: any[]) => void;
  errorIds?: Set<string>;
  lockedCells?: (rowIndex: number, columnKey: string) => boolean;
}

export default function DataTable({ columns, data, onDataChange, errorIds, lockedCells }: DataTableProps) {
  const handleCellChange = (rowIndex: number, columnKey: string, value: string) => {
    const newData = [...data];
    const column = columns.find(c => c.key === columnKey);
    newData[rowIndex] = {
      ...newData[rowIndex],
      [columnKey]: column?.type === 'number' ? parseFloat(value) || 0 : value,
    };
    onDataChange(newData);
  };

  const handleAddRow = () => {
    const newRow: any = { id: Date.now().toString() };
    columns.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : '';
    });
    onDataChange([...data, newRow]);
  };

  const handleDeleteRow = (rowIndex: number) => {
    const newData = data.filter((_, index) => index !== rowIndex);
    onDataChange(newData);
  };

  return (
    <div className="space-y-2">
      <div className="border rounded-md bg-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-600 hover:bg-gray-600">
              {columns.map(col => (
                <TableHead key={col.key} className="text-gray-300">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow className="border-gray-600">
                <TableCell colSpan={columns.length + 1} className="text-center text-gray-400">
                  Нет данных. Нажмите "Добавить строку"
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => {
                const hasError = errorIds?.has(row.id);
                return (
                  <TableRow key={row.id} className="border-gray-600 hover:bg-gray-600">
                    {columns.map(col => {
                      const isLocked = lockedCells ? lockedCells(rowIndex, col.key) : false;
                      return (
                        <TableCell key={col.key} className="p-1">
                          <Input
                            type={col.type || 'text'}
                            value={row[col.key] || ''}
                            onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                            disabled={isLocked}
                            className={`h-8 px-2 ${
                              isLocked 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed border-gray-600' 
                                : 'bg-gray-800 text-white border-gray-600'
                            } ${hasError ? 'border border-red-500' : ''}`}
                          />
                        </TableCell>
                      );
                    })}
                    <TableCell className="p-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRow(rowIndex)}
                        className="h-8 w-8 p-0 hover:bg-gray-500"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <Button
        size="sm"
        onClick={handleAddRow}
        variant="outline"
        className="w-full bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
      >
        <Plus className="w-4 h-4 mr-2" />
        Добавить строку
      </Button>
    </div>
  );
}
