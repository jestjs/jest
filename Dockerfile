# Use Node LTS (Jest supports current and LTS, so we pick LTS for stability)
FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Install system dependencies (git, python3, etc. needed for building Jest deps)
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy the complete source code
COPY . .

# Enable corepack and install dependencies
RUN corepack enable && yarn install --immutable

# Build Jest (this creates the missing build/index.js files)
RUN yarn build

# Set the default command to run Jest tests
# You can override this by passing different arguments to docker run
CMD ["yarn", "test-ci-partial"]
