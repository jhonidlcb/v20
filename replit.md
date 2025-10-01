# SoftwarePar - Full-Stack Software Development Platform

## Overview

SoftwarePar is a comprehensive software development platform designed for the Argentine market, offering custom software development services. It provides a complete business solution for managing software projects, encompassing client interaction, development, multi-stage payment processing via MercadoPago, and ongoing support. The platform integrates client management, partner referral programs, and includes project management with progress tracking, support ticketing, and WhatsApp notifications. It supports three user roles: administrators, partners, and clients.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React 18, TypeScript, and Vite. It utilizes shadcn/ui components, Radix UI primitives, and Tailwind CSS for styling. State management relies on TanStack Query for server state and React's built-in state for local UI. Wouter handles client-side routing, and Framer Motion is used for animations. The architecture follows a modular component structure, supports responsive design, and integrates real-time notifications via WebSockets.

### Backend Architecture
The backend is developed with Express.js and TypeScript, following a RESTful API design. It features JWT-based authentication with role-based access control (RBAC) for admin, partner, and client roles, and uses bcryptjs for password hashing. API routes are organized by feature domains, with middleware for authentication, authorization, and validation using Zod schemas. The backend also supports WebSockets for real-time notifications and file uploads.

### Database Design
PostgreSQL is the primary database, accessed via Drizzle ORM for type-safe operations. The schema, defined in TypeScript, includes tables for users, partners, projects, payment stages, tickets, notifications, and portfolio items, among others. Database migrations are managed with Drizzle Kit, and Neon's serverless PostgreSQL driver is used for connection.

### Authentication & Authorization
The system employs JWT-based authentication with tokens stored in localStorage. Role-based access control (RBAC) enforces permissions across the application. Password security is managed with bcryptjs.

### Payment Processing
The platform integrates with MercadoPago for multi-stage payment processing, allowing projects to be broken into milestones. It supports automatic payment link generation, webhook handling for status updates, and commission calculation for partners.

### Communication Systems
Communication occurs via email (Gmail SMTP), WhatsApp (Twilio API), and real-time WebSocket notifications. Email is used for account activities and project updates, while WhatsApp provides instant critical updates. WebSockets deliver real-time updates for project changes and system alerts.

### System Design Choices
The platform includes robust project management features, support for affiliate programs, and detailed financial tracking including invoices and transactions. It supports dynamic currency handling and robust error logging. A significant design choice for the local market involves a manual payment verification process using local payment methods, where clients upload proof of payment for admin verification.

## External Dependencies

-   **Database**: PostgreSQL (via Neon serverless)
-   **ORM**: Drizzle ORM
-   **Payment Gateway**: MercadoPago
-   **Email Service**: Gmail SMTP
-   **SMS/Messaging API**: Twilio (for WhatsApp)
-   **Frontend Framework**: React
-   **Build Tool**: Vite
-   **UI Library**: shadcn/ui, Radix UI
-   **Styling**: Tailwind CSS
-   **State Management**: TanStack Query
-   **Animations**: Framer Motion
-   **Routing**: Wouter
-   **Backend Framework**: Express.js
-   **Validation**: Zod
-   **Authentication**: JWT, bcryptjs
-   **Deployment**: Vercel/Netlify (frontend), generic VM (backend)