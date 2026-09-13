# Multi-Tenant Backend

## Installation / Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/raj-varma01/multi-tenant-backend.git
   cd multi-tenant-backend
   ```

2. **Install Node.js (>=20) and npm**
   Ensure you have a recent version of Node installed. You can verify with:
   ```bash
   node -v   # should be >= 20
   npm -v
   ```

3. **Install project dependencies**
   ```bash
   npm ci   # installs exact versions from package-lock.json
   ```

4. **Configure environment variables**
   - Copy the example file and edit the values:
     ```bash
     cp .env.example .env
     ```
   - Set the required variables:
     - `MONGODB_URI` – connection string for MongoDB (default local `mongodb://localhost:27017/saas`).
     - `REDIS_URL` – Redis instance URL (default `redis://localhost:6379`).
     - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET` – credentials for the S3 bucket used for file storage.
     - Any other custom settings you need for your deployment.

5. **Start supporting services**
   - **MongoDB** – make sure a MongoDB instance is running (e.g., `docker run -d -p 27017:27017 mongo`).
   - **Redis** – start a Redis server (e.g., `docker run -d -p 6379:6379 redis`).
   - **Local S3 (optional)** – you can use tools like `LocalStack` or `MinIO` for development.

6. **Run the development server**
   ```bash
   npm run dev
   ```
   The API will be available at `http://localhost:3000`.

---

> **Note**: Adjust the ports or URLs in `.env` if your services run on non‑default ports.
