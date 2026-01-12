// delete-unused.js
// Запуск: node delete-unused.js

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🗑️  УДАЛЕНИЕ НЕИСПОЛЬЗУЕМЫХ КОМПОНЕНТОВ\n');

  // Читаем список файлов
  if (!fs.existsSync('./files-to-delete.txt')) {
    console.log('❌ Файл files-to-delete.txt не найден!');
    console.log('   Сначала запустите: node cleanup-project.js');
    rl.close();
    return;
  }

  const files = fs
    .readFileSync('./files-to-delete.txt', 'utf8')
    .split('\n')
    .filter((f) => f.trim());

  console.log(`Найдено ${files.length} файлов для удаления:\n`);
  files.forEach((f) => console.log(`   - ${f}`));

  const answer = await question('\n⚠️  Удалить эти файлы? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Отменено');
    rl.close();
    return;
  }

  let deleted = 0;
  let notFound = 0;

  files.forEach((file) => {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`✅ Удален: ${file}`);
      deleted++;
    } else {
      console.log(`⚠️  Не найден: ${file}`);
      notFound++;
    }
  });

  console.log(`\n✨ Готово!`);
  console.log(`   Удалено: ${deleted}`);
  console.log(`   Не найдено: ${notFound}`);

  rl.close();
}

main();
