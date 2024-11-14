FROM node:20-bullseye-slim AS base

# Declaring envs
ENV LEVEL=${LEVEL}
ENV PORT=5000

# Setting up the work directory
WORKDIR /es-erp

# Copying all the files in our project
COPY . .

# Installing dependencies
RUN npm install

# RUN cd app && npm install

# Build
RUN npm run build


# Starting our application
CMD [ "node", "./dist/src/index.js" ]

# Exposing server port
EXPOSE 5000