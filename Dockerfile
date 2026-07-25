FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install --include=dev

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
