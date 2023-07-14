FROM node:lts-alpine
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY ./src ./src
COPY ./public ./public
EXPOSE 3000
CMD ["npm", "start"]
