import os
import glob

html_files = glob.glob('*.html')

for file in html_files:
    with open(file, 'r') as f:
        content = f.read()
    
    # Inject main.ts just before the closing </body> tag
    if 'src/main.ts' not in content:
        content = content.replace('</body>', '  <script type="module" src="/src/main.ts"></script>\n</body>')
    
    with open(file, 'w') as f:
        f.write(content)

print("Injected scripts")
