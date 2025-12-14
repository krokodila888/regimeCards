// check-imports.js
// Проверяет, где используются конкретные компоненты

const fs = require('fs');
const path = require('path');

const componentsToCheck = ['sidebar', 'tabs', 'sheet'];

function findComponentUsage(dir, componentName) {
  const usages = [];
  
  function scanDirectory(directory) {
    const files = fs.readdirSync(directory);
    
    files.forEach(file => {
      const filePath = path.join(directory, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !filePath.includes('node_modules')) {
        scanDirectory(filePath);
      } else if (stat.isFile() && (file.endsWith('.jsx') || file.endsWith('.tsx'))) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Ищем импорты
        const importRegex = new RegExp(`from\\s+['"].*?/ui/${componentName}['"]`, 'g');
        // Ищем использование компонентов (например, <Sidebar, <Tabs, etc)
        const usageRegex = new RegExp(`<${componentName.charAt(0).toUpperCase() + componentName.slice(1)}`, 'gi');
        
        if (importRegex.test(content) || usageRegex.test(content)) {
          const lines = content.split('\n');
          const relevantLines = [];
          
          lines.forEach((line, index) => {
            if (line.includes(componentName) || line.includes(componentName.charAt(0).toUpperCase() + componentName.slice(1))) {
              relevantLines.push(`  Строка ${index + 1}: ${line.trim()}`);
            }
          });
          
          usages.push({
            file: filePath,
            lines: relevantLines.slice(0, 5) // первые 5 совпадений
          });
        }
      }
    });
  }
  
  scanDirectory(dir);
  return usages;
}

console.log('🔍 Проверка использования sidebar, tabs, sheet...\n');

componentsToCheck.forEach(component => {
  console.log(`\n📦 Компонент: ${component}`);
  console.log('─'.repeat(50));
  
  const usages = findComponentUsage('./src', component);
  
  if (usages.length === 0) {
    console.log('❌ Не используется');
  } else {
    console.log(`✅ Используется в ${usages.length} файл(ах):\n`);
    usages.forEach(usage => {
      console.log(`📄 ${usage.file}`);
      usage.lines.forEach(line => console.log(line));
      console.log('');
    });
  }
});

console.log('\n🎯 РЕКОМЕНДАЦИИ:');
console.log('Если компоненты используются напрямую (без импорта через @/components/ui),');
console.log('они не будут обнаружены скриптом. Проверьте файлы вручную.');