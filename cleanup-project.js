// cleanup-project.js
// Запуск: node cleanup-project.js

const fs = require('fs');
const path = require('path');

const uiComponentsDir = './src/components/ui';

function findImports(dir, excludeDir = 'ui') {
  const imports = new Set();
  
  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes(excludeDir)) {
        scanDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.ts'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Ищем импорты из @/components/ui или ../ui или ./ui
        const importRegex = /from\s+['"][@\.].*?\/ui\/([^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          imports.add(match[1]);
        }
      }
    });
  }
  
  scanDirectory(dir);
  return imports;
}

function getUIComponents() {
  if (!fs.existsSync(uiComponentsDir)) {
    console.log('❌ Папка ui не найдена');
    return [];
  }
  
  return fs.readdirSync(uiComponentsDir)
    .filter(file => (file.endsWith('.tsx') || file.endsWith('.jsx')) && file !== 'utils.ts')
    .map(file => file.replace(/\.(tsx|jsx)$/, ''));
}

function analyzeComponentDependencies() {
  const components = getUIComponents();
  const dependencies = {};
  
  components.forEach(component => {
    const filePath = path.join(uiComponentsDir, `${component}.tsx`);
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const deps = new Set();
    
    // Ищем импорты из npm пакетов
    const importRegex = /from\s+['"]([^'"@\.].*?)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const pkg = match[1].split('/')[0];
      if (pkg.startsWith('@')) {
        deps.add(match[1].split('/').slice(0, 2).join('/'));
      } else {
        deps.add(pkg);
      }
    }
    
    dependencies[component] = Array.from(deps);
  });
  
  return dependencies;
}

function main() {
  console.log('🔍 Анализ проекта "Режимные карты локомотивов"...\n');
  
  const usedComponents = findImports('./src');
  const allComponents = getUIComponents();
  const unusedComponents = allComponents.filter(c => !usedComponents.has(c));
  
  console.log('📊 РЕЗУЛЬТАТЫ АНАЛИЗА:\n');
  console.log(`✅ Используемые UI компоненты (${usedComponents.size}):`);
  Array.from(usedComponents).sort().forEach(c => console.log(`   - ${c}`));
  
  console.log(`\n❌ Неиспользуемые UI компоненты (${unusedComponents.length}):`);
  unusedComponents.sort().forEach(c => console.log(`   - ${c}`));
  
  const componentDeps = analyzeComponentDependencies();
  const usedDependencies = new Set();
  
  usedComponents.forEach(component => {
    if (componentDeps[component]) {
      componentDeps[component].forEach(dep => usedDependencies.add(dep));
    }
  });
  
  // Всегда нужные зависимости
  ['react', 'react-dom', 'clsx', 'tailwind-merge', 'lucide-react'].forEach(d => usedDependencies.add(d));
  
  console.log(`\n📦 НЕОБХОДИМЫЕ ЗАВИСИМОСТИ (${usedDependencies.size}):`);
  Array.from(usedDependencies).sort().forEach(dep => console.log(`   - ${dep}`));
  
  // Читаем package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  const cleanDependencies = {};
  
  Object.keys(packageJson.dependencies || {}).forEach(dep => {
    if (usedDependencies.has(dep)) {
      cleanDependencies[dep] = packageJson.dependencies[dep];
    }
  });
  
  const cleanPackageJson = {
    ...packageJson,
    dependencies: cleanDependencies
  };
  
  fs.writeFileSync('./package.clean.json', JSON.stringify(cleanPackageJson, null, 2));
  
  const filesToDelete = unusedComponents.map(c => `src/components/ui/${c}.tsx`);
  fs.writeFileSync('./files-to-delete.txt', filesToDelete.join('\n'));
  
  console.log('\n✨ ГОТОВО!');
  console.log('\n📝 Созданы файлы:');
  console.log('   - package.clean.json (очищенный package.json)');
  console.log('   - files-to-delete.txt (список из ' + unusedComponents.length + ' файлов для удаления)');
  
  // Подсчет экономии
  const currentDeps = Object.keys(packageJson.dependencies || {}).length;
  const newDeps = Object.keys(cleanDependencies).length;
  const saved = currentDeps - newDeps;
  
  console.log('\n💰 ЭКОНОМИЯ:');
  console.log(`   Было зависимостей: ${currentDeps}`);
  console.log(`   Будет зависимостей: ${newDeps}`);
  console.log(`   Удалено: ${saved} (${Math.round(saved/currentDeps*100)}%)`);
  
  console.log('\n⚠️  СЛЕДУЮЩИЕ ШАГИ:');
  console.log('   1. Проверьте package.clean.json');
  console.log('   2. Скопируйте: copy package.clean.json package.json');
  console.log('   3. Удалите UI компоненты: node delete-unused.js');
  console.log('   4. Переустановите: npm install');
}

main();