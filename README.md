# AI Lawyer Assistant & Case Analyzer

An advanced legal-tech web application that helps lawyers, judges, and clerks analyze legal documents, find similar cases, and get AI-powered legal insights.

## 🚀 Features

- **Document Analysis**: Upload and analyze legal documents (PDF, DOCX)
- **Case Similarity Search**: Find similar past judgments using vector embeddings
- **AI-Powered Chat**: Get answers to legal questions with context-aware AI
- **Role-Based Access**: Different interfaces for clerks, lawyers, and judges
- **Case Management**: Organize and track legal cases with ease

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Vector Search**: Supabase pgvector
- **AI**: OpenAI GPT-4
- **Document Processing**: pdf-parse, Tesseract OCR (for future implementation)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key
- Clerk account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ai-lawyer-assistant.git
   cd ai-lawyer-assistant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. Set up your Supabase database:
   - Create a new Supabase project
   - Enable the `pgvector` extension
   - Run the SQL migrations from `supabase/migrations`

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
src/
├── app/                    # App router
│   ├── api/                # API routes
│   ├── components/         # Reusable components
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static files
└── types/                  # TypeScript type definitions
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js for the amazing framework
- Supabase for the awesome backend services
- OpenAI for the powerful AI models
- Clerk for the seamless authentication
