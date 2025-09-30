AI-Powered Interview Assistant
🚀 A comprehensive, modern interview platform built with React that leverages AI to conduct technical interviews with real-time scoring and candidate management. This application provides a complete interview solution for technical hiring, featuring dual interfaces for interviewers and interviewees, AI-powered question generation, and automated scoring. Perfect for companies looking to streamline their technical interview process.

📋 Overview
This application provides a complete interview solution for technical hiring, featuring dual interfaces for interviewers and interviewees, AI-powered question generation, and automated scoring. Perfect for companies looking to streamline their technical interview process.

✨ Key Features
🎯 Core Functionality
Dual Role System: Separate interfaces for interviewers and interviewees.

Timed Interviews: 6-question format (2 easy, 2 medium, 2 hard) with time constraints.

Real-time AI Scoring: Instant feedback and scoring using the OpenRouter API and Azure OpenAI.

Resume Processing: Upload and parse PDF/DOCX resumes for context-aware questions.

Session Management: Persistent interview sessions with recovery capability.

🤖 AI-Powered Features
Smart Question Generation: Context-aware questions based on candidate profiles.

Adaptive Difficulty: Time-appropriate questions (30s easy, 60s medium, 120s hard).

Intelligent Scoring: AI evaluation with detailed feedback.

Candidate Summarization: Automated interview summaries and recommendations.

👥 User Management
Role-Based Authentication: Secure login with interviewer/interviewee roles.

Profile Management: User profiles with role persistence.

Session Recovery: Resume interrupted interviews.

Analytics Dashboard: Candidate performance tracking.

🎨 User Experience
Modern UI: Built with Ant Design for a professional appearance.

Responsive Design: Works on desktop and mobile devices.

Dark Theme: Eye-friendly dark mode interface.

Real-time Updates: Live interview progress and scoring.

🛠️ Tech Stack
Frontend
React 19: Modern React with the latest features.

Vite: Fast build tool and development server.

Redux Toolkit: State management with RTK Query.

Ant Design: Professional UI component library.

React Router: Client-side routing with protected routes.

Backend & Database
Supabase: Backend-as-a-Service with PostgreSQL.

Row Level Security (RLS): Secure data access policies.

Real-time subscriptions: Live data updates.

AI Integration
OpenRouter API: Access to multiple AI models.

Azure OpenAI: For robust and scalable AI-powered features.

Context-aware prompting: Tailored questions and scoring.

Fallback systems: Local question banks when AI is unavailable.

Document Processing
pdfjs-dist: PDF resume parsing.

mammoth: DOCX document processing.

File upload handling: Secure document management.

🚀 Quick Start
Prerequisites
Node.js 18+

npm or yarn

Supabase account

OpenRouter API key (recommended)

Azure OpenAI account and API key

Installation
Clone the repository:

Bash

git clone <repository-url>
cd interview_assistant1
Install dependencies:

Bash

npm install
Environment Setup
Create a .env.local file and add the following:

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter AI (Recommended)
VITE_OPENROUTER_API_KEY=sk-or-your-api-key
VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# Azure OpenAI Configuration
VITE_AZURE_OPENAI_ENDPOINT=your_azure_openai_endpoint
VITE_AZURE_OPENAI_KEY=your_azure_openai_key
VITE_AZURE_OPENAI_DEPLOYMENT=your_deployment_name
VITE_AZURE_OPENAI_API_VERSION=your_api_version
Database Setup
Run the SQL scripts in your Supabase dashboard to create tables and triggers.

Start Development Server
Bash

npm run dev
Open your browser and navigate to http://localhost:5173.

🔧 Configuration
AI Setup (OpenRouter & Azure OpenAI)
Create an account at OpenRouter.ai and/or Azure OpenAI.

Generate API keys.

Add them to your environment variables.

Choose a model (free options are available on OpenRouter).

Supabase Setup
Create a new Supabase project.

Set up authentication with email confirmation.

Create a profiles table with RLS policies.

Configure triggers for automatic profile creation.

Role Configuration
Interviewer: Access to candidate management and analytics.

Interviewee: Access to the interview interface and chat.

📊 Interview Flow
For Interviewees
Sign up and verify your email.

Upload your resume (optional).

Start the timed interview.

Answer 6 questions with time limits.

Receive instant AI feedback.

View your final score and a summary.

For Interviewers
Access the candidate dashboard.

Review interview sessions.

View AI-generated summaries.

Analyze candidate performance.

Make hiring decisions.

🎯 Question Types & Timing
Easy Questions (30s): Quick recall, basic concepts.

Medium Questions (60s): Explanations, practical knowledge.

Hard Questions (120s): Code implementation, problem-solving.

