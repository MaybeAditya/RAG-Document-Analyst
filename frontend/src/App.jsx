import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  
  // UI States
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [delayMessage, setDelayMessage] = useState("");
  
  // Custom Modal State
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "" });
  
  // Auto-scroll reference for chat
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, isAsking, delayMessage]);

  const showModal = (title, message) => setModal({ isOpen: true, title, message });
  const closeModal = () => setModal({ isOpen: false, title: "", message: "" });

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return showModal("Action Required", "Please select a PDF file first.");
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", file);

    try {
      const response = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      if (response.ok) {
        showModal("Upload Successful! 🎉", data.message);
      } else {
        showModal("Upload Failed", data.error || "Something went wrong.");
      }
    } catch (error) {
      showModal("Connection Error", "Error uploading file. Make sure your backend server is running!");
    }
    setIsUploading(false);
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    const newChat = [...chatHistory, { role: "user", text: question }];
    setChatHistory(newChat);
    setQuestion("");
    setIsAsking(true);
    setDelayMessage("");

    const timeoutId = setTimeout(() => {
      setDelayMessage("The AI is taking a little longer than usual due to free-tier limits. Hang tight! ⏳");
    }, 6000);

    try {
      const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });
      const data = await response.json();
      
      clearTimeout(timeoutId);

      if (response.ok) {
        setChatHistory([...newChat, { role: "ai", text: data.answer }]);
      } else {
        // UPDATED: Explicitly mention Gemini API limits instead of a vague error
        setChatHistory([...newChat, { role: "ai", text: `⚠️ Gemini API is currently slow or overloaded due to free-tier rate limits. Please wait about 30 seconds and try asking again!` }]);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      // UPDATED: Explicit network/server error
      setChatHistory([...newChat, { role: "ai", text: "⚠️ Gemini is taking too long to respond or the backend server disconnected. Please try again." }]);
    }
    
    setIsAsking(false);
    setDelayMessage("");
  };

  return (
    <div style={{ maxWidth: "700px", margin: "40px auto", fontFamily: "system-ui, -apple-system, sans-serif", color: "#333", position: "relative" }}>
      
      {/* CUSTOM MODAL */}
      {modal.isOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000,
          display: "flex", justifyContent: "center", alignItems: "center"
        }}>
          <div style={{
            background: "white", padding: "30px", borderRadius: "12px",
            maxWidth: "400px", width: "90%", boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
            textAlign: "center"
          }}>
            <h2 style={{ marginTop: 0, color: "#1a1a1a" }}>{modal.title}</h2>
            <p style={{ color: "#555", lineHeight: "1.5", marginBottom: "25px" }}>{modal.message}</p>
            <button 
              onClick={closeModal}
              style={{
                background: "#007BFF", color: "white", padding: "10px 25px",
                border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem"
              }}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "10px", color: "#1a1a1a" }}>📄 AI Document Analyst</h1>
        <p style={{ fontSize: "1.1rem", color: "#555", lineHeight: "1.5" }}>
          Turn any long PDF into a conversation. This tool uses AI to read your document and instantly answer your questions about it.
        </p>
      </div>

      {/* UPDATED: Theory / Architecture Section (Always Visible) */}
      <div style={{ background: "#e9ecef", padding: "20px", borderRadius: "10px", marginBottom: "25px", border: "1px solid #ced4da", fontSize: "0.95rem" }}>
        <h3 style={{ marginTop: 0, color: "#212529" }}>🧠 Under the Hood: RAG Architecture</h3>
        <p style={{ lineHeight: "1.5" }}>This app doesn't just guess answers; it uses <strong>Retrieval-Augmented Generation (RAG)</strong> to read and fetch factual data from your exact document.</p>
        <ul style={{ paddingLeft: "20px", margin: "10px 0", lineHeight: "1.6", color: "#444" }}>
          <li><strong>1. Extraction:</strong> The Node.js backend strips raw text from your PDF and splits it into chunks.</li>
          <li><strong>2. Vector Embeddings:</strong> Google's <em>Gemini API</em> translates the text chunks into 768-dimensional numerical arrays (vectors) that capture mathematical semantic meaning.</li>
          <li><strong>3. Vector Database:</strong> These arrays are stored in a cloud-based <em>Pinecone Vector Database</em>.</li>
          <li><strong>4. Semantic Search:</strong> When you ask a question, it gets vectorized too. Pinecone performs cosine similarity calculations to fetch the exact document chunks that answer your question.</li>
          <li><strong>5. AI Generation:</strong> The retrieved chunks are injected into the <em>Gemini LLM</em> alongside your question, generating a highly accurate, hallucination-free response!</li>
        </ul>
      </div>

      {/* Free Tier Disclaimer */}
      <div style={{ background: "#FFF3CD", border: "1px solid #FFEEBA", color: "#856404", padding: "12px", borderRadius: "8px", marginBottom: "25px", fontSize: "0.95rem", textAlign: "center" }}>
        <strong>Note:</strong> This application runs on a free-tier AI API. Responses may take a few extra seconds, and you might occasionally need to wait a minute if we hit our rate limits.
      </div>

      {/* Upload Section */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "25px", padding: "15px", background: "#fff", border: "1px solid #ccc", borderRadius: "8px", alignItems: "center" }}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} style={{ flex: 1 }} />
        <button 
          onClick={handleUpload} 
          disabled={isUploading}
          style={{
            background: isUploading ? "#ccc" : "#28a745", color: "white", padding: "10px 20px", 
            border: "none", borderRadius: "5px", cursor: isUploading ? "not-allowed" : "pointer", fontWeight: "bold"
          }}
        >
          {isUploading ? "⏳ Extracting & Saving..." : "🚀 Upload & Analyze"}
        </button>
      </div>

      {/* Chat Section */}
      <div style={{ 
        height: "400px", overflowY: "scroll", border: "1px solid #ccc", 
        borderRadius: "8px", padding: "20px", marginBottom: "15px", background: "#fafafa"
      }}>
        {chatHistory.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888", marginTop: "120px" }}>
            <p>No messages yet. Upload a document and start asking questions!</p>
          </div>
        ) : (
          chatHistory.map((msg, index) => (
            <div key={index} style={{ textAlign: msg.role === "user" ? "right" : "left", margin: "15px 0" }}>
              <span style={{ 
                background: msg.role === "user" ? "#007BFF" : "#E2E3E5", 
                color: msg.role === "user" ? "white" : "black",
                padding: "12px 16px", borderRadius: "15px", display: "inline-block",
                maxWidth: "80%", lineHeight: "1.4", boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                textAlign: "left"
              }}>
                {msg.text}
              </span>
            </div>
          ))
        )}

        {isAsking && (
          <div style={{ textAlign: "left", margin: "15px 0" }}>
            <span style={{ 
              background: "#E2E3E5", color: "#666", fontStyle: "italic",
              padding: "12px 16px", borderRadius: "15px", display: "inline-block"
            }}>
              Thinking... 🤔
            </span>
          </div>
        )}
        
        {delayMessage && (
          <div style={{ textAlign: "center", margin: "10px 0", fontSize: "0.85rem", color: "#d9534f" }}>
            {delayMessage}
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Section */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input 
          type="text" 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()} 
          placeholder="Ask something about the document..." 
          disabled={isAsking}
          style={{ flex: 1, padding: "15px", border: "1px solid #ccc", borderRadius: "5px", fontSize: "1rem" }}
        />
        <button 
          onClick={handleAskQuestion} 
          disabled={isAsking}
          style={{ 
            padding: "12px 25px", background: isAsking ? "#ccc" : "#007BFF", 
            color: "white", border: "none", borderRadius: "5px", 
            cursor: isAsking ? "not-allowed" : "pointer", fontWeight: "bold"
          }}
        >
          Ask
        </button>
      </div>

      {/* Footer Section */}
      <div style={{ 
        textAlign: "center", 
        marginTop: "40px", 
        paddingTop: "20px", 
        borderTop: "1px solid #eee", 
        color: "#888", 
        fontSize: "0.9rem" 
      }}>
        Built with ❤️ by Aditya
      </div>

    </div>
  );
}

export default App;