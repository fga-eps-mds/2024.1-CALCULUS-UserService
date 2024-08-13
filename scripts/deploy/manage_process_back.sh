#!/bin/bash

# Portas que precisam ser verificadas
PORT1=3000

# Função para encerrar processos que estão usando a porta
kill_process_on_port() {
    local PORT=$1
    PID=$(lsof -t -i:$PORT)
    if [ -n "$PID" ]; then
        echo "Terminating process on port $PORT (PID: $PID)"
        sudo kill -9 $PID
    else
        echo "No process running on port $PORT"
    fi
}


# Encerrar processos nas portas especificadas
kill_process_on_port $PORT1

# Encerrar processos relacionados ao `nest`
echo "Terminating all processes for 'nest'"
sudo pkill nest
