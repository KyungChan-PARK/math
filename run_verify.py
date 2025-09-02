import sys
import os
from pathlib import Path

# Set working directory to project root
project_dir = Path(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project")
os.chdir(project_dir)
sys.path.insert(0, str(project_dir))

# Now run the verification
exec(open('verify_environment.py').read())
