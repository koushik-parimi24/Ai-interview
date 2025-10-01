An AI-powered technical interview platform that automates the entire interview process — from generating context-aware questions to evaluating candidate answers in real time.

Built with React + Vite, Supabase, and Azure OpenAI / OpenRouter, this platform allows interviewers to host timed interviews and get instant AI-based evaluations.

🚀 Features

✅ AI-Generated Questions

6 questions per interview (2 Easy, 2 Medium, 2 Hard)

Context-aware question generation using resume parsing

📝 Resume Parsing

Extracts information from PDF/DOCX resumes to personalize questions

⏱️ Timed Interviews

Auto timer for each question (30s / 60s / 5min)

Automatic submission on timeout

💬 AI Evaluation & Feedback

Real-time answer analysis using Azure OpenAI

Fallback to OpenRouter if Azure is unavailable

🔄 Session Persistence

Auto-saves progress so candidates can resume interrupted interviews

👥 Role-Based Access

Separate interfaces for Interviewers and Interviewees

📊 Interviewer Dashboard

View candidates, performance scores, and analytics

🧰 Tech Stack
Layer	Technology
Frontend	React (Vite), Redux Toolkit, Ant Design
Backend (BaaS)	Supabase (PostgreSQL + RLS + Realtime)
AI	Azure OpenAI API / OpenRouter API
Parsing	pdfjs-dist (PDF), mammoth (DOCX)
Hosting	Vercel / Netlify (Recommended)
📂 Project Structure



<img width="174" height="333" alt="image" src="https://github.com/user-attachments/assets/ada14902-ddbf-49fb-89ce-ae9e5dc70e32" />


⚡ Getting Started
1. Clone the Repository
git clone https://github.com/koushik-parimi24/Ai-interview.git
cd Ai-interview

2. Install Dependencies
npm install

3. Set up Environment Variables

Create a .env.local file in the project root with the following keys:

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Azure OpenAI
VITE_AZURE_OPENAI_KEY=your_azure_openai_key
VITE_AZURE_OPENAI_ENDPOINT=your_azure_endpoint
VITE_AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment_name
VITE_AZURE_OPENAI_API_VERSION=2024-02-01

# OpenRouter (optional fallback)
VITE_OPENROUTER_API_KEY=your_openrouter_key


⚠️ Never commit your .env.local file to version control.

4. Run the Development Server
npm run dev


Visit http://localhost:5173
 to open the app.

🧠 AI Configuration

Primary: Azure OpenAI
Used for generating and evaluating questions in real time.

Fallback: OpenRouter
Automatically used when Azure API is unavailable.

Offline: Local Question Bank
(Optional) Provide static questions if both APIs are down.

📝 Supabase Database Setup

Create a new Supabase project

Import the provided SQL schema (/supabase/schema.sql) to create required tables

Enable Row-Level Security and configure policies for:

Candidates

Interviews

Responses

🧪 Testing

Mock AI endpoints for testing evaluation flow

Run local interviews to verify:

Timer behavior

Resume session functionality

Real-time scoring

📦 Deployment
Deploy on Vercel

Push your repo to GitHub

Import it in Vercel

Add all .env variables in the Vercel dashboard

Deploy 🚀

Deploy on Netlify

Link repo in Netlify

Set environment variables

Build command: npm run build

Publish directory: dist
