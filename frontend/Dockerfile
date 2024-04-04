# Use an official Node.js LTS (Long Term Support) version as your base image.
FROM node:lts

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (if available) files first.
COPY package*.json ./

# Install your application's dependencies using npm ci for a more reliable and faster build
RUN npm ci --only=production

# Copy the rest of your application's code into the container
COPY . .

# Set the environment variable for the port your app runs on
# Note: Removed spaces around "=" to follow Dockerfile syntax
ENV PORT=5173

# Expose the port your app runs on
EXPOSE 5173

CMD ["npm", "run", "dev"]
