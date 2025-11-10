FROM node:22-alpine

WORKDIR /app

# Install nodemon globally for better compatibility
RUN npm install -g nodemon

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p uploads

EXPOSE 5656

# Use nodemon for development (will be overridden by docker-compose command)
CMD ["npm", "run", "dev"]

