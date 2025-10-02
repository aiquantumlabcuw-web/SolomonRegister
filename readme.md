# 🛠️ Makerspace 3D Print Ticketing System

A full-stack MERN application designed for managing 3D print requests at a makerspace. Users can submit orders, while admins manage requests, assign roles, and respond through a role-based ticket system.

This project enables users to create orders for 3D printing, specifying their requirements, while the admin oversees all incoming orders. The admin has the ability to respond to orders, manage user privileges, and assign specific roles based on user type. The system enables efficient communication between users and the admin, ensuring smooth order management and role-based access control within the application.

---

## 📦 Tech Stack

- **Frontend:** React.js, Redux, TailwindCSS, ReactRecoil
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Database GUI:** Mongo Express
- **DevOps:** Docker & Docker Compose

---

## 📁 Project Structure

```
.
├── makerspace/               # React frontend
│   ├── config/               # Frontend configuration
│   └── src/
│       └── client/           # Client-side React code
├── makerspace_node/          # Node.js backend
│   ├── config/               # Backend configuration
│   ├── routes/               # API routes
│   │   ├── adminRoutes.js
│   │   ├── userRoutes.js
│   │   ├── emailRoutes.js
│   │   ├── ticketRoutes.js
│   │   ├── privilegeRoutes.js
│   │   ├── roleRoutes.js
│   │   └── contact.js
│   ├── uploads/              # File upload storage
│   └── app.js               # Main server file
├── app.Dockerfile            # Dockerfile (React app)
├── server.Dockerfile         # Dockerfile (Node server)
├── db.Dockerfile             # Dockerfile (MongoDB setup)
├── docker-compose.yml        # Orchestrates all services
└── .env                      # Environment variables
```

---

## ⚙️ Docker Setup Instructions

### ✅ Prerequisites

- Install Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- (Optional) Install Docker Desktop for easier volume management.

### 💡 Tip for Windows Users:

Docker stores volumes in `C:` by default. You can reconfigure it to another drive (`D:` etc.) using Docker Desktop → Settings → Resources.

---

## 📜 Services Overview (via `docker-compose.yml`)

| Service         | Description         | Port    |
| --------------- | ------------------- | ------- |
| `mongo`         | MongoDB container   | `27017` |
| `mongo-express` | Web GUI for MongoDB | `8081`  |
| `server`        | Node.js backend API | `3000`  |
| `app`           | React.js frontend   | `5050`  |

### Docker Compose File Explanation

The `docker-compose.yml` file orchestrates the following services:

- **mongo**: MongoDB database with persistent storage
- **mongo-express**: Web interface for MongoDB management
- **server**: Node.js backend service with volumes for code and uploads
- **app**: React frontend with hot-reloading for development

The configuration uses named volumes for data persistence and creates a bridged network for inter-service communication.

---

## 🚀 Running the Project

### With Docker (Recommended)

#### 1. Clone and open the root directory in terminal

```bash
git clone (https://github.com/freindst/makerspace-react.git)>
cd makerspace-react
```

#### 2. Setup environment variables

Create a `.env` file with:

```ini
MONGO_INITDB_ROOT_USERNAME=cuwcs
MONGO_INITDB_ROOT_PASSWORD=makerspace
MONGO_EXPRESS_USERNAME=cuwcs
MONGO_EXPRESS_PASSWORD=makerspace
```

#### 3. Run Docker commands

```bash
# Stop any running containers
docker-compose down

# Build all containers
docker-compose build

# Start all services
docker-compose up -d
```

The setup process will:

1. Download required images (Node.js, MongoDB, Mongo Express)
2. Build the application containers
3. Start all services in detached mode

## Running Locally (Without Docker)

### Prerequisites for Local Development

- **Node.js**: Version 18 (minimum v16) required
- **MongoDB**: Community Edition
- **MongoDB Compass**: For database management

#### Installing Node.js via NVM

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
# OR using wget
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc depending on your shell

# Install and use Node.js v18
nvm install 18
nvm use 18
```

#### Installing MongoDB Community Edition

Follow the official installation guide for your OS:

```bash
# For Ubuntu
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

Start MongoDB service:

```bash
sudo systemctl start mongod
sudo systemctl enable mongod  # Start on boot
```

#### Installing MongoDB Compass

Download and install MongoDB Compass GUI from the [official website](https://www.mongodb.com/products/compass).

For Ubuntu:

```bash
wget https://downloads.mongodb.com/compass/mongodb-compass_1.35.0_amd64.deb
sudo dpkg -i mongodb-compass_1.35.0_amd64.deb
```

#### For Frontend

```bash
cd makerspace
npm i
npm run dev
```

#### For Backend

```bash
cd makerspace_node
npm i
npm run server
```

---

## 🌐 Local Access URLs

| Service         | URL                       |
| --------------- | ------------------------- |
| Frontend UI     | http://localhost:5050     |
| Backend API     | http://localhost:3000     |
| Mongo Express   | http://localhost:8081     |
| MongoDB (local) | mongodb://localhost:27017 |

---

## 🔧 Additional Configuration

If needed, you can change the default Docker volume storage location:

1. Open Docker Desktop
2. Go to Settings → Resources
3. Update the disk image location to your preferred drive
