# Gamified Apps Development Guide for CogniFlow

## Overview
This guide provides comprehensive information for developing gamified assessment, worksheet, exercise, and intake applications for the CogniFlow platform.

## 🎮 Framework Architecture

### Database Schema
The gamified apps framework uses 4 main tables:

1. **`gamified_apps`** - App metadata and configuration
2. **`app_sessions`** - Individual play session tracking
3. **`app_progress`** - User progress and achievements
4. **`app_analytics`** - Detailed interaction analytics

### App Types Supported
- **Assessments**: PHQ-9, GAD-7, BDI-II, etc.
- **Worksheets**: Thought records, mood trackers, etc.
- **Exercises**: Breathing, mindfulness, cognitive restructuring
- **Intake Forms**: Client onboarding and initial assessment
- **Psychoeducation**: Learning modules and interactive content

## 🛠️ Development Requirements

### Technical Stack Options
1. **Python + Streamlit** (Recommended for rapid prototyping)
2. **Python + Flask** (For more complex interactions)
3. **React** (For full integration with main app)
4. **Vanilla JavaScript** (For lightweight apps)

### Required Integration Points

#### 1. Authentication
```python
# Example Supabase auth integration
import streamlit as st
from supabase import create_client

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get current user
user = supabase.auth.get_user()
if not user:
    st.error("Please log in to continue")
    st.stop()
```

#### 2. Session Management
```python
# Start new session
def start_session(app_id: str, user_id: str):
    response = supabase.rpc('start_app_session', {
        'p_app_id': app_id,
        'p_user_id': user_id,
        'p_session_type': 'play'
    })
    return response.data  # Returns session_id

# Complete session
def complete_session(session_id: str, score: int, responses: dict, game_data: dict):
    supabase.rpc('complete_app_session', {
        'p_session_id': session_id,
        'p_score': score,
        'p_responses': responses,
        'p_game_data': game_data
    })
```

#### 3. Progress Tracking
```python
# Get user progress
def get_user_progress(user_id: str, app_id: str):
    response = supabase.table('app_progress')\
        .select('*')\
        .eq('user_id', user_id)\
        .eq('app_id', app_id)\
        .single()
    return response.data

# Update progress
def update_progress(user_id: str, app_id: str, new_data: dict):
    supabase.table('app_progress')\
        .upsert({
            'user_id': user_id,
            'app_id': app_id,
            **new_data
        })
```

#### 4. Analytics Logging
```python
# Log user interactions
def log_event(session_id: str, event_type: str, event_data: dict, user_id: str, app_id: str):
    supabase.table('app_analytics').insert({
        'session_id': session_id,
        'event_type': event_type,
        'event_data': event_data,
        'user_id': user_id,
        'app_id': app_id
    })

# Example usage
log_event(session_id, 'question_answered', {
    'question_id': 'phq9_1',
    'response': 2,
    'time_taken': 15.5
}, user_id, app_id)
```

## 🎯 App Development Templates

### Assessment App Template
```python
import streamlit as st
import time
from datetime import datetime

class AssessmentApp:
    def __init__(self, app_config):
        self.app_config = app_config
        self.session_id = None
        self.responses = {}
        self.start_time = None
        
    def initialize(self):
        # Start session tracking
        self.session_id = start_session(self.app_config['app_id'], st.session_state.user_id)
        self.start_time = datetime.now()
        
        # Initialize progress tracking
        if 'current_question' not in st.session_state:
            st.session_state.current_question = 0
            st.session_state.responses = {}
    
    def render_question(self, question):
        st.subheader(f"Question {question['id']}")
        st.write(question['text'])
        
        if question['type'] == 'scale':
            response = st.slider(
                "Your response:",
                min_value=question['scale_min'],
                max_value=question['scale_max'],
                key=f"q_{question['id']}"
            )
        elif question['type'] == 'multiple_choice':
            response = st.radio(
                "Select your answer:",
                question['options'],
                key=f"q_{question['id']}"
            )
        
        return response
    
    def calculate_score(self):
        total_score = sum(self.responses.values())
        return total_score
    
    def complete_assessment(self):
        score = self.calculate_score()
        duration = (datetime.now() - self.start_time).total_seconds()
        
        # Complete session
        complete_session(
            self.session_id,
            score,
            self.responses,
            {'completion_time': duration}
        )
        
        # Show results
        self.show_results(score)
    
    def show_results(self, score):
        st.success("Assessment Complete!")
        st.metric("Your Score", f"{score}/{self.app_config['max_score']}")
        
        # Add gamification elements
        st.balloons()
        st.write("🎉 You earned 50 XP!")
```

### Exercise App Template
```python
class ExerciseApp:
    def __init__(self, app_config):
        self.app_config = app_config
        self.game_state = {
            'level': 1,
            'score': 0,
            'achievements': []
        }
    
    def render_breathing_exercise(self):
        # Visual breathing guide
        col1, col2, col3 = st.columns([1, 2, 1])
        
        with col2:
            # Animated breathing circle
            breathing_phase = st.empty()
            
            for cycle in range(self.app_config['cycles']):
                # Inhale phase
                breathing_phase.markdown("## 🫁 Breathe In...")
                time.sleep(4)
                
                # Hold phase
                breathing_phase.markdown("## ⏸️ Hold...")
                time.sleep(4)
                
                # Exhale phase
                breathing_phase.markdown("## 💨 Breathe Out...")
                time.sleep(6)
                
                # Update progress
                self.update_progress(cycle + 1)
    
    def update_progress(self, cycles_completed):
        progress = cycles_completed / self.app_config['total_cycles']
        st.progress(progress)
        
        # Award points
        points_earned = cycles_completed * 10
        st.sidebar.metric("Points Earned", points_earned)
        
        # Check for achievements
        if cycles_completed == 5:
            st.sidebar.success("🏆 Achievement: Breathing Beginner!")
        elif cycles_completed == 20:
            st.sidebar.success("🌟 Achievement: Breathing Master!")
```

## 📊 Data Collection Standards

### Required Data Points
All apps must collect:
- **Session Data**: Start time, end time, duration
- **Performance Data**: Score, completion status, attempts
- **Interaction Data**: Click patterns, time per question, navigation
- **Progress Data**: Level progression, achievements earned

### Data Format Examples
```json
{
  "responses": {
    "phq9_1": 2,
    "phq9_2": 1,
    "phq9_3": 3
  },
  "game_data": {
    "level_completed": 1,
    "points_earned": 150,
    "achievements_unlocked": ["first_completion"],
    "time_per_question": [15.2, 12.8, 18.5],
    "interaction_count": 45
  },
  "performance_metrics": {
    "accuracy": 0.85,
    "speed": 1.2,
    "engagement_score": 0.92
  }
}
```

## 🎨 Design Guidelines

### Visual Themes Available
1. **Space Theme**: Cosmic backgrounds, planet progression, star rewards
2. **Garden Theme**: Growing plants, seasonal changes, nature sounds
3. **Detective Theme**: Mystery solving, evidence collection, case files
4. **Gym Theme**: Workout metaphors, strength building, personal records
5. **Adventure Theme**: Quest progression, treasure hunting, exploration

### Gamification Elements
- **Points System**: Base points + bonus multipliers
- **Level Progression**: XP-based advancement
- **Achievements**: Milestone-based unlocks
- **Streaks**: Daily/weekly activity tracking
- **Leaderboards**: Anonymous competition
- **Badges**: Visual progress indicators

## 🔧 Development Workflow

### 1. Planning Phase
- Define app objectives and target outcomes
- Choose appropriate theme and gamification elements
- Design data collection strategy
- Plan integration points with CogniFlow

### 2. Development Phase
- Set up development environment
- Implement core functionality
- Add gamification layer
- Integrate with Supabase backend
- Test data flow and analytics

### 3. Testing Phase
- Unit testing for all functions
- Integration testing with CogniFlow
- User acceptance testing
- Performance and accessibility testing
- Clinical validation (for assessments)

### 4. Deployment Phase
- Deploy to staging environment
- Final integration testing
- Production deployment
- Monitor analytics and user feedback

## 📋 App Submission Requirements

### Code Requirements
- Clean, documented code
- Error handling and validation
- Responsive design
- Accessibility compliance
- Performance optimization

### Documentation
- User guide and instructions
- Technical documentation
- Data collection specification
- Clinical validation (if applicable)

### Testing Evidence
- Test results and coverage reports
- User feedback and iterations
- Performance benchmarks
- Security audit results

## 🚀 Getting Started

### Environment Setup
```bash
# Python environment
pip install streamlit supabase python-dotenv

# Environment variables
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

### Basic App Structure
```
my_assessment_app/
├── app.py                 # Main application file
├── config.py             # App configuration
├── components/           # Reusable components
│   ├── auth.py          # Authentication helpers
│   ├── database.py      # Database operations
│   └── gamification.py  # Gamification logic
├── assets/              # Images, sounds, etc.
├── tests/               # Test files
└── requirements.txt     # Dependencies
```

### Next Steps
1. Choose your first app to develop
2. Review the appropriate template above
3. Set up your development environment
4. Start with a simple prototype
5. Integrate with the CogniFlow backend
6. Test thoroughly before submission

## 📞 Support
For development support and questions:
- Review existing apps in the Resource Library
- Check the database schema documentation
- Test integration with the provided helper functions
- Submit apps for review when ready

Remember: Focus on user experience, clinical validity, and seamless integration with the CogniFlow ecosystem.