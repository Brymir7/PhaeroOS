import os
import subprocess
import re
# Constants
LOOK_FOR = 'http://localhost:7000/'
REPLACE_WITH = 'https://apiprod.phaero.net/'  

LOOK_FOR_MAIN_WEBSOCKET = 'ws://localhost:7000/api/v1/websocket/'
REPLACE_WITH_MAIN_WEBSOCKET = 'wss://apiprod.phaero.net/api/v1/websocket/'

LOOK_FOR_TRANSCRIPTION = 'ws://127.0.0.1:8003'
REPLACE_WITH_TRANSCRIPTION = 'wss://transcription.phaero.net'

LOOK_FOR_COOKIE = 'path: "/",'
LOOK_FOR_REFRESH_COOKIE = 'path: "/api/v1/auth/refresh_token/",'
REPLACE_WITH_COOKIE = 'path: "/", domain: ".phaero.net",'
REPLACE_WITH_REFRESH_COOKIE = 'path: "/api/v1/auth/refresh_token/", domain: ".phaero.net",'
FILE_EXTENSIONS = ['.tsx', '.ts']  # Add/remove extensions as needed

# Function to replace a string in a file
def replace_in_file(file_path, look_for, replace_with):
    with open(file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    content = re.sub(re.escape(look_for), replace_with, content)
    with open(file_path, 'w', encoding='utf-8') as file:
        file.write(content)

# Function to recursively find and replace in files
def find_and_replace(root_dir, look_for, replace_with):
    for dirpath, _, filenames in os.walk(root_dir):
        for filename in filenames:
            if any(filename.endswith(ext) for ext in FILE_EXTENSIONS):
                file_path = os.path.join(dirpath, filename)
                replace_in_file(file_path, look_for, replace_with)

# Replace 'localhost' with the constant string
find_and_replace('.', LOOK_FOR, REPLACE_WITH)
find_and_replace('.', LOOK_FOR_TRANSCRIPTION, REPLACE_WITH_TRANSCRIPTION)
find_and_replace('.', LOOK_FOR_MAIN_WEBSOCKET, REPLACE_WITH_MAIN_WEBSOCKET)
find_and_replace('.', LOOK_FOR_COOKIE, REPLACE_WITH_COOKIE)
find_and_replace('.', LOOK_FOR_REFRESH_COOKIE, REPLACE_WITH_REFRESH_COOKIE)
# Run 'npm run build'
subprocess.run(['npm', 'run', 'build'], check=True)

#Swap back to 'localhost'
find_and_replace('.', REPLACE_WITH, LOOK_FOR)
find_and_replace('.', REPLACE_WITH_TRANSCRIPTION, LOOK_FOR_TRANSCRIPTION)
find_and_replace('.', REPLACE_WITH_MAIN_WEBSOCKET, LOOK_FOR_MAIN_WEBSOCKET)
find_and_replace('.', REPLACE_WITH_COOKIE, LOOK_FOR_COOKIE)
find_and_replace('.', REPLACE_WITH_REFRESH_COOKIE, LOOK_FOR_REFRESH_COOKIE)
