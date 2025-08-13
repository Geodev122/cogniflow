# CogniFlow - CBT Practice Management Application

A comprehensive web application for managing Cognitive Behavioral Therapy (CBT) practice, connecting therapists and clients through digital worksheets, psychometric assessments, and progress tracking.

## 🌟 Features

### For Therapists
- **Client Management** - Complete roster management with detailed profiles
- **Case Files System** - Comprehensive case tracking with assessment history
- **10+ Psychometric Assessments** - Evidence-based screening tools (PHQ-9, GAD-7, BDI-II, etc.)
- **CBT Worksheets** - Interactive thought record exercises
- **Therapeutic Exercises** - Gamified breathing, mindfulness, and cognitive restructuring
- **Progress Monitoring** - Visual analytics and trend tracking
- **Professional Onboarding** - Complete therapist profile setup
- **Treatment Planning** - AI-assisted treatment recommendations

### For Clients
- **Personal Dashboard** - Overview of assigned activities and progress
- **Interactive Worksheets** - Step-by-step CBT thought record completion
- **Psychometric Forms** - Self-assessment questionnaires with instant scoring
- **Therapeutic Games** - Engaging exercises for skill building
- **Progress Visualization** - Charts showing therapeutic journey
- **Real-time Updates** - Live synchronization with therapist assignments

## 🏗️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Authentication**: Supabase Auth with role-based access

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cogniflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Fill in your Supabase URL and anon key in the `.env` file.

4. **Run database migrations**
   The migrations are handled automatically by Supabase when you connect.

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:5173`

## 📊 Database Schema

### Core Tables
- **`profiles`** - User profiles with role-based information (therapist/client)
- **`therapist_client_relations`** - Links therapists to their clients
- **`client_profiles`** - Extended client information and clinical notes
- **`cbt_worksheets`** - CBT worksheet assignments and responses
- **`psychometric_forms`** - Assessment forms and scoring
- **`therapeutic_exercises`** - Interactive exercises and progress
- **`progress_tracking`** - Longitudinal progress data
- **`assessment_reports`** - Generated clinical reports
- **`appointments`** - Session scheduling and management

### Security Features
- **Row Level Security (RLS)** enabled on all tables
- **Role-based access policies** - Therapists and clients see only their data
- **Secure authentication** via Supabase Auth
- **Audit logging** for compliance and tracking

## 🧠 Psychometric Assessments

### Depression & Mood
- **PHQ-9** - Patient Health Questionnaire (Depression)
- **BDI-II** - Beck Depression Inventory

### Anxiety & Stress
- **GAD-7** - Generalized Anxiety Disorder Scale
- **BAI** - Beck Anxiety Inventory
- **PSS-10** - Perceived Stress Scale

### Trauma & PTSD
- **PCL-5** - PTSD Checklist for DSM-5

### Wellbeing & Resilience
- **SWLS** - Satisfaction with Life Scale
- **CD-RISC-10** - Connor-Davidson Resilience Scale
- **MAAS** - Mindful Attention Awareness Scale
- **MBI** - Maslach Burnout Inventory

## 🎮 Therapeutic Exercises

### Interactive Games
- **Breathing Exercises** - Guided breathing with visual feedback
- **Mindfulness Sessions** - Structured meditation practices
- **Cognitive Restructuring** - Thought challenging scenarios
- **Progress Tracking** - Gamified achievement system

## 📱 Usage

### First Time Setup

#### For Therapists
1. **Register** with therapist role
2. **Complete onboarding** - Professional profile, credentials, practice details
3. **Add clients** to your roster by email
4. **Assign assessments** and worksheets
5. **Monitor progress** through the analytics dashboard

#### For Clients
1. **Register** with client role
2. **Wait for therapist** to add you to their roster
3. **Complete assigned** worksheets and assessments
4. **Engage with exercises** and track your progress
5. **View your journey** through progress charts

### Daily Workflow

#### Therapist Dashboard
- **Overview** - Quick stats and priority tasks
- **Client Management** - Add/edit client profiles
- **Case Files** - Detailed client history and assessments
- **Assessment Tools** - Assign and review psychometric tests
- **Progress Monitoring** - Track client improvements

#### Client Dashboard
- **Overview** - Recent assignments and quick actions
- **Worksheets** - Complete CBT thought records
- **Assessments** - Take assigned psychological tests
- **Exercises** - Play therapeutic games
- **Progress** - View personal improvement charts

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── therapist/      # Therapist-specific components
│   └── client/         # Client-specific components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and configurations
├── pages/              # Route components
└── types/              # TypeScript type definitions
```

### Key Components
- **`useAuth`** - Authentication and user management
- **`useClientData`** - Client data fetching and management
- **`Layout`** - Common page structure
- **`ProtectedRoute`** - Route access control
- **Dashboard components** for therapists and clients

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure these are set in your production environment:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_SUPABASE_FUNCTIONS_URL` - Base URL for your Supabase Edge Functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Add loading states for better UX
- Follow the existing code structure

## 📋 Recent Updates

### Latest Features
- ✅ **Case Files System** - Comprehensive client case management
- ✅ **10+ Psychometric Assessments** - Professional screening tools
- ✅ **Automated Scoring** - Instant assessment results and interpretation
- ✅ **Clinical Reports** - Auto-generated narrative reports
- ✅ **Progress Analytics** - Visual progress tracking charts
- ✅ **Therapeutic Games** - Interactive exercises for skill building
- ✅ **Error Handling** - Robust error recovery for RLS policy issues

### Bug Fixes
- 🔧 Fixed infinite recursion in RLS policies
- 🔧 Improved error handling in data fetching
- 🔧 Enhanced loading states and user feedback
- 🔧 Resolved component import issues

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@cogniflow.com or create an issue in this repository.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Powered by [Supabase](https://supabase.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)