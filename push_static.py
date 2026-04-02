import subprocess
import os

os.chdir("public")

# Move the public folder contents to the root so the static site serves from root easily.
# Actually we can just set Render publishPath to empty or keep it as dist and move it.
# It is better to move the HTML files to the root directory, replace the previous react setup,
# and push to github.
subprocess.run("mv *.html ../", shell=True)
os.chdir("../")

# Ensure Render builds it as a static site: we don't need a build command anymore.
# We will just commit all HTML files in root.
subprocess.run(["git", "add", "*.html"], check=True)
subprocess.run(["git", "add", "."], check=True)

# Commit changes
subprocess.run(["git", "commit", "-m", "Replace React app with pure Stitch HTML prototypes"], check=True)

# Push to GitHub
result = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)

print(result.stdout)
print(result.stderr)
