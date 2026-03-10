import './AIChatPage.css';

import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

const exampleQuestions = [
  'Which immune markers are common to CODEX and IMC?',
  'How many donors are suitable for cross-modality training?',
  'What modalities are available for HPAP-013?',
];

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 13L13 1M13 1H3M13 1V11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 1V13M1 7H13" stroke="#406eb4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AIChatPage() {
  const [question, setQuestion] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!question.trim()) return;
    // TODO: dispatch query and navigate to results
  };

  const handleExampleClick = (q) => {
    setQuestion(q);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="aichat-page">
      <div className="aichat-content">
        <h1 className="aichat-heading">
          Welcome to <span className="heading-highlight">Multimodal</span> AI in T1D
        </h1>

        <div className="aichat-input-card">
          <textarea
            className="aichat-textarea"
            placeholder="Ask a question about T1D..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
          />
          <div className="aichat-input-actions">
            <button className="aichat-btn-plus" type="button" aria-label="Attach file">
              <PlusIcon />
            </button>
            <button className="aichat-btn-send" type="button" onClick={handleSubmit} aria-label="Send question">
              <SendIcon />
            </button>
          </div>
        </div>

        <div className="aichat-examples">
          <p className="aichat-examples-label">For example:</p>
          <div className="aichat-examples-grid">
            {exampleQuestions.map((q, i) => (
              <div key={i} className="aichat-example-card" onClick={() => handleExampleClick(q)}>
                <p className="aichat-example-text">{q}</p>
                <button className="aichat-example-btn" aria-label="Use this question">
                  <SendIcon />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPage;
