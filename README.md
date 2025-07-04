# Codex App

A simple content management app built with Expo.

## Installation

1. **Install Node.js** – the latest LTS release (Node 18+) works well with Expo.
2. **Install dependencies**
   ```bash
   npm install
   ```
   The repository includes an `.npmrc` file so legacy peer dependencies install without errors.
3. **Available scripts**
   - `npm run dev` – start the Expo development server.
   - `npm run build:web` – bundle the project for the web platform.
   - `npm run lint` – run the linter using the repo's ESLint config.

## Environment Variables

Create a `.env` file at the project root with your Supabase credentials:

```bash
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are used by the Expo app while `SUPABASE_SERVICE_ROLE_KEY` is required when deploying Supabase functions.

## Running the Expo App

Start the development server:

```bash
npm run dev
```

Expo Developer Tools will open in your browser. Scan the QR code with Expo Go or launch an emulator to view the app. Press `w` in the terminal to open the web version.

## Deploying Supabase Functions

The project contains edge functions under `supabase/functions`. Deploy them using the Supabase CLI:

```bash
supabase functions deploy ai-suggestions --env-file .env
supabase functions deploy schedule-publisher --env-file .env
```

Ensure your `.env` file contains the credentials listed above or configure secrets within your Supabase project before deployment.
