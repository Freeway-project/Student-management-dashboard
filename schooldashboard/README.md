# School Management Dashboard

<div align="center"><strong>Next.js 15 School Management Dashboard</strong></div>
<div align="center">Built with the Next.js App Router & MongoDB</div>

## Overview

This is a school management dashboard using the following stack:

- Framework - [Next.js (App Router)](https://nextjs.org)
- Language - [TypeScript](https://www.typescriptlang.org)
- Auth - Custom JWT Authentication
- Database - [MongoDB](https://www.mongodb.com) with [Mongoose](https://mongoosejs.com)
- Deployment - [Vercel](https://vercel.com/docs/concepts/next.js/overview)
- Styling - [Tailwind CSS](https://tailwindcss.com)
- Components - [Shadcn UI](https://ui.shadcn.com/)
- Analytics - [Vercel Analytics](https://vercel.com/analytics)
- Formatting - [Prettier](https://prettier.io)

This template uses the new Next.js App Router with MongoDB for data persistence.

## Getting Started

1. **Setup MongoDB**
   - Install MongoDB locally or use MongoDB Atlas
   - Update `MONGODB_URI` in your `.env.local` file

2. **Environment Variables**
   - Copy `.env.example` to `.env.local`
   - Update the MongoDB connection string and JWT secrets

3. **Install Dependencies**
   ```bash
   pnpm install
   ```

4. **Create Test User**
   - Start the development server: `pnpm dev`
   - Visit `http://localhost:3000/api/seed` to create an admin user
   - Login with: `admin@school.com` / `password123`

5. **Start Development**
   ```bash
   pnpm dev
   ```

You should now be able to access the application at http://localhost:3000.
