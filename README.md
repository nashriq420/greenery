# BudPlug v2.5.0

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A modern, production-ready subscription-based geo-mapped marketplace for plant enthusiasts. Connect with nearby sellers, browse unique listings, and manage your plant business with ease.

---

## 🏛 Project Structure

- **`backend/`**: Robust API built with Node.js, Express, Prisma, and PostgreSQL.
- **`frontend/`**: Dynamic UI powered by Next.js, Tailwind CSS, ShadCN UI, and Leaflet maps.

---

## 🚀 Getting Started

### Prerequisites

- Node.js v20+
- PostgreSQL instance
- npm or yarn

### 🔧 Backend Setup

1. `cd backend`
2. `npm install`
3. Configure `.env`:

   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/greenery"
   JWT_SECRET="your_secret_key"
   ```

4. `npx prisma generate && npx prisma db push`
5. (Optional) `npx ts-node prisma/seed.ts`
6. `npm run dev` (API at <http://localhost:4000>)

### 🎨 Frontend Setup

1. `cd frontend`
2. `npm install`
3. `npm run dev` (App at <http://localhost:3000>)

---

## ✨ Key Features

- **🔐 Secure Auth**: Role-based access (Customer/Seller) with JWT protection.
- **📍 Geo-Mapping**: Interactive Leaflet maps with radius-based seller search.
- **🛒 Marketplace**: Browse, filter, and view detailed plant listings.
- **💎 Subscription System**: 
  - Free & Pro tiers.
  - Pro-only feature enforcement via middleware.
  - Seamless (mocked) upgrade flow.
- **💬 Real-time Chat**: Connect directly with sellers and customers.
- **🛠 Merchant Dashboard**: Comprehensive tools for sellers to manage listings and orders.

---

## 🌐 Deployment

BudPlug is designed for easy deployment using modern cloud infrastructure.

- **EC2**: Successfully deployed on AWS EC2 instances.
- **Docker**: Containerized setup via `docker-compose.yml`.
- **Reverse Proxy**: Nginx configuration for SSL termination and load balancing.
- **SSL**: Secured with Let's Encrypt for production environments.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
