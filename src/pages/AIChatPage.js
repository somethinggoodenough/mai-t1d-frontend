import './AIChatPage.css';

import React, { useEffect, useRef, useState } from 'react';

const exampleQuestions = [
  'Which immune markers are common to CODEX and IMC?',
  'How many donors are suitable for cross-modality training?',
  'What modalities are available for HPAP-013?',
];

const WHAT_TO_ASK_GROUPS = [
  {
    title: 'Donor-Level Filtering',
    prompts: [
      'Which donors have disease duration > 10 years?',
      'Which donors have onset age < 18 AND disease duration > 5 years?',
    ],
  },
  {
    title: 'Modality Coverage & Intersection',
    prompts: [
      'What modalities are available for HPAP-013?',
      'Which donors have RNA + protein + spatial data simultaneously?',
    ],
  },
  {
    title: 'Marker / Feature-Level Queries',
    prompts: [
      'What markers are measured in Flow cytometry?',
      'Which markers are shared between CITE-seq and Flow cytometry?',
    ],
  },
];

const MOCK_STEPS = [
  {
    label: 'Goal',
    text: 'Find immune markers that appear in both CODEX and IMC datasets/panels, and return the intersection with traceable evidence.',
  },
  {
    label: 'Interpret the question',
    text: '"Common to CODEX and IMC" = markers that exist in both marker lists (not necessarily the same antibody clone, but same biological target). "Immune markers" = markers primarily used to identify immune lineages or immune states (e.g., CD45, CD3, CD4, CD8, CD20, CD68, FOXP3).',
  },
  {
    label: 'Gather marker lists',
    text: 'Retrieve the CODEX panel / dataset marker list (panel documentation or dataset metadata). Example CODEX immune profile panels commonly include CD8, CD68, CD3e, CD20. Retrieve the IMC panel / dataset marker list (panel documentation or study methods). IMC studies often list immune markers such as CD45, CD3, CD4, CD8a, FoxP3, CD20, CD68, CD11c.',
  },
  {
    label: 'Compute the intersection',
    text: 'Cross-check at least one source showing markers used across both modalities (e.g., papers analyzing both IMC and CODEX often use CD3, CD4, CD8 as shared T-cell markers).',
  },
  {
    label: 'Reporting with verification links',
    text: 'Output "shared markers" + "how to verify" (links to panel/dataset lists).',
  },
];

const MOCK_ANSWER_ITEMS = [
  {
    text: 'CD3 (T cells) - often appears as CD3 or CD3e in CODEX panels and CD3 in IMC marker lists.',
    sources: ['Source 1'],
  },
  {
    text: 'CD8 (cytotoxic T cells) - frequently listed as CD8 or CD8a.',
    sources: ['Source 2'],
  },
  {
    text: 'CD20 (B cells) - common lineage marker across both modalities.',
    sources: ['Source 3'],
  },
  {
    text: 'CD68 (macrophages / myeloid cells) - widely used immune marker in both CODEX and IMC.',
    sources: ['Source 4'],
  },
  {
    text: 'FOXP3 (Tregs) - appears in many IMC immune lists and is also used in CODEX contexts (panel-dependent).',
    sources: ['Source 6'],
  },
  {
    text: 'CD4 (helper T cells) - commonly included in IMC immune panels and is also a shared marker when comparing CODEX/IMC analyses.',
    sources: ['Source 7'],
  },
];

const STEP_DELAY_MS = 1200;

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

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 10.5L8 15L16.5 5.5" stroke="#406eb4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon() {
  return <div className="aichat-spinner" />;
}

function CaretIcon() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1 1L4 4L7 1" stroke="#86837E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M7.25 2.25H8.75C9.99264 2.25 11 3.25736 11 4.5C11 5.74264 9.99264 6.75 8.75 6.75H7.25" stroke="#37352F" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.75 9.75H3.25C2.00736 9.75 1 8.74264 1 7.5C1 6.25736 2.00736 5.25 3.25 5.25H4.75" stroke="#37352F" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4.25 7.5L7.75 4.5" stroke="#37352F" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function AIChatPage() {
  const [question, setQuestion] = useState('');
  const [view, setView] = useState('idle');
  const [submittedQuestion, setSubmittedQuestion] = useState('');
  const [completedCount, setCompletedCount] = useState(0);
  const [isThinking, setIsThinking] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const [isWhatToAskOpen, setIsWhatToAskOpen] = useState(false);
  const timerRefs = useRef([]);
  const inputRef = useRef(null);

  useEffect(() => () => {
    timerRefs.current.forEach(clearTimeout);
  }, []);

  const startMockFlow = (q) => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setHasPrompted(true);
    setIsWhatToAskOpen(false);
    setSubmittedQuestion(q);
    setQuestion('');
    setView('chat');
    setCompletedCount(0);
    setIsThinking(true);
    MOCK_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setCompletedCount(i + 1);
        if (i === MOCK_STEPS.length - 1) setIsThinking(false);
      }, (i + 1) * STEP_DELAY_MS);
      timerRefs.current.push(t);
    });
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    startMockFlow(question.trim());
  };

  const handleClearHistory = () => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    setQuestion('');
    setSubmittedQuestion('');
    setCompletedCount(0);
    setIsThinking(false);
    setIsWhatToAskOpen(false);
    setView(hasPrompted ? 'empty' : 'idle');
  };

  const toggleWhatToAsk = () => {
    setIsWhatToAskOpen((current) => !current);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderWhatToAskContent = (className) => (
    <div id="aichat-what-to-ask-groups" className={className}>
      <h2 className="aichat-what-to-ask-title">What to Ask</h2>
      <div className="aichat-what-to-ask-groups">
        {WHAT_TO_ASK_GROUPS.map((group) => (
          <div key={group.title} className="aichat-what-to-ask-group">
            <p className="aichat-what-to-ask-group-title">{group.title}</p>
            <div className="aichat-what-to-ask-cards">
              {group.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="aichat-what-to-ask-card"
                  onClick={() => startMockFlow(prompt)}
                >
                  <span className="aichat-what-to-ask-card-text">{prompt}</span>
                  <span className="aichat-what-to-ask-card-icon">
                    <SendIcon />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const visibleStepCount = isThinking ? completedCount + 1 : completedCount;
  const showFinalAnswer = view === 'chat' && !isThinking && completedCount === MOCK_STEPS.length;

  // ── FIRST LOAD VIEW ───────────────────────────────────────────
  if (view === 'idle') {
    return (
      <div className="aichat-page">
        <div className="aichat-content">
          <h1 className="aichat-heading">
            Welcome to <span className="heading-highlight">Multimodal</span> AI in T1D
          </h1>

          <div className="aichat-input-card">
            <textarea
              ref={inputRef}
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
                <div key={i} className="aichat-example-card" onClick={() => setQuestion(q)}>
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

  if (view === 'empty') {
    return (
      <div className="aichat-page aichat-page--empty">
        <div className="aichat-empty-shell">
          <div className="aichat-empty-main">
            <h1 className="aichat-empty-heading">
              Welcome to <span className="heading-highlight">Multimodal</span> AI in T1D
            </h1>

            <div className="aichat-empty-bottom-row">
              <div className="aichat-chat-bottom aichat-chat-bottom--empty">
                <div className="aichat-input-card">
                  <textarea
                    ref={inputRef}
                    className="aichat-textarea"
                    placeholder="Ask me anything about your data ..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                  />
                  <div className="aichat-input-actions">
                    <button className="aichat-btn-plus" type="button" aria-label="Attach file">
                      <PlusIcon />
                    </button>
                    <button
                      className="aichat-btn-send"
                      type="button"
                      onClick={handleSubmit}
                      aria-label="Send question"
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </div>

              <aside className="aichat-what-to-ask-panel">
                <button
                  className="aichat-what-to-ask-cta aichat-what-to-ask-cta--outline"
                  type="button"
                  onClick={toggleWhatToAsk}
                  aria-expanded={isWhatToAskOpen}
                  aria-controls="aichat-what-to-ask-groups"
                >
                  What to Ask
                </button>

                {isWhatToAskOpen ? renderWhatToAskContent('aichat-what-to-ask-content aichat-what-to-ask-content--floating') : null}
              </aside>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CHAT VIEW ──────────────────────────────────────────────────
  return (
    <div className="aichat-page aichat-page--chat">
      <div className="aichat-chat-messages">
        <div className="aichat-user-bubble-row">
          <div className="aichat-user-bubble">{submittedQuestion}</div>
        </div>

        <div className="aichat-ai-area">
          {!showFinalAnswer && isThinking && (
            <div className="aichat-thinking-row">
              <div className="aichat-thinking-dot" />
              <span className="aichat-thinking-label">Thinking...</span>
            </div>
          )}

          {!showFinalAnswer ? (
            <div className="aichat-steps-list">
              {MOCK_STEPS.slice(0, visibleStepCount).map((step, i) => (
                <div key={i} className="aichat-step-row">
                  <div className="aichat-step-icon">
                    {i < completedCount ? <CheckIcon /> : <SpinnerIcon />}
                  </div>
                  <p className="aichat-step-text">
                    <span className="aichat-step-label">{step.label}: </span>
                    {step.text}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="aichat-answer-block">
              <div className="aichat-answer-header">
                <div className="aichat-thinking-dot" />
                <span className="aichat-answer-title">Thought</span>
                <span className="aichat-answer-caret">
                  <CaretIcon />
                </span>
              </div>

              <div className="aichat-answer-body">
                <p className="aichat-answer-intro">
                  Shared immune markers commonly present in both CODEX and IMC panels include:
                </p>

                <div className="aichat-answer-items">
                  {MOCK_ANSWER_ITEMS.map((item) => (
                    <div key={item.text} className="aichat-answer-item">
                      <p className="aichat-answer-text">{item.text}</p>
                      <div className="aichat-answer-sources">
                        {item.sources.map((source) => (
                          <span key={source} className="aichat-source-pill">
                            <LinkIcon />
                            <span>{source}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button className="aichat-clear-history" type="button" onClick={handleClearHistory}>
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="aichat-chat-bottom">
        <div className="aichat-input-card">
          <textarea
            className="aichat-textarea"
            placeholder="Ask me anything about your data ..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
          />
          <div className="aichat-input-actions">
            <button className="aichat-btn-plus" type="button" aria-label="Attach file">
              <PlusIcon />
            </button>
            <div className="aichat-input-right-actions">
              <button
                className="aichat-btn-send"
                type="button"
                onClick={handleSubmit}
                aria-label="Send question"
              >
                <SendIcon />
              </button>
              <div className="aichat-chat-what-to-ask">
                <button
                  className="aichat-what-to-ask-btn"
                  type="button"
                  onClick={toggleWhatToAsk}
                  aria-expanded={isWhatToAskOpen}
                  aria-controls="aichat-what-to-ask-groups"
                >
                  What to Ask
                </button>
                {isWhatToAskOpen ? renderWhatToAskContent('aichat-what-to-ask-content aichat-what-to-ask-content--chat') : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChatPage;
