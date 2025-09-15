# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server with Hydrogen and codegen
- `npm run build` - Build for production with Shopify Hydrogen and codegen
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint across TypeScript/JavaScript files
- `npm run typecheck` - Run TypeScript type checking without emitting files
- `npm run codegen` - Generate GraphQL types and schema
- `npm run deploy` - Deploy to Shopify Hydrogen hosting
- `npm run sync:env` - Sync environment variables from Shopify

### Testing
This project uses standard build and lint commands. No specific test runner is configured.

## Architecture Overview

### Tech Stack
This is a **Shopify Hydrogen** e-commerce storefront built with:
- **Remix** - Full-stack web framework for routing and server-side rendering
- **Vite** - Build tool and development server
- **TypeScript** - Type safety across the entire application
- **Tailwind CSS** - Utility-first CSS framework with custom design system
- **Shopify Storefront API** - GraphQL API for product data and cart operations
- **Shopify Customer Account API** - For user accounts and order management
- **Supabase** - Database and authentication services
- **Radix UI** - Accessible component primitives (accordion, dialog, hover-card, etc.)

### Key Directory Structure
```
app/
├── components/          # Reusable UI components
│   ├── form/           # Form-specific components (inputs, labels)
│   ├── generic/        # Generic reusable components
│   ├── icons/          # Icon components
│   ├── layout/         # Layout-specific components (tables, tabs)
│   ├── marketing/      # Marketing components (includes Crisp chat integration)
│   ├── product/        # Product-specific components
│   └── shadcn/         # shadcn/ui components (accordion, dialog, carousel)
├── routes/             # Remix file-based routing
├── utils/              # Utility functions and helpers
│   └── products/       # Product-related utilities and types
├── lib/                # Core application logic (GraphQL fragments)
├── graphql/            # GraphQL queries and mutations
└── styles/             # CSS files (Tailwind, fonts, app styles)
```

### Routing Structure
Uses Remix file-based routing with locale support:
- `($locale)._index.tsx` - Homepage
- `($locale).products.$handle.tsx` - Product detail pages
- `($locale).collections.$handle.tsx` - Collection pages
- `($locale).account.*` - Customer account pages
- `($locale).cart.tsx` - Shopping cart
- `($locale).api.*` - API routes (file upload, predictive search)

### State Management
- **Cart state** - Managed through Shopify's cart API and Hydrogen's cart utilities
- **Customer state** - Handled via Shopify Customer Account API
- **Theme/styling** - Uses Tailwind with custom design system (primary orange brand colors)

### GraphQL Integration
- GraphQL fragments are centralized in `app/lib/fragments.ts`
- Auto-generated TypeScript types in `storefrontapi.generated.d.ts` and `customer-accountapi.generated.d.ts`
- Uses Shopify's Storefront API for product data and Customer Account API for user management

### Notable Features
- **File upload** - Custom file upload functionality (see `($locale).api.file-upload.tsx`)
- **Product customization** - Support for product attributes and customization options
- **Dark mode support** - Tailwind configuration includes dark mode classes
- **Responsive design** - Custom Tailwind breakpoints and comprehensive design system
- **Analytics** - Shopify analytics integration
- **Customer chat** - Crisp chat integration for customer support

### Configuration Files
- `tailwind.config.ts` - Extensive custom design system with brand colors, typography, and animations
- `vite.config.ts` - Vite configuration with Hydrogen and Oxygen plugins
- `.eslintrc.cjs` - ESLint configuration with Hydrogen and TypeScript rules
- `server.ts` - Custom server configuration

### Environment Variables
Key environment variables (referenced in root.tsx):
- `PUBLIC_STORE_DOMAIN` - Shopify store domain
- `PUBLIC_STOREFRONT_ID` - Storefront API access token
- `PUBLIC_CHECKOUT_DOMAIN` - Checkout domain
- `MAILERLITE_ACCOUNT` - Email marketing integration
- `CRISP_WEBSITE_ID` - Customer chat widget ID
- `STORE_URL` - Store URL

### Development Notes
- Uses strict TypeScript configuration with custom type definitions in `env.d.ts`
- Implements proper error boundaries and loading states
- Critical data (header) loads first, deferred data (footer, customer) loads after
- Includes comprehensive caching strategy with Shopify's cache policies