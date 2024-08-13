#!/bin/bash

SESSION_NAME="npm_run_session"
ENV="dev"
DIR1="/home/Calculus-admin1/app/2024.1-CALCULUS-Frontend"

# Comandos renomeados para refletir a ordem de execução
CMD1="git fetch"
CMD2="git checkout $ENV"
CMD3="git pull origin $ENV"
CMD4="npm install"
CMD5="npm run start &"
CMD6="echo Starting Deploy Front"

# Função para iniciar a sessão tmux e executar comandos
start_tmux_session() {
    # Criar uma nova sessão tmux
    tmux kill-session -t $SESSION_NAME 2>/dev/null
    tmux new-session -d -s $SESSION_NAME

    # Executar os comandos na pasta do frontend
    tmux send-keys -t $SESSION_NAME "cd $DIR1" C-m
    tmux send-keys -t $SESSION_NAME "$CMD1" C-m
    tmux send-keys -t $SESSION_NAME "$CMD2" C-m
    tmux send-keys -t $SESSION_NAME "$CMD3" C-m
    tmux send-keys -t $SESSION_NAME "$CMD4" C-m
    tmux send-keys -t $SESSION_NAME "$CMD5" C-m
    tmux send-keys -t $SESSION_NAME "$CMD6" C-m

    # Anexar à sessão tmux para visualizar os comandos em execução
}

# Função para executar o health check
run_healthcheck() {
    PORT=3000
    CHECK_INTERVAL=5

    echo "Iniciando health check para a porta $PORT..."

    while true; do
        # Executa o comando para verificar se a porta está em uso
        OUTPUT=$(ss -tuln | grep ":$PORT")

        # Verifica se há algum resultado
        if [ -n "$OUTPUT" ]; then
            echo "A porta $PORT está em uso. Encerrando o health check."
            break
        else
            echo "A porta $PORT não está em uso. Verificando novamente em $CHECK_INTERVAL segundos..."
            sleep $CHECK_INTERVAL
        fi
    done
}

# Iniciar a sessão tmux e executar os comandos
start_tmux_session

# Após a execução do tmux, iniciar o health check
run_healthcheck
