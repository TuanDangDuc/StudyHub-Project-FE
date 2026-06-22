FROM node:25 AS build

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install @tailwindcss/oxide-linux-x64-gnu
COPY . .

RUN npm run build


FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

ENTRYPOINT ["nginx", "-g", "daemon off;"]
