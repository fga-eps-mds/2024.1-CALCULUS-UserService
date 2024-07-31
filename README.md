# 2024.1-CALCULUS-UserService

<div align="center">
     <img src="assets/calculus-logo.svg" height="350px" width="350px">
</div>


## Sobre

Calculus é uma plataforma de aprendizado, 100% feita por estudantes da UnB, projetada para tornar o estudo de várias disciplinas escolares uma experiência envolvente e eficaz. Inspirado nos modelos de sucesso do Duolingo e Brilliant, o Calculus oferece uma abordagem inovadora para o aprendizado de matérias escolares, tornando-o acessível, divertido e altamente personalizado.



## Requisitos

- Node.js 22
- Docker
- Docker-compose



### Instalação

```bash
# 1. Clone o projeto
git clone 

# 2. Entre na pasta do projeto
cd 2023.2-PrintGo-UserService

npm i

cp .env.dev .env

# Rode o docker compose do projeto
docker-compose up --build
    # --build somente eh necessario na primeira vez que estiver rodando
    # depois `docker-compose up` ja resolve
    # em linux talvez seja necessario a execucao em modo root `sudo docker-compose up`
    # voce pode também caso queria adicionar um -d ao final para liberar o o terminal `docker-compose up -d`
    # Para finalizar o servico execute no root do projeto `docker-compose down`

```

## Contribuir

Para contribuir com esse projeto é importante seguir nosso [Guia de Contribuição](https://fga-eps-mds.github.io/2024.1-CALCULUS-DOC/guias/guia-contribuicao/) do repositório e seguir nosso [Código de Conduta](https://fga-eps-mds.github.io/2024.1-CALCULUS-DOC/guias/codigo-conduta/).

## Ambientes

- [2024.1-CALCULUS-Frontend](https://github.com/fga-eps-mds/2024.1-CALCULUS-Frontend)
- [2024.1-CALCULUS-Gateway](https://github.com/fga-eps-mds/2024.1-CALCULUS-Gateway)
- [2024.1-CALCULUS-UserService](https://github.com/fga-eps-mds/2024.1-CALCULUS-UserService)
