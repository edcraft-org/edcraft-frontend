# EdCraft Frontend

EdCraft is an educational tool that helps generate questions.

## Features

- **Code Analysis**: Paste algorithm code and automatically extract its structure (functions, loops, branches, variables)
- **Interactive Target Selection**: Navigate through code elements using a breadcrumb-based interface
- **Question Generation**: Generate different types of questions:
  - Multiple choice questions
  - Multiple answer questions
  - Free response questions
- **Output Types**: Focus questions on different aspects:
  - Return values
  - Variable states
  - Counts

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- ESLint

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
src/
├── components/
│   └── QuestionGenerator/
│       ├── QuestionGeneratorPage.tsx    # Main page component
│       ├── CodeInputSection.tsx         # Code input UI
│       ├── QuestionForm.tsx             # Question configuration form
│       ├── QuestionDisplay.tsx          # Generated question display
│       └── TargetSelector/              # Code element selection components
├── hooks/
│   └── useCodeAnalysis.ts               # Main state management hook
├── types/
│   └── api.types.ts                     # TypeScript type definitions
└── utils/
    └── transformTarget.ts               # Data transformation utilities
```

## How It Works

1. **Paste Code**: User pastes algorithm code into the input area
2. **Analyze**: The code is sent to the backend for structural analysis
3. **Select Target**: User navigates through code elements (functions, loops, branches) to select what to query
4. **Configure Question**: User selects:
   - Output type (return value, variable state, line count)
   - Question type (multiple choice, multiple answer, free response)
   - Test input data
5. **Generate**: A tailored practice question is generated based on the configuration

## License

MIT License - see the [LICENSE](LICENSE) file for details
