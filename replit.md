# Bank Reserves - FDIC Data Viewer

## Project Overview
This Next.js application allows users to search for banks and view their financial information including liquidity ratios, using the FDIC API. It provides an interactive interface to look up bank reserves and financial data.

## Project Architecture
- **Frontend**: Next.js 15.5.2 with React 19.1.0
- **Styling**: Tailwind CSS 4.0
- **TypeScript**: Full TypeScript support
- **API**: Uses FDIC public API (banks.data.fdic.gov)

## Key Features
- Bank name autocomplete search
- Financial data display (Cash & balances, Fed balances, Total liabilities)
- Liquidity ratio calculations
- Raw JSON data viewer
- Responsive design with Tailwind CSS

## Configuration Setup
- Configured for Replit environment with proper host settings
- Development server runs on port 5000 with hostname 0.0.0.0
- Deployment configured for autoscale with build and start commands

## Environment Variables
- `NEXT_PUBLIC_FDIC_API_KEY` (optional) - FDIC API key for enhanced rate limits

## Recent Changes (2025-09-09)
- Initial project import from GitHub
- Installed Node.js 20 and project dependencies
- Configured Next.js for Replit proxy environment
- Set up development workflow on port 5000
- Configured deployment for production (autoscale)
- Updated project documentation

## User Preferences
- Clean, minimal interface
- Real financial data (no mock data)
- Fast search with autocomplete