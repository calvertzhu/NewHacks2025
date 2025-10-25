# {{cookiecutter.project_name}} Frontend

Next.js frontend with React, TypeScript, and TailwindCSS for hackathon development.

## Features

- **Next.js 14** with App Router
- **React 18** with TypeScript
- **TailwindCSS** for styling
- **Redux Toolkit** for state management
- **React Hook Form** for form handling
- **Headless UI** for accessible components
- **Heroicons** for icons

## Quick Start

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── components/        # React components
│   ├── lib/               # Utilities and hooks
│   ├── authentication/    # Auth pages
│   ├── login/             # Login page
│   ├── settings/          # Settings page
│   └── page.tsx           # Home page
├── public/                # Static assets
├── package.json           # Dependencies
└── tailwind.config.ts     # TailwindCSS config
```

## Key Components

- **Authentication**: Login, magic link, password reset
- **User Management**: Profile, settings, security
- **API Integration**: Redux-based state management
- **Responsive Design**: Mobile-first with TailwindCSS

## Development

The frontend includes:
- TypeScript for type safety
- ESLint for code quality
- TailwindCSS for styling
- Redux for state management

## API Integration

The frontend connects to the FastAPI backend through:
- Redux slices for state management
- API service functions
- Authentication hooks
- Form validation with React Hook Form

## Styling

Uses TailwindCSS with:
- Responsive design utilities
- Custom color palette
- Component-based styling
- Dark mode support (optional)