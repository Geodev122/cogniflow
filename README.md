# CogniFlow - CBT Practice Management Application

A modern web application for managing Cognitive Behavioral Therapy (CBT) practice, connecting therapists and clients through digital worksheets and progress tracking.

## Features

- **Dual User Roles**: Separate dashboards for therapists and clients
- **CBT Worksheets**: Interactive thought record exercises
- **Progress Tracking**: Monitor worksheet completion and client progress
- **Secure Authentication**: Role-based access control
- **Real-time Updates**: Live synchronization of worksheet data

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key.

4. Run database migrations (handled automatically by Supabase)

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

### Tables
- `profiles`: User profiles with role-based information
- `therapist_client_relations`: Links therapists to their clients
- `cbt_worksheets`: CBT worksheet assignments and responses

### Security
- Row Level Security (RLS) enabled on all tables
- Role-based access policies
- Secure authentication via Supabase Auth

## Usage

### For Therapists
1. Log in with therapist credentials
2. Complete your professional profile setup
3. Add clients to your roster
4. Assign CBT worksheets and assessments
5. Monitor client progress and engagement

### For Clients  
1. Log in with client credentials
2. Complete assigned worksheets and assessments
3. Engage with therapeutic exercises
4. Track your progress over time

## Getting Started

### First Time Setup
1. **Register** as either a therapist or client
2. **Therapists**: Complete the comprehensive onboarding process
3. **Clients**: Wait for your therapist to add you to their roster
4. **Begin** your therapeutic journey with evidence-based tools

### For Therapists
2. View client roster and progress statistics
3. Assign new CBT worksheets to clients
4. Monitor worksheet completion status

### For Clients  
1. Log in with client credentials
2. View assigned worksheets
3. Complete thought record exercises
4. Track personal progress over time

## CBT Thought Record Worksheet

The application features a comprehensive thought record worksheet that guides users through:

1. **Situation Description**: Context and circumstances
2. **Automatic Thoughts**: Initial emotional reactions
3. **Emotion Identification**: Naming and rating feelings
4. **Evidence Evaluation**: Supporting and contradicting evidence
5. **Balanced Thinking**: Developing more realistic perspectives
6. **Outcome Assessment**: New emotions and intensity levels

## Development

### Project Structure
```
src/
├── components/     # Reusable UI components
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries and configurations
├── pages/         # Route components
└── types/         # TypeScript type definitions
```

### Key Components
- `useAuth`: Authentication and user management
- `Layout`: Common page structure
- `ProtectedRoute`: Route access control
- Dashboard components for therapists and clients

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.