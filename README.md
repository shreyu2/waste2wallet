♻️ Waste2Wallet

Smart Waste Management & Recycling Platform

Waste2Wallet is a digital waste management platform designed to make waste collection, recycling, and environmental responsibility more accessible and efficient. It connects citizens, waste collectors, and administrators through a centralized platform that helps streamline waste management activities and encourage sustainable practices.

⸻

🌍 Overview

Traditional waste management systems often struggle with inefficient collection processes, limited communication, and a lack of citizen participation.

Waste2Wallet aims to address these challenges through a technology-driven platform where users can interact with waste management services, collectors can manage their activities, and administrators can oversee operations.

The platform focuses on improving coordination, transparency, and community participation in waste management.

✨ Key Features

👤 Citizen

* Citizen registration and authentication.
* Access to a personalized dashboard.
* View waste management-related information.
* Participate in available recycling and reward activities.
* Access citizen portfolio and reward-related sections.

🚛 Waste Collector

* Dedicated collector authentication and dashboard.
* Collector location tracking.
* Map-based location visualization.
* Access to collector-specific information and activities.

🛡️ Administrator

* Dedicated administrator dashboard.
* Centralized management interface.
* Access to platform information and operational views.
* Monitor collector-related information.

🏭 STP Dashboard

* Dedicated dashboard for Sewage Treatment Plant-related operations.
* Centralized interface for relevant information and monitoring.

🤖 AI Integration

* AI-powered functionality integrated into the platform.
* Designed to support smarter waste management workflows.

Feature availability depends on the current implementation and backend configuration.

⸻

🛠️ Tech Stack

Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Leaflet
* React Leaflet

Backend

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* JWT Authentication
* bcryptjs

Development Tools

* Git
* GitHub
* npm
* ESLint

⸻

📁 Project Structure

Waste2Wallet/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── ...
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
│
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── db.ts
│   │   ├── index.ts
│   │   └── seed.ts
│   ├── package.json
│   ├── package-lock.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md

⸻

⚙️ Installation & Setup

Prerequisites

Make sure you have installed:

* Node.js
* MongoDB
* npm
* Git

1. Clone the Repository

git clone https://github.com/shreyu2/waste2wallet.git
cd waste2wallet

2. Setup the Backend

cd backend
npm install

Create a .env file inside the backend directory.

Configure the required environment variables:

PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/waste2wallet
JWT_SECRET=your_secure_random_secret

Add any additional API keys required by the backend.

Start the backend development server:

npm run dev

Backend API:

http://localhost:3000

3. Setup the Frontend

Open another terminal:

cd frontend
npm install

Create a .env file using .env.example as a reference.

VITE_API_BASE_URL=http://localhost:3000/api

Start the frontend development server:

npm run dev

Frontend:

http://localhost:5173

⸻

🧪 Build Commands

Frontend

Development:

npm run dev

Production build:

npm run build

Lint:

npm run lint

Preview production build:

npm run preview

Backend

Development:

npm run dev

Production build:

npm run build

Start production server:

npm start

⸻

🔐 Security

* Authentication uses JSON Web Tokens.
* Passwords are hashed before storage.
* Environment variables are used for sensitive configuration.
* API credentials and secrets should never be committed to GitHub.
* Role-based access control should be enforced on protected backend routes.

⸻

🚀 Future Improvements

* Real-time waste collection tracking.
* Improved route optimization for collection vehicles.
* Automated collection scheduling.
* Enhanced citizen notifications.
* Advanced waste analytics and reporting.
* Expanded recycling and reward mechanisms.
* Improved administrative monitoring.

⸻

🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a feature branch.

git checkout -b feature/your-feature-name

3. Commit your changes.

git commit -m "Add: your feature description"

4. Push your branch.

git push origin feature/your-feature-name

5. Open a Pull Request.

⸻

📄 License

This project is currently maintained as a development project. A formal open-source license can be added when the repository’s licensing terms are decided.

⸻

👨‍💻 Project

Waste2Wallet — Building smarter and more sustainable waste management solutions.

GitHub Repository: https://github.com/shreyu2/waste2walletf