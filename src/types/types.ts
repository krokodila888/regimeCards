export type TrackBounds = {
  startKm: number;
  endKm: number;
  imageWidth: number;
};

// Типы
export type PaletteObject = {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  category: string;
  description?: string;
};

export type PlacedObject = {
  id: string;
  /** Тип объекта из палитры */
  objectType: PaletteObject;
  /** Километровая отметка (от 1781 до 1952 км) */
  coordinate: number;
  /** Позиция на холсте в пикселях (относительно изображения) */
  position: {
    x: number; // Горизонтальная позиция
    y: number; // Вертикальная позиция (центр секции скорости)
  };
};

export type ObjectCategory = {
  id: string;
  name: string;
  nameRu: string;
  icon: React.ReactNode;
  objects: PaletteObject[];
};