import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Upload } from 'lucide-react';

interface ImportVisioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImportVisioModal({ isOpen, onClose }: ImportVisioModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Импорт из Visio</DialogTitle>
          <DialogDescription>
            Эта функциональность еще в работе
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">Выберите .vsdx файл или перетащите его сюда</p>
          <Button variant="outline" className="mt-4">
            Загрузите файл
          </Button>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Продолжить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
