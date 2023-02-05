FROM node:18.13.0

# Create app directory
WORKDIR /node-docker

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install 

# Bundle app source
COPY . .

EXPOSE 3000
CMD [ "node", "app.js" ]