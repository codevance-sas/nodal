# Docker Setup for Nodal Project

This document provides instructions for building and running the Nodal project using Docker.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your system
- Git repository cloned to your local machine

## Docker Image

The project includes a Dockerfile configured to:

- Use Node.js 22.16 as specified in the project requirements
- Install necessary system dependencies for canvas and graphical libraries
- Build the Next.js application in a multi-stage process
- Run the application in production mode

## Building the Docker Image

To build the Docker image, run the following command from the project root directory:

```bash
docker build -t nodal:latest .
```

This will create a Docker image named "nodal" with the "latest" tag.

## Running the Docker Container

To run the application in a Docker container, use:

```bash
docker run -p 3101:3101 nodal:latest
```

This command:
- Starts a container from the "nodal:latest" image
- Maps port 3101 from the container to port 3101 on your host machine
- Runs the Next.js application in production mode

You can then access the application by navigating to `http://localhost:3101` in your web browser.

## Environment Variables

If you need to pass environment variables to the application, you can use the `-e` flag:

```bash
docker run -p 3101:3101 -e KEY=VALUE nodal:latest
```

Alternatively, you can create a `.env` file and use the `--env-file` flag:

```bash
docker run -p 3101:3101 --env-file .env nodal:latest
```

## Development Mode

For development purposes, you can mount your local source code into the container:

```bash
docker run -p 3101:3101 -v $(pwd):/app nodal:latest npm run dev
```

This will:
- Mount your current directory to the /app directory in the container
- Run the application in development mode with hot reloading

## Docker Compose (Optional)

For more complex setups, you might want to create a `docker-compose.yml` file. Here's a basic example:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3101:3101"
    environment:
      - NODE_ENV=production
    # Add any other configuration as needed
```

Then you can start the application with:

```bash
docker-compose up
```

## Troubleshooting

If you encounter any issues:

1. Check that Docker is running properly on your system
2. Ensure port 3101 is not already in use on your host machine
3. Check the Docker logs for any error messages:
   ```bash
   docker logs <container_id>
   ```
4. Verify that all system dependencies are correctly installed in the Dockerfile