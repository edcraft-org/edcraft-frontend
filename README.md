# EdCraft

EdCraft is an education assessment platform that streamlines the assessment creation process. Create reusable question templates, organize them into question template banks, and generate assessments with different inputs.

## Overview

EdCraft is designed for educators who want to create algorithm and programming questions efficiently. Instead of manually writing questions, you provide code and configuration, and EdCraft generates questions by executing the code and analyzing the execution trace.

### Key Capabilities

- **Question Generation**: Generate MCQs, MRQs, and short answer questions from algorithm code and configuration
- **Code Execution Analysis**: Execute code with custom inputs and query specific elements in the execution trace to create reusable questions
- **Template System**: Create reusable question templates that can be instantiated with different inputs
- **Question Banks**: Organize questions and templates into collections

## Core Features

### Question Builder

Generate individual questions from code with specific input data.

**Workflow:**
1. Enter your algorithm code (Python)
2. Click "Analyse Code" to parse the code structure
3. Select target elements (function call, variable, return value, etc.) as the instructions to obtain the answer
4. Configure question parameters (type, output format, number of distractors)
5. Provide input data for the algorithm
6. Generate question - EdCraft executes the code and creates the question with distractors
7. Save to a new or existing question bank

### Question Template Builder

Create reusable question templates without specifying input data.

**Workflow:**
1. Enter your algorithm code (Python)
2. Click "Analyse Code" to parse the code structure
3. Select target elements (function call, variable, return value, etc.) as the instructions to obtain the answer
4. Configure question parameters (type, output format, number of distractors)
5. Generate template preview
6. Save to a new or existing question template bank

**Benefits:**
- Create question once, use with multiple inputs
- Build comprehensive question template banks
- Mix and match templates for different assessments

### Create Questions from Templates

**Workflow:**
1. Select the question template
2. Click the options and select "Create Question"
3. Provide input data for the algorithm
4. Generate question
5. Save to a new or existing question bank

**Assessment Instantiation Process:**
When you instantiate an assessment from a template:
1. Provide title and description for the new assessment
2. Supply input data for each question template
3. EdCraft executes all templates with the provided inputs
4. Generates a complete assessment with all questions

### Resource Management

Organize all resources in a hierarchical folder structure. Organize questions and question templates into banks.

**Resource Types:**
- Folders (for organization)
- Assessments (collections of generated questions)
- Assessment Templates (collection of question templates)

**Operations:**
- Create, rename, move, and delete resources
- Search and filter (coming soon)
- Share with students (coming soon)

## Tech Stack

### Frontend Framework
- **React 19** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router v7** - Client-side routing

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** (React Query) - Server state management with caching

### Forms & Validation
- **React Hook Form** - Performant form handling
- **Zod** - TypeScript-first schema validation

### UI & Styling
- **shadcn/ui** – Reusable, accessible UI components built on Radix UI and Tailwind CSS
- **Tailwind CSS v4** - Utility-first CSS framework
- **Lucide React** - Beautiful icon library
- **Sonner** - Toast notifications

### API Integration
- **Axios** - HTTP client
- **Orval** - Automatic TypeScript API client generation from OpenAPI spec

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Backend API running (see [backend repository](https://github.com/edcraft-org/edcraft-backend))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/edcraft-org/edcraft-frontend.git
cd edcraft-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the root directory:
```env
VITE_API_BASE_URL=<backend_url>
```

4. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Type-check and build for production
- `npm run lint` - Run ESLint for code quality
- `npm run api:generate` - Generate API client from OpenAPI specification

## Project Structure

```
src/
├── api/                    # API client and configuration
│   ├── client.ts           # Generated API client
│   ├── axiosInstance.ts    # Axios configuration
│   ├── queryClient.ts      # React Query configuration
│   └── queryKeys.ts        # Query key factory
├── components/             # Shared UI components
│   ├── layout/             # Layout components (Header, Sidebar, MainLayout)
│   └── ui/                 # Reusable UI primitives (Button, Dialog, etc.)
├── features/                       # Feature-based modules
│   ├── assessments/                # Assessment management
│   ├── assessment-templates/       # Assessment template management
│   ├── folders/                    # Folder navigation and organization
│   ├── questions/                  # Question CRUD operations
│   ├── question-templates/         # Question template management
│   ├── question-builder/           # Question generation from code
│   └── question-template-builder/  # Template creation from code
├── router/              # Application routing configuration
│   ├── routes.tsx       # Route definitions with lazy loading
│   └── paths.ts         # Route path constants
├── shared/              # Shared utilities and components
│   ├── components/      # Shared feature components
│   ├── stores/          # Zustand stores
│   └── hooks/           # Custom React hooks
├── lib/                 # Utility functions
├── constants/           # Application constants
└── types/               # TypeScript type definitions
```

## API Integration

The application uses Orval to automatically generate a type-safe TypeScript API client from an OpenAPI specification.

### Regenerating the API Client

When the backend API changes:

```bash
npm run api:generate
```

This reads `orval.config.ts` and generates:
- API client methods in `src/api/client.ts`
- TypeScript types in `src/api/models/`

### API Configuration

The API base URL is configured via environment variables. Update `.env` to point to your backend:

```env
VITE_API_BASE_URL=<backend_url>
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
