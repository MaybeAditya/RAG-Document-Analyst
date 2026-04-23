<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
# 📄 RAG Document Analyst

A full-stack Retrieval-Augmented Generation (RAG) application that allows users to upload complex PDF documents and query them using natural language. 

## 🧠 Architecture & Tech Stack

This project implements a complete vector-search pipeline to prevent AI hallucinations and ground responses strictly in the provided document context.

* **Frontend:** React.js (Vite)
* **Backend:** Node.js, Express.js
* **Vector Database:** Pinecone (Cosine Similarity Search)
* **LLM & Embeddings:** Google Gemini API (`gemini-2.5-flash` & `gemini-embedding-2`)
* **Document Processing:** `pdf-extraction`

## ✨ Core Features
* **Semantic Search:** Converts document chunks into 768-dimensional vector embeddings for highly accurate context retrieval.
* **Data Sanitization:** Implements strict type-casting and invisible-character stripping to ensure pristine data ingestion into the vector database.
* **Rate-Limit Handling:** Custom UI timers and explicit error handling for API quota limits.
* **In-Memory Processing:** Uses `multer` memory storage to process PDFs without writing temporary files to the disk.

## 🚀 Local Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/YourUsername/RAG-Document-Analyst.git](https://github.com/YourUsername/RAG-Document-Analyst.git)
Setup the Backend:

Bash
cd backend
npm install
Create a .env file in the backend directory and add your API keys:

Code snippet
GEMINI_API_KEY=your_gemini_api_key
PINECONE_API_KEY=your_pinecone_api_key
Start the backend server:

Bash
node server.js
Setup the Frontend:
Open a new terminal and navigate to the frontend:

Bash
cd frontend
npm install
npm run dev
💡 How it Works (The RAG Pipeline)
Extraction: The Node.js backend strips raw text from the uploaded PDF and splits it into manageable chunks.

Embedding: The Gemini Embedding model translates these text chunks into numerical arrays (vectors).

Storage: The vectors and their corresponding text metadata are upserted into a Pinecone index.

Retrieval: When a user asks a question, the query is vectorized and compared against the database using cosine similarity to find the most relevant document chunks.

Generation: The retrieved context is injected into the Gemini LLM alongside the user's prompt to generate a highly accurate, context-aware answer.


### Next Steps to Push Your Code
Since you are splitting this into two deployments (Frontend on Vercel, Backend on Render), the cleanest way to handle this for your portfolio is a **Monorepo setup**. 

1. Move your `frontend` folder and your `backend` folder into one master folder called `RAG-Document-Analyst`.
2. Open your terminal inside that master folder.
3. Run these commands to push everything up to your new professional repo:

```bash
git init
git add .
git commit -m "Initial commit: Full-stack RAG implementation"
git branch -M main
git remote add origin https://github.com/MaybeAditya/RAG-Document-Analyst.git
git push -u origin main
```
Make sure to replace MaybeAditya with your actual GitHub username 
>>>>>>> 58bda609e037d0f9d5be7ee759c3bc19f194e36f
