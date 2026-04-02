import subprocess
import os

subprocess.run(["git", "add", "."], check=True)
subprocess.run(["git", "commit", "-m", "Convert to full-stack Vite App with Supabase logic"], check=True)

result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)

print(result.stdout)
print(result.stderr)
