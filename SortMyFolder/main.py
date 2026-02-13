import argparse
import sys
from pathlib import Path
from sorter import SmartSorter

def main():
    parser = argparse.ArgumentParser(description="Smart File Sorter using Gemini")
    parser.add_argument('--path', type=str, default='.', help="Path to the directory to sort (default: current directory)")
    parser.add_argument('--smart', action='store_true', help="Enable AI-based sorting (slower but smarter)")
    parser.add_argument('--wet-run', action='store_true', help="Actually move files (default is DRY RUN)")
    
    args = parser.parse_args()
    
    target_path = Path(args.path).resolve()
    
    if not target_path.exists() or not target_path.is_dir():
        print(f"Error: Invalid directory '{target_path}'")
        sys.exit(1)

    print(f"--- Smart File Sorter ---")
    print(f"Target: {target_path}")
    print(f"Mode: {'SMART (AI)' if args.smart else 'BASIC (Extension)'}")
    print(f"Action: {'MOVING FILES' if args.wet_run else 'DRY RUN (No changes)'}")
    print("-------------------------")

    try:
        sorter = SmartSorter()
        
        # Scan for existing folders to prime the AI
        sorter.scan_existing_folders(target_path)
        
        # Generator to iterate through files
        file_count = 0
        for file_path in sorter.scan_directory(target_path):
            file_count += 1
            # In dry run, we just print intent. In wet run, we move.
            # But the sorter.sort_file method handles printing and wet/dry logic if we pass it down
            # Let's adjust usage slightly to fit the method signature I wrote
            
            # Re-reading my own implementation of sort_file:
            # def sort_file(self, file_path: Path, use_smart: bool = False, dry_run: bool = True):
            
            # So I need to pass 'not args.wet_run' as dry_run
            sorter.sort_file(file_path, use_smart=args.smart, dry_run=not args.wet_run)
            
        if file_count == 0:
            print("No files found to sort.")
        else:
            print(f"-------------------------\nProcessed {file_count} files.")

    except KeyboardInterrupt:
        print("\nOperation cancelled.")
    except Exception as e:
        print(f"\nAn error occurred: {e}")

if __name__ == "__main__":
    main()

"""
How to Use

Install Dependencies:
pip install -r requirements.txt

Run (Dry Mode):
python main.py --path ~/Downloads --smart

Run (Real Action): Add --wet-run to actually move files.
python main.py --path ~/Downloads --smart --wet-run

"""