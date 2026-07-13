import os
import subprocess
import sys

TEST_DIR = "app/generated_tests"
TEST_FILE = os.path.join(TEST_DIR, "test_api.py")

os.makedirs(TEST_DIR, exist_ok=True)


def save_tests(tests):
    with open(TEST_FILE, "w", encoding="utf-8") as f:
        f.write("\n\n".join(tests))


def run_tests():
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            TEST_DIR,
            "-v",
        ],
        capture_output=True,
        text=True,
        cwd=os.getcwd(),
    )

    return {
        "stdout": result.stdout,
        "stderr": result.stderr,
        "code": result.returncode,
    }
