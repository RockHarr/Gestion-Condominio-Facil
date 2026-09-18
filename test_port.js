const { execSync } = require('child_process');
try {
  const result = execSync('npx vite --port 3000 --strictPort --host 0.0.0.0');
  console.log(result.toString());
} catch (e) {
  console.error(e.message);
}
