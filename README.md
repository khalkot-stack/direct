# Welcome to your Dyad app

This is a fresh React application with TypeScript, Tailwind CSS, and Shadcn/ui.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:8080` to see the application.

## Supabase Setup

Since you've reset your database, you'll need to:

1.  **Set up your Supabase project:**
    *   Go to your Supabase dashboard and create a new project.
    *   Copy your `Project URL` and `Anon Key` from `Project Settings > API`.

2.  **Create a `.env` file:**
    *   In the root of your project, create a file named `.env`.
    *   Add your Supabase credentials to this file:
        ```
        VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
        VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```
    *   Replace `"YOUR_SUPABASE_URL"` and `"YOUR_SUPABASE_ANON_KEY"` with your actual keys.

3.  **Run SQL scripts (Optional, but recommended for full functionality):**
    *   You will need to recreate your database schema (tables, RLS policies, functions, etc.) in your Supabase project. You can use the SQL scripts provided in the original codebase or create new ones based on your application's needs.

4.  **Rebuild the app:**
    ```bash
    npm run build
    ```
    Then, you can preview it with `npm run preview`.

## Project Structure

*   `src/`: Contains all application source code.
    *   `src/pages/`: React components for different routes/pages.
        *   **Passenger Pages:** `PassengerHome.tsx` (for requesting rides), `PassengerMyRidesPage.tsx` (for ride history).
        *   **Driver Pages:** `DriverHome.tsx` (central page for available and current rides), `DriverAcceptedRidesPage.tsx` (for accepted ride history).
        *   **Admin Pages:** `AdminDashboard.tsx` (main layout for admin), `OverviewPage.tsx`, `UserManagementPage.tsx`, `RideManagementPage.tsx`, `SettingsPage.tsx`.
    *   `src/components/`: Reusable UI components.
    *   `src/lib/`: Utility functions and configurations (e.g., `supabase.ts`).
    *   `src/hooks/`: Custom React hooks.
    *   `src/globals.css`: Global Tailwind CSS styles.
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `vite.config.ts`: Vite build tool configuration.

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the app for production.
*   `npm run lint`: Lints the project files.
*   `npm run preview`: Serves the production build locally.