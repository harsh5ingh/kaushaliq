"""Private parsing worker. File contents stay on stdin, never arguments or logs."""
import json
import sys
from src.accounts.resumes import extract


if __name__ == '__main__':
    try:
        result = extract(sys.stdin.buffer.read(), sys.argv[1])
        sys.stdout.write(json.dumps(result))
    except Exception:
        sys.exit(1)
