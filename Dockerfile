FROM node:20-bullseye-slim AS base

# Declaring envs
ENV LEVEL=${LEVEL}
ENV PORT=5000

# Setting up the work directory
WORKDIR /es-erp

RUN apt-get update && apt-get install -y \
    curl \
    libcurl4 \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Copying all the files in our project
COPY . .

# Installing dependencies
RUN npm install --force
RUN npm run prisma:generate



# Build
RUN npm run build


# Starting our application
CMD [ "npm run start -- -p 5000" ]

# Exposing server port
EXPOSE 5000