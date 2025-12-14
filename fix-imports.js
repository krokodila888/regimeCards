// fix-imports.js
// Исправляет проблемы с импортами после экспорта из Figma

const fs = require('fs');
const path = require('path');

// Проблемные импорты, которые нужно исправить
const fixes = {
  // Figma может создать неправильные пути
  'from "components/': 'from "@/components/',
  'from "../components/': 'from "@/components/',
  'from "./components/': 'from "@/components/',
  
  // Исправление относительных путей для utils
  'from "utils/': 'from "@/utils/',
  'from "../utils/': 'from "@/utils/',
  
  // Исправление путей к lib
  'from "lib/': 'from "@/lib/',
  'from "../lib/': 'from "@/lib/',
};

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    Object.entries(fixes).forEach(([wrong, correct]) => {
      if (content.includes(wrong)) {
        content = content.split(wrong).join(correct);
        modified = true;
      }
    });
    
    // Исправляем двойные слеши
    if (content.includes('from "@//')) {
      content = content.replace(/from "@\/\//g, 'from "@/');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Ошибка в файле ${filePath}:`, error.message);
    return false;
  }
}

function scanDirectory(dir) {
  let fixedCount = 0;
  
  function scan(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        scan(filePath);
      } else if (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.ts')) {
        if (fixImportsInFile(filePath)) {
          console.log(`✅ Исправлен: ${filePath}`);
          fixedCount++;
        }
      }
    });
  }
  
  scan(dir);
  return fixedCount;
}

console.log('🔧 Исправление импортов...\n');

const fixed = scanDirectory('./src');

console.log(`\n✨ Готово! Исправлено файлов: ${fixed}`);

if (fixed === 0) {
  console.log('   Проблем с импортами не найдено.');
} else {
  console.log('   Теперь попробуйте запустить: npm run dev');
}