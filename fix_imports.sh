for file in tests/e2e/*.spec.ts tests/*.ts; do
  sed -i "/import dotenv from 'dotenv';/d" "$file"
  sed -i "/dotenv.config({ path: '\.env\.local' });/d" "$file"
done
