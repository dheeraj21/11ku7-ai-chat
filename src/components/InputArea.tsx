import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Paperclip, X, FileText, Image, File, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import { OperationMode, FileAttachment } from '../types';
import { DocumentProcessor } from '../utils/documentProcessor';

interface InputAreaProps {
  onSendMessage: (message: string, attachments?: FileAttachment[]) => void;
  currentMode: OperationMode;
  isTyping: boolean;
  onCommandExecute: (command: string, args: string[]) => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  currentMode,
  isTyping,
  onCommandExecute
}) => {
  const [input, setInput] = useState('');
  const [isMultiline, setIsMultiline] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [processingFiles, setProcessingFiles] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isMultiline && textareaRef.current) {
      textareaRef.current.focus();
    } else if (!isMultiline && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isMultiline]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    const processingIds = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      const attachmentId = `${Date.now()}-${i}`;
      processingIds.add(attachmentId);

      try {
        setProcessingFiles(prev => new Set([...prev, attachmentId]));

        let attachment: FileAttachment;

        if (file.type.startsWith('image/')) {
          // Handle images
          const content = await readFileAsDataURL(file);
          attachment = {
            id: attachmentId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: content,
            url: URL.createObjectURL(file)
          };
        } else if (DocumentProcessor.isSupportedDocument(file)) {
          // Handle documents (including PDFs)
          try {
            const result = await DocumentProcessor.processDocument(file);
            
            attachment = {
              id: attachmentId,
              name: file.name,
              type: file.type,
              size: file.size,
              content: result.textContent,
              documentPages: result.pages
            };

            // If it's a PDF with pages, show a success message
            if (result.pages && result.pages.length > 0) {
              console.log(`PDF processed: ${result.pages.length} pages converted to images`);
            }
          } catch (error) {
            console.error(`Error processing document ${file.name}:`, error);
            alert(`Error processing document ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            continue;
          }
        } else {
          // Handle other text files
          const content = await readFileAsText(file);
          attachment = {
            id: attachmentId,
            name: file.name,
            type: file.type,
            size: file.size,
            content: content
          };
        }

        newAttachments.push(attachment);
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
        alert(`Error reading file ${file.name}`);
      } finally {
        setProcessingFiles(prev => {
          const updated = new Set(prev);
          updated.delete(attachmentId);
          return updated;
        });
      }
    }

    setAttachments(prev => [...prev, ...newAttachments]);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      // Clean up object URLs
      const removed = prev.find(att => att.id === id);
      if (removed?.url) {
        URL.revokeObjectURL(removed.url);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!input.trim() && attachments.length === 0) || isTyping || processingFiles.size > 0) return;

    if (input.startsWith('/')) {
      const [command, ...args] = input.split(' ');
      onCommandExecute(command, args);
    } else {
      onSendMessage(input || 'Please analyze the attached files.', attachments.length > 0 ? attachments : undefined);
    }

    setInput('');
    setAttachments([]);
  };

  // handleKeyPress will only apply to the single-line input field.
  // The multiline textarea will handle newlines natively.
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission
      handleSubmit(e); // Submit the message
    }
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

  const getFileDescription = (attachment: FileAttachment): string => {
    if (attachment.type === 'application/pdf' && attachment.documentPages) {
      return `PDF (${attachment.documentPages.length} pages as images)`;
    }
    if (attachment.type.startsWith('image/')) {
      return 'Image';
    }
    if (DocumentProcessor.isSupportedDocument({ name: attachment.name, type: attachment.type } as File)) {
      return 'Document';
    }
    return 'File';
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg p-4">
      {/* Attachments Preview */}
      {(attachments.length > 0 || processingFiles.size > 0) && (
        <div className="mb-4 space-y-2">
          <div className="text-xs text-gray-400 font-mono">
            Attachments ({attachments.length}){processingFiles.size > 0 && ` • Processing ${processingFiles.size} file(s)...`}
          </div>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center space-x-2 bg-gray-800/50 border border-gray-600 rounded-lg p-2 group"
              >
                {attachment.url ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="w-8 h-8 object-cover rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-gray-400">
                    {getFileIcon(attachment.type, !!attachment.documentPages)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-green-400 font-mono truncate">
                    {attachment.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)} • {getFileDescription(attachment)}
                  </div>
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {/* Show processing indicators */}
            {Array.from(processingFiles).map((id) => (
              <div
                key={id}
                className="flex items-center space-x-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2"
              >
                <div className="w-8 h-8 bg-yellow-500/20 rounded flex items-center justify-center">
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-yellow-400 font-mono">
                    Processing...
                  </div>
                  <div className="text-xs text-gray-500">
                    Converting document
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Controls Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-green-500" />
          <span className="text-green-400 font-mono text-sm">
            {isMultiline ? 'Multiline Input' : 'Single Line Input'}
          </span>
        </div>
        
        {/* Multiline Toggle */}
        <button
          onClick={() => setIsMultiline(!isMultiline)}
          className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all duration-200 ${
            isMultiline 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
          }`}
          title={isMultiline ? 'Switch to single line' : 'Switch to multiline'}
        >
          {isMultiline ? (
            <ToggleRight className="w-4 h-4" />
          ) : (
            <ToggleLeft className="w-4 h-4" />
          )}
          <span className="text-xs font-mono">
            Multiline
          </span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="flex-1 relative">
          {/* Fixed height container for both input types */}
          <div className="h-12"> {/* Fixed height container */}
            {isMultiline ? (
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message or command... Press Enter for a new line, use Send button to send"
                className="w-full h-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 resize-none"
                disabled={isTyping || processingFiles.size > 0}
              />
            ) : (
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or command (e.g., /help)... Press Enter to send"
                className="w-full h-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50"
                disabled={isTyping || processingFiles.size > 0}
              />
            )}
          </div>
        </div>
        
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isTyping || processingFiles.size > 0}
          className="px-3 py-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
          title="Attach files (images, PDFs, documents, code files)"
        >
          {processingFiles.size > 0 ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>
        
        <button
          type="submit"
          disabled={(!input.trim() && attachments.length === 0) || isTyping || processingFiles.size > 0}
          className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.py,.html,.css,.xml,.csv,.doc,.docx"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default InputArea;