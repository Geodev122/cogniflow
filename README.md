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

5. Generate demo data:
   ```bash
   npm run demo-data
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Demo Data

The application includes comprehensive demo data for testing:

### Therapist Accounts
- **Dr. Sarah Johnson**: `dr.sarah.johnson@cogniflow.com` / `therapist123`
- **Dr. Michael Chen**: `dr.michael.chen@cogniflow.com` / `therapist123`  
- **Dr. Emily Rodriguez**: `dr.emily.rodriguez@cogniflow.com` / `therapist123`

### Client Accounts
- **Alex Thompson**: `alex.thompson@email.com` / `client123`
- **Maria Garcia**: `maria.garcia@email.com` / `client123`
- **James Wilson**: `james.wilson@email.com` / `client123`
- **Lisa Brown**: `lisa.brown@email.com` / `client123`
- **David Lee**: `david.lee@email.com` / `client123`
- **Jennifer Davis**: `jennifer.davis@email.com` / `client123`

### Sample Data Includes
- Therapist-client relationships
- Various CBT thought record worksheets
- Different completion statuses (assigned, in_progress, completed)
- Realistic therapeutic scenarios and responses

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