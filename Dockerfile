FROM node:18

WORKDIR /src


COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
RUN npm audit fix --force

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
