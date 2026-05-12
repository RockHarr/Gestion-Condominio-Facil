with open('.github/workflows/playwright.yml', 'r') as f:
    content = f.read()

lines = content.split('\n')
new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if skip_next:
        skip_next = False
        continue
    if 'FORCE_JAVASCRIPT_ACTIONS_TO_NODE24' in line:
        continue
    if line.strip() == 'env:' and i + 1 < len(lines) and 'FORCE_JAVASCRIPT_ACTIONS_TO_NODE24' in lines[i+1]:
        skip_next = True
        continue
    new_lines.append(line)

content = '\n'.join(new_lines)
with open('.github/workflows/playwright.yml', 'w') as f:
    f.write(content)
