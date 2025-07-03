#!/bin/bash

echo "Starting local dev environment..."

docker-compose up -d

echo "Waiting for services to initialize..."
sleep 10

echo "All services started."
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:8000"
