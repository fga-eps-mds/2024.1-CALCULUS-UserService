FROM node:18-alpine

WORKDIR /src

ENV PORT=8001

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 8001

CMD ["npm", "run",]