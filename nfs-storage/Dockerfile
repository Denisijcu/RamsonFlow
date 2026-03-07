FROM node:20-alpine
WORKDIR /app
RUN mkdir -p /data
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
