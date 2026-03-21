#!/bin/bash

# Define the config import based on path
add_import() {
    file=$1
    if [[ "$file" == *"e2e"* ]]; then
        sed -i '1i import { TEST_CONFIG } from "../test-config";' "$file"
    else
        sed -i '1i import { TEST_CONFIG } from "./test-config";' "$file"
    fi
}

files=(
  "tests/e2e/setup.spec.ts"
  "tests/e2e/admin_reservations.spec.ts"
  "tests/e2e/reservations_flow.spec.ts"
  "tests/e2e/reservations_morosity.spec.ts"
  "tests/e2e/reservations_concurrency.spec.ts"
  "tests/e2e/security_check.spec.ts"
  "tests/repro_rpc.spec.ts"
  "tests/repro_rpc.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file"

    # Add import if missing
    if ! grep -q "import { TEST_CONFIG }" "$file"; then
      add_import "$file"
    fi

    # Replace URLs
    sed -i 's/const SUPABASE_URL = .*/const SUPABASE_URL = TEST_CONFIG.SUPABASE_URL;/' "$file"
    sed -i 's/const SUPABASE_KEY = .*/const SUPABASE_KEY = TEST_CONFIG.SUPABASE_KEY;/' "$file"

    # Replace credentials
    sed -i 's/const ADMIN_EMAIL = .*/const ADMIN_EMAIL = TEST_CONFIG.ADMIN_EMAIL;/' "$file"
    sed -i 's/const ADMIN_PASSWORD = .*/const ADMIN_PASSWORD = TEST_CONFIG.ADMIN_PASSWORD;/' "$file"
    sed -i 's/const RESIDENT_EMAIL = .*/const RESIDENT_EMAIL = TEST_CONFIG.RESIDENT_EMAIL;/' "$file"
    sed -i 's/const RESIDENT_PASSWORD = .*/const RESIDENT_PASSWORD = TEST_CONFIG.RESIDENT_PASSWORD;/' "$file"

    # Handle inline replacements
    sed -i "s/'rockwell.harrison@gmail.com'/TEST_CONFIG.ADMIN_EMAIL/g" "$file"
    sed -i "s/'270386'/TEST_CONFIG.ADMIN_PASSWORD/g" "$file"
    sed -i "s/'contacto@rockcode.cl'/TEST_CONFIG.RESIDENT_EMAIL/g" "$file"
    sed -i "s/'180381'/TEST_CONFIG.RESIDENT_PASSWORD/g" "$file"
  fi
done
