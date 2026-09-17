const fs = require('fs');
const path = require('path');

const { dependencies } = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

// Define the dropins folder
const dropinsDir = path.join('scripts', '__dropins__');

// Remove existing dropins folder
if (fs.existsSync(dropinsDir)) {
  fs.rmSync(dropinsDir, { recursive: true });
}

// Create scripts/__dropins__ directory if not exists
fs.mkdirSync(dropinsDir, { recursive: true });

// Copy specified files from node_modules/@dropins to scripts/__dropins__
fs.readdirSync('node_modules/@dropins', { withFileTypes: true }).forEach((file) => {
  // Skip if package is not in package.json dependencies
  if (!dependencies[`@dropins/${file.name}`]) {
    return;
  }

  // Skip if is not folder
  if (!file.isDirectory()) {
    return;
  }
  fs.cpSync(path.join('node_modules', '@dropins', file.name), path.join(dropinsDir, file.name), {
    recursive: true,
    filter: (src) => (!src.endsWith('package.json')),
  });
});

function checkSourceMaps() {
  const hlxIgnorePath = '.hlxignore';
  if (!fs.existsSync(hlxIgnorePath) || !fs.readFileSync(hlxIgnorePath, 'utf-8').includes('*.map')) {
    // eslint-disable-next-line no-console
    console.info('⚠️ Sourcemaps may be added to the repo. WARNING: Please remove the *.map files or add "*.map" to .hlxignore before going live!\n');
  }
}

checkSourceMaps();

// eslint-disable-next-line no-console
console.info('✅ Drop-ins installed successfully!', '\n');
