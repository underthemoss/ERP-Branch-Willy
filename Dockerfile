FROM node:slim AS base

# Declaring envs
ENV LEVEL=${LEVEL}
ENV PORT=5000

# Setting up the work directory
WORKDIR /es-erp


# Copy only package.json and package-lock.json first for better layer caching
COPY package*.json ./

# Install dependencies (this layer will be cached unless package.json changes)
RUN npm install --force

# Copy the rest of the source code
COPY . .

# Generate code (if needed)
RUN npm run codegen

# Build
RUN npm run build

# Start the application
CMD ["npm", "run", "start", "--", "-p", "5000"]

# Expose server port
EXPOSE 5000

