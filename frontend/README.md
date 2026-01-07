# FinTracker Frontend

React + TypeScript + Vite frontend application for FinTracker.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Component library
- **React Router** - Client-side routing
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **Lucide React** - Icons

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at http://localhost:5173

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Check for linting errors
- `npm run lint:fix` - Fix linting errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:coverage` - Generate coverage report

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (Sidebar, MainLayout)
│   └── theme-provider.tsx
├── pages/               # Route pages
│   ├── auth/            # Authentication pages
│   ├── dashboard.tsx
│   ├── transactions.tsx
│   └── ...
├── lib/                 # Utilities and helpers
├── hooks/               # Custom React hooks
├── store/               # Zustand stores
├── types/               # TypeScript types
├── tests/               # Test files
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Features (In Progress)

- User authentication
- Dashboard with financial overview
- Transaction management
- Income tracking with PAYE calculations
- Expense tracking and categorization
- Budget planning and monitoring
- Financial goals tracking
- Investment portfolio management
- Financial insights and analytics
- Dark/light theme support

## Development Guidelines

- Follow the existing code structure
- Use TypeScript for type safety
- Write tests for new features
- Follow the component composition pattern
- Use shadcn/ui components where possible
- Maintain consistent styling with Tailwind CSS

## Contributing

This is a private project. Please coordinate with the team before making changes.

## License

Private - All rights reserved
