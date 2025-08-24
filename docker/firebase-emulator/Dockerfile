# Firebase Emulator for Testing
# Use the latest LTS Node.js version for better compatibility
FROM node:20-alpine

# Set environment variable to avoid npm warnings
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
ENV NODE_ENV=development

# Install latest Firebase CLI (version 14.14.0 as of now)
RUN npm install -g firebase-tools@14.14.0

# Verify Firebase CLI installation and version
RUN firebase --version

# Create working directory
WORKDIR /firebase

# Copy Firebase configuration
COPY firebase.json .
COPY .firebaserc .

# Create a functions directory (required even if not using functions)
RUN mkdir -p functions

# Expose Firebase emulator ports
EXPOSE 4000 9099 8080 8085 5001 9000

# Set Firebase project for emulator
ENV FIREBASE_PROJECT_ID=demo-test

# Health check to ensure emulator is ready
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:4000 || exit 1

# Start Firebase emulators with proper configuration
CMD ["firebase", "emulators:start", "--only", "auth", "--project", "demo-test"]