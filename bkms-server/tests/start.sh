#!/bin/bash
which bru

# Wait for the bkms-server to be ready
wait_for_server() {
    local timeout=10
    local count=0
    echo "Waiting for server to be ready..."
    
    while [ $count -lt $timeout ]; do
        if nc -z bkms-server 32402 2>/dev/null; then
            echo "Server is ready!"
            return 0
        fi
        echo "Waiting... ($((count + 1))/$timeout)"
        sleep 1
        count=$((count + 1))
    done
    
    echo "Server is not ready after $timeout seconds, exiting..."
    return 1
}

# Wait for server to be ready
if ! wait_for_server; then
    exit 1
fi

cd /app/apis

bru run . -r --env e2e --sandbox=developer
if [ $? -ne 0 ]
then
    echo "run cases fail, please check"
    exit 1
else
    echo "run cases success"
    exit 0
fi
