FROM node:20

# Enable corepack and use correct yarn version
RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Set working directory
WORKDIR /app

# Copy all files
COPY . .

# Install dependencies
RUN yarn install --immutable

# Default command
CMD ["yarn", "test"]