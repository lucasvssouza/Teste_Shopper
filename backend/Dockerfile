FROM node:18-alpine

WORKDIR /backend
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD ["npx", "nodemon", "--watch", "src", "--ext", "ts,json", "--exec", "npx ts-node src/index.ts"]
