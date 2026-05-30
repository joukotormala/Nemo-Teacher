'use client';

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ChatMessageContentProps {
  content: string;
  onWordClick?: (word: string) => void;
}

function renderClickableText(text: string, onWordClick?: (word: string) => void) {
  if (!onWordClick) return text;
  
  // Use Intl.Segmenter for native cross-language word segmentation if available
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'word' });
      const segments = segmenter.segment(text);
      const elements: React.ReactNode[] = [];
      let key = 0;
      
      for (const segment of segments) {
        const isWord = segment.isWordLike;
        const wordText = segment.segment;
        
        if (isWord && wordText.trim().length > 0) {
          elements.push(
            <span
              key={key++}
              onClick={() => onWordClick(wordText)}
              className="hover:text-primary hover:bg-primary/10 hover:underline cursor-pointer rounded px-0.5 transition-all duration-150 inline font-medium select-text"
              title={`Click to study "${wordText}"`}
            >
              {wordText}
            </span>
          );
        } else {
          elements.push(<span key={key++}>{wordText}</span>);
        }
      }
      return <>{elements}</>;
    } catch (e) {
      console.error('Segmenter error, falling back to regex:', e);
    }
  }

  // Fallback: Split by English word boundaries
  const parts = text.split(/(\b[a-zA-Z-']+\b)/g);
  return (
    <>
      {parts.map((part, index) => {
        const isWord = /^[a-zA-Z-']+$/.test(part);
        if (isWord) {
          return (
            <span
              key={index}
              onClick={() => onWordClick(part)}
              className="hover:text-primary hover:bg-primary/10 hover:underline cursor-pointer rounded px-0.5 transition-all duration-150 inline font-medium select-text"
              title={`Click to study "${part}"`}
            >
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
}

function makeNodesClickable(node: React.ReactNode, onWordClick?: (word: string) => void): React.ReactNode {
  if (!onWordClick) return node;

  if (typeof node === 'string') {
    return renderClickableText(node, onWordClick);
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={idx}>
        {makeNodesClickable(child, onWordClick)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const element = node as React.ReactElement<any>;
    // Skip code elements, buttons, or links to avoid breaking code or interactive items
    if (element.type === 'code' || element.type === 'button' || element.type === 'a') {
      return node;
    }
    
    if (element.props && element.props.children) {
      const newChildren = makeNodesClickable(element.props.children, onWordClick);
      return React.cloneElement(element, { ...element.props }, newChildren);
    }
  }

  return node;
}

export function ChatMessageContent({ content, onWordClick }: ChatMessageContentProps) {
  const plugins = useMemo(() => [remarkGfm, remarkMath], []);
  const rehypePlugins = useMemo(() => [rehypeKatex], []);

  if (!content) return null;

  return (
    <div className="chat-markdown select-text">
      <ReactMarkdown
        remarkPlugins={plugins}
        rehypePlugins={rehypePlugins}
        components={{
          img: ({ src, alt }) => {
            return (
              <span className="block my-4">
                <span className="block overflow-hidden rounded-xl border border-border/50 bg-muted/30 p-2 shadow-sm max-w-sm mx-auto transition-transform duration-300 hover:scale-[1.01]">
                  <img
                    src={src}
                    alt={alt}
                    className="w-full h-auto max-h-64 object-contain rounded-lg"
                    loading="lazy"
                  />
                </span>
                {alt ? (
                  <span className="block text-center text-xs text-muted-foreground mt-1.5 italic font-medium">
                    {alt}
                  </span>
                ) : null}
              </span>
            );
          },
          p: ({ children }) => <p className="mb-2 last:mb-0">{makeNodesClickable(children, onWordClick)}</p>,
          strong: ({ children }) => {
            const text = React.Children.toArray(children).join('').trim();
            const wordRegex = /^[a-zA-Z-\s]{2,40}$/;
            if (onWordClick && wordRegex.test(text)) {
              return (
                <button
                  onClick={() => onWordClick(text)}
                  className="font-semibold text-primary hover:underline cursor-pointer bg-primary/5 hover:bg-primary/10 px-1 rounded transition-colors inline-block align-baseline"
                  title={`Click to study "${text}"`}
                >
                  {children}
                </button>
              );
            }
            return <strong className="font-semibold text-foreground">{makeNodesClickable(children, onWordClick)}</strong>;
          },
          em: ({ children }) => <em className="italic">{makeNodesClickable(children, onWordClick)}</em>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{makeNodesClickable(children, onWordClick)}</li>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <code className={`block bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto mb-2 ${className || ''}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-muted/50 rounded px-1.5 py-0.5 text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <div className="mb-2">{children}</div>,
          h1: ({ children }) => <h3 className="text-base font-bold mb-2 mt-1">{makeNodesClickable(children, onWordClick)}</h3>,
          h2: ({ children }) => <h4 className="text-sm font-bold mb-1.5 mt-1">{makeNodesClickable(children, onWordClick)}</h4>,
          h3: ({ children }) => <h5 className="text-sm font-semibold mb-1 mt-1">{makeNodesClickable(children, onWordClick)}</h5>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-purple-400/50 pl-3 my-2 text-muted-foreground italic">
              {makeNodesClickable(children, onWordClick)}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-border/50" />,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full text-xs border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-border/50 px-2 py-1 bg-muted/30 font-semibold text-left">{children}</th>,
          td: ({ children }) => <td className="border border-border/50 px-2 py-1">{makeNodesClickable(children, onWordClick)}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
