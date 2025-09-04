#!/bin/bash

echo "Starting Network Configuration Analyzer..."

# 启动后端服务器
echo "Starting backend server..."
node server.js &
SERVER_PID=$!

# 等待服务器启动
sleep 2

# 检查服务器是否启动成功
if curl -s http://localhost:3001 > /dev/null; then
    echo "Backend server started successfully on port 3001"
else
    echo "Failed to start backend server"
    kill $SERVER_PID
    exit 1
fi

# 启动前端开发服务器
echo "Starting frontend development server..."
cd client
npm start &
CLIENT_PID=$!

# 等待客户端启动
sleep 5

echo ""
echo "=========================================="
echo "Network Configuration Analyzer is running!"
echo "=========================================="
echo "Frontend: http://localhost:3002"
echo "Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# 等待用户中断
trap "echo 'Stopping servers...'; kill $SERVER_PID $CLIENT_PID; exit" INT
wait
