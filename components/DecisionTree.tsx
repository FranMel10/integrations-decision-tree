"use client";

import { useState } from "react";
import { decisionTree, START_NODE_ID } from "@/lib/decisionTree";

export function DecisionTree() {
  const [path, setPath] = useState<string[]>([START_NODE_ID]);

  const currentId = path[path.length - 1];
  const node = decisionTree[currentId];

  function goTo(nextId: string) {
    setPath((prev) => [...prev, nextId]);
  }

  function goToBreadcrumb(index: number) {
    setPath((prev) => prev.slice(0, index + 1));
  }

  function restart() {
    setPath([START_NODE_ID]);
  }

  if (!node) {
    return (
      <div className="card">
        <p className="node-title">Node not found: {currentId}</p>
        <button className="restart-btn" onClick={restart}>
          Back to start
        </button>
      </div>
    );
  }

  return (
    <div>
      {path.length > 1 && (
        <div className="breadcrumb">
          {path.map((id, index) => {
            const isLast = index === path.length - 1;
            return (
              <span key={id}>
                {index > 0 && <span className="sep"> / </span>}
                {isLast ? (
                  <span>{decisionTree[id]?.title ?? id}</span>
                ) : (
                  <button onClick={() => goToBreadcrumb(index)}>
                    {decisionTree[id]?.title ?? id}
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      <div className={`card ${node.isTerminal ? "terminal" : ""}`}>
        <h2 className="node-title">{node.title}</h2>

        {node.tags && node.tags.length > 0 && (
          <div className="tags">
            {node.tags.map((tag) => (
              <span key={tag} className={`tag ${tag.includes("churn") ? "warn" : ""}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {node.body && <p className="node-body">{node.body}</p>}

        {node.warning && (
          <div className="warning-box">
            <span className="warning-icon">⚠️</span>
            <p>{node.warning}</p>
          </div>
        )}

        {node.checklist && node.checklist.length > 0 && (
          <div className="checklist">
            <p className="section-label">Check / do this</p>
            <ul>
              {node.checklist.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {node.notionTopics && node.notionTopics.length > 0 && (
          <div className="notion-topics">
            <p className="section-label">🔎 Look up in Notion</p>
            <ul>
              {node.notionTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </div>
        )}

        {node.link && (
          <a href={node.link.url} target="_blank" rel="noopener noreferrer" className="node-link">
            🔗 {node.link.label}
          </a>
        )}

        {node.options && node.options.length > 0 && (
          <div className="options">
            {node.options.map((opt) => (
              <button key={opt.label} className="option-btn" onClick={() => goTo(opt.nextId)}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {node.isTerminal && !node.options && (
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", margin: 0 }}>
            Case resolved — end of flow.
          </p>
        )}
      </div>

      <button className="restart-btn" onClick={restart}>
        ↺ Start over
      </button>
    </div>
  );
}
