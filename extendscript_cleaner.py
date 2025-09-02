"""
ExtendScript Output Cleaner
Removes markdown and extracts pure JavaScript from AI responses
"""

import re
from pathlib import Path
from typing import Optional

class ExtendScriptCleaner:
    """
    Cleans AI-generated responses to extract pure ExtendScript/JavaScript
    """
    
    def __init__(self):
        self.markdown_patterns = [
            r'```javascript?\s*\n(.*?)```',  # Code blocks
            r'```jsx?\s*\n(.*?)```',         # JSX blocks
            r'```\s*\n(.*?)```',              # Generic blocks
        ]
        
        self.remove_patterns = [
            r'^#.*$',                         # Markdown headers
            r'^\*\*.*\*\*$',                  # Bold text
            r'^-\s+.*$',                      # Bullet points
            r'^\d+\.\s+.*$',                  # Numbered lists
            r'^>.*$',                         # Quotes
            r'^\s*\n\s*\n\s*$',              # Multiple blank lines
        ]
    
    def clean(self, content: str) -> str:
        """
        Clean AI response to extract pure JavaScript
        """
        # First, try to extract code from markdown blocks
        code_extracted = self.extract_code_blocks(content)
        
        if code_extracted:
            return self.final_cleanup(code_extracted)
        
        # If no code blocks, clean the entire content
        return self.remove_markdown(content)
    
    def extract_code_blocks(self, content: str) -> Optional[str]:
        """
        Extract JavaScript from markdown code blocks
        """
        all_code = []
        
        for pattern in self.markdown_patterns:
            matches = re.findall(pattern, content, re.DOTALL | re.MULTILINE)
            all_code.extend(matches)
        
        if all_code:
            # Join all code blocks
            return '\n\n'.join(all_code)
        
        return None
    
    def remove_markdown(self, content: str) -> str:
        """
        Remove markdown formatting from content
        """
        lines = content.split('\n')
        cleaned_lines = []
        
        in_code_section = False
        
        for line in lines:
            # Skip markdown-specific lines
            skip = False
            for pattern in self.remove_patterns:
                if re.match(pattern, line, re.MULTILINE):
                    skip = True
                    break
            
            if not skip:
                # Check if line looks like code
                if self.is_code_line(line):
                    cleaned_lines.append(line)
                    in_code_section = True
                elif in_code_section and line.strip():
                    # Continue code section
                    cleaned_lines.append(line)
                elif not line.strip():
                    # Preserve single blank lines in code
                    if cleaned_lines and cleaned_lines[-1].strip():
                        cleaned_lines.append('')
        
        return '\n'.join(cleaned_lines)
    
    def is_code_line(self, line: str) -> bool:
        """
        Determine if a line looks like JavaScript code
        """
        code_indicators = [
            'var ', 'let ', 'const ', 'function ',
            'if ', 'else ', 'for ', 'while ',
            'return ', 'new ', 'app.', 'this.',
            '//', '/*', '*/', '{', '}', '(', ')',
            ';', '=', '+=', '-=', '==', '!=',
        ]
        
        line_stripped = line.strip()
        
        for indicator in code_indicators:
            if indicator in line_stripped:
                return True
        
        return False
    
    def final_cleanup(self, code: str) -> str:
        """
        Final cleanup and formatting
        """
        # Remove any remaining markdown artifacts
        code = re.sub(r'^Here\'s.*?:\s*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'^This.*?:\s*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'^To use.*?:\s*$', '', code, flags=re.MULTILINE)
        code = re.sub(r'^Note.*?:\s*$', '', code, flags=re.MULTILINE)
        
        # Remove excessive blank lines
        code = re.sub(r'\n\s*\n\s*\n', '\n\n', code)
        
        # Ensure proper formatting
        code = code.strip()
        
        # Add header comment if not present
        if not code.startswith('//'):
            code = '// Auto-generated ExtendScript for After Effects\n\n' + code
        
        return code
    
    def clean_file(self, input_path: str, output_path: str = None) -> str:
        """
        Clean a file containing AI response
        """
        input_file = Path(input_path)
        
        if not input_file.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")
        
        # Read content
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Clean content
        cleaned = self.clean(content)
        
        # Determine output path
        if output_path is None:
            output_path = input_file.with_suffix('.clean.jsx')
        
        # Write cleaned content
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(cleaned)
        
        return str(output_path)


def test_cleaner():
    """
    Test the cleaner with sample content
    """
    sample = '''Here's a step-by-step script for creating the text animation in After Effects:

```javascript
// Create a new composition
var comp = app.project.activeItem;
if (!comp || !(comp instanceof CompItem)) {
    comp = app.project.items.addComp("Text Animation", 1920, 1080, 1, 3, 30);
}

// Add text layer
var textLayer = comp.layers.addText("Hello AE Max v3");
```

This script will:
1. Create a new composition
2. Add text

To use:
- Open After Effects
- Run the script'''
    
    cleaner = ExtendScriptCleaner()
    cleaned = cleaner.clean(sample)
    
    print("Original length:", len(sample))
    print("Cleaned length:", len(cleaned))
    print("\nCleaned content:")
    print("=" * 50)
    print(cleaned)
    print("=" * 50)
    
    return cleaned


if __name__ == "__main__":
    # Test the cleaner
    test_cleaner()
    
    # Clean existing files
    import glob
    jsx_files = glob.glob(r"C:\Users\packr\AppData\Local\AnthropicClaude\app-0.12.129\AE_Claude_Max_Project\drops\ae_vibe\output\*.jsx")
    
    if jsx_files:
        print(f"\nFound {len(jsx_files)} JSX files to clean")
        cleaner = ExtendScriptCleaner()
        
        for jsx_file in jsx_files:
            try:
                cleaned_path = cleaner.clean_file(jsx_file)
                print(f"Cleaned: {Path(jsx_file).name} -> {Path(cleaned_path).name}")
            except Exception as e:
                print(f"Error cleaning {jsx_file}: {e}")
