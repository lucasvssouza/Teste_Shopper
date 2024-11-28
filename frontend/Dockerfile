FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
ENV CHOKIDAR_USEPOLLING=true
ARG REACT_APP_GOOGLE_API_KEY
ENV REACT_APP_GOOGLE_API_KEY=${REACT_APP_GOOGLE_API_KEY}
RUN npm run build

FROM nginx
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
