const fs = require('fs');
let content = fs.readFileSync('.github/workflows/playwright.yml', 'utf-8');

content = content.replace(
  "- run: npx playwright install --with-deps",
  `- name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest
      - name: Start Supabase locally
        run: supabase start
      - run: npx playwright install --with-deps`
);

fs.writeFileSync('.github/workflows/playwright.yml', content);
