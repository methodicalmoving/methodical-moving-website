# Tools

Python scripts for deterministic execution. Each script does one thing reliably.

## Conventions
- Scripts accept inputs via CLI args or a config dict at the top
- Credentials come from `.env` (use `python-dotenv`)
- Output goes to `.tmp/` or directly to cloud services
- Scripts print clear success/error messages

## Usage
Run from the project root:
```bash
python tools/<script_name>.py
```
