FROM node:20-alpine

# Install only production dependencies
WORKDIR /app
COPY package.json ./

# npm install will run inside Coolify/Traefik containers where network access exists
RUN npm install --omit=dev

# Copy the rest of the repository
COPY . .

EXPOSE 3001

CMD ["npm", "start"]
