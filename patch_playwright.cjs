const fs = require('fs');
const filepath = '.github/workflows/playwright.yml';
let content = fs.readFileSync(filepath, 'utf8');

content = content.replace(
  "- run: npm ci",
  "- uses: pnpm/action-setup@v3\n        with:\n          version: 8\n      - run: pnpm install"
);

content = content.replace(
  "- name: Build project\n        run: npm run build\n        env:\n          VITE_SUPABASE_URL: \"http://127.0.0.1:54321\"\n          VITE_SUPABASE_ANON_KEY: \"dummy-key-for-build\"",
  "- uses: supabase/setup-cli@v1\n      - run: supabase start\n      - name: Set Anon Key\n        run: echo \"VITE_SUPABASE_ANON_KEY=$(supabase status -o json | jq -r .ANON_KEY)\" >> $GITHUB_ENV\n      - name: Build project\n        run: pnpm run build\n        env:\n          VITE_SUPABASE_URL: \"http://127.0.0.1:54321\""
);

content = content.replace(
  "- run: npx playwright install --with-deps",
  "- run: pnpm exec playwright install --with-deps"
);

content = content.replace(
  /npx playwright test/g,
  "pnpm exec playwright test"
);

// Remove the hardcoded dummy key from the Run E2E step
content = content.replace(
  "          VITE_SUPABASE_ANON_KEY: \"dummy-key-for-build\"",
  ""
);

fs.writeFileSync(filepath, content);
console.log('Patched', filepath);
