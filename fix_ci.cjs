const fs = require('fs');

const workflowPath = '.github/workflows/playwright.yml';
let workflowContent = fs.readFileSync(workflowPath, 'utf8');

// Use pnpm instead of npm
workflowContent = workflowContent.replace(/npm ci/g, 'npm install -g pnpm && pnpm i');
workflowContent = workflowContent.replace(/npm run build/g, 'pnpm run build');

const supabaseSetup = `
      - uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Set Supabase Keys
        run: |
          echo "VITE_SUPABASE_URL=http://127.0.0.1:54321" >> $GITHUB_ENV
          echo "VITE_SUPABASE_ANON_KEY=$(supabase status -o json | jq -r .ANON_KEY)" >> $GITHUB_ENV
`;

if (!workflowContent.includes('supabase/setup-cli')) {
    workflowContent = workflowContent.replace(
      '- run: npm install -g pnpm && pnpm i',
      '- run: npm install -g pnpm && pnpm i' + supabaseSetup
    );
}

// Remove the static env vars from build and test steps so they use the dynamic ones
workflowContent = workflowContent.replace(/        env:\n          VITE_SUPABASE_URL: "http:\/\/127\.0\.0\.1:54321"\n          VITE_SUPABASE_ANON_KEY: "dummy-key-for-build"\n/g, '');

fs.writeFileSync(workflowPath, workflowContent, 'utf8');
console.log('Fixed CI workflow');
