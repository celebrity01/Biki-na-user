import subprocess
import os

subprocess.run(["git", "add", "package.json"], check=True)
subprocess.run(["git", "commit", "-m", "Add dummy package.json to fix Render build"], check=True)

result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)

print(result.stdout)
print(result.stderr)
