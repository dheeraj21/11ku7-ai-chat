import React, { useEffect, useRef } from 'react';
import { marked } from 'marked';
import { ChatMessage } from '../types';
import { Terminal, User, Bot, Copy, Check, Paperclip, Image, FileText, File, Eye } from 'lucide-react';

interface ChatAreaProps {
  messages: ChatMessage[];
  isTyping: boolean;
  onCopyCode: (code: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, onCopyCode }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedText, setCopiedText] = React.useState<string>('');
  const [expandedPages, setExpandedPages] = React.useState<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedText(code);
    onCopyCode(code);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const togglePageExpansion = (pageId: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return newSet;
    });
  };

  // Function to remove code blocks from markdown content to avoid duplication
  const removeCodeBlocks = (content: string): string => {
    return content.replace(/```[\s\S]*?```/g, '');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const getFileIcon = (type: string, hasPages?: boolean) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (type === 'application/pdf') return hasPages ? <Image className="w-4 h-4 text-red-400" /> : <FileText className="w-4 h-4 text-red-400" />;
    if (type.includes('text') || type.includes('json') || type.includes('javascript') || type.includes('typescript')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getFileDescription = (attachment: any): string => {
    if (attachment.type === 'application/pdf' && attachment.documentPages) {
      return `PDF (${attachment.documentPages.length} pages as images)`;
    }
    if (attachment.type.startsWith('image/')) {
      return 'Image';
    }
    return 'Document';
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    
    // For user messages, show the content as-is without processing
    // For AI/system messages, remove code blocks to avoid duplication
    const contentToProcess = isUser ? message.content : removeCodeBlocks(message.content);
    
    // Configure marked for syntax highlighting
    const htmlContent = marked(contentToProcess, {
      highlight: (code, lang) => {
        // Simple syntax highlighting for demo
        return `<code class="language-${lang || 'text'}">${code}</code>`;
      }
    });

    return (
      <div key={message.id} className="mb-6">
        {/* User Message */}
        {isUser && (
          <div className="flex justify-end">
            <div className="max-w-[80%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">
              {/* Show attachments for user messages */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mb-3 space-y-3">
                  <div className="flex items-center space-x-2 text-xs text-blue-100">
                    <Paperclip className="w-3 h-3" />
                    <span>Attachments ({message.attachments.length})</span>
                  </div>
                  
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id} className="space-y-2">
                      {/* Attachment Header */}
                      <div className="flex items-center space-x-2 bg-blue-700/50 border border-blue-500/30 rounded p-2">
                        {attachment.url ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-800 rounded flex items-center justify-center text-blue-200">
                            {getFileIcon(attachment.type, !!attachment.documentPages)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-blue-100 font-mono truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-blue-200">
                            {formatFileSize(attachment.size)} • {getFileDescription(attachment)}
                          </div>
                        </div>
                      </div>

                      {/* PDF Pages Preview */}
                      {attachment.documentPages && attachment.documentPages.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-blue-200 font-mono">
                            PDF Pages ({attachment.documentPages.length} pages converted to images):
                          </div>
                          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                            {attachment.documentPages.map((page) => {
                              const pageId = `${attachment.id}-page-${page.pageNumber}`;
                              const isExpanded = expandedPages.has(pageId);
                              
                              return (
                                <div key={pageId} className="relative">
                                  <div 
                                    className="bg-blue-800/50 border border-blue-500/30 rounded p-2 cursor-pointer hover:border-blue-400/50 transition-colors"
                                    onClick={() => togglePageExpansion(pageId)}
                                  >
                                    <img
                                      src={`data:image/jpeg;base64,${page.imageBase64}`}
                                      alt={`Page ${page.pageNumber}`}
                                      className={`w-full object-contain rounded transition-all duration-200 ${
                                        isExpanded ? 'max-h-96' : 'max-h-24'
                                      }`}
                                    />
                                    <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 py-0.5 rounded">
                                      Page {page.pageNumber}
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/70 text-white p-1 rounded">
                                      <Eye className="w-3 h-3" />
                                    </div>
                                  </div>
                                  
                                  {isExpanded && page.textContent && (
                                    <div className="mt-2 p-2 bg-blue-900/50 border border-blue-600 rounded text-xs text-blue-100 font-mono max-h-32 overflow-y-auto">
                                      <div className="text-blue-200 mb-1">Extracted Text:</div>
                                      {page.textContent.substring(0, 200)}
                                      {page.textContent.length > 200 && '...'}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Content */}
              <div 
                className="prose prose-invert prose-sm max-w-none font-mono text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
              
              <div className="text-xs text-blue-200 mt-2 text-right opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}

        {/* AI/System Message */}
        {!isUser && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              {/* Avatar and Name */}
              <div className="flex items-center space-x-2 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isSystem 
                    ? 'bg-yellow-500/20 text-yellow-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  <Bot className="w-4 h-4" />
                </div>
                <span className={`text-sm font-mono font-semibold ${
                  isSystem ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {isSystem ? 'System' : 'AI Assistant'}
                </span>
                <span className="text-xs text-gray-500">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>

              {/* Message Bubble */}
              <div className={`rounded-2xl rounded-tl-md px-4 py-3 ${
                isSystem
                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                  : 'bg-gray-800/80 border border-gray-700'
              }`}>
                {/* Message Content */}
                <div 
                  className={`prose prose-invert prose-sm max-w-none font-mono text-sm leading-relaxed ${
                    isSystem ? 'text-yellow-100' : 'text-gray-100'
                  }`}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
                
                {/* Code blocks for AI/system messages */}
                {message.codeBlocks && message.codeBlocks.length > 0 && (
                  <div className="mt-4 space-y-3">
                    {message.codeBlocks.map((block, index) => (
                      <div key={index} className="relative">
                        <div className="bg-black/40 rounded-lg border border-gray-600 overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80 border-b border-gray-600">
                            <span className="text-xs text-gray-400 font-mono">{block.language}</span>
                            <button
                              onClick={() => handleCopy(block.code)}
                              className="text-gray-400 hover:text-green-400 transition-colors duration-200"
                            >
                              {copiedText === block.code ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          <pre className="p-3 overflow-x-auto text-sm">
                            <code className="text-green-400">{block.code}</code>
                          </pre>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg h-full flex flex-col">
      <div className="border-b border-green-500/20 p-3 flex-shrink-0">
        <h3 className="text-green-400 font-mono text-sm font-semibold flex items-center">
          <Terminal className="w-4 h-4 mr-2" />
          AI Chat
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 font-mono text-sm mt-8">
            <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start a conversation with your AI assistant</p>
            <p className="text-xs mt-1">Type a message, use commands like /help, or attach files</p>
          </div>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[85%]">
              {/* Avatar and Name */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/20 text-green-400">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="text-sm font-mono font-semibold text-green-400">
                  AI Assistant
                </span>
                <span className="text-xs text-gray-500">typing...</span>
              </div>

              {/* Typing Bubble */}
              <div className="bg-gray-800/80 border border-gray-700 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatArea;