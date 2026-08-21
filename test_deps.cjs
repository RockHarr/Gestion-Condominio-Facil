const { execSync } = require('child_process');

console.log("Checking if supabase works...");
try {
  const result = execSync('npx supabase start', { stdio: 'inherit' });
  console.log("Supabase started!");
} catch (e) {
  console.log("Supabase failed:", e.message);
}
