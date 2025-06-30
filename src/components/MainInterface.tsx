import React, { useState, useEffect } from 'react';
import { Settings, Download, Upload, Trash2 } from 'lucide-react';
import { AppState, ChatMessage, OperationMode, CodeBlock, FileAttachment } from '../types';
import ChatArea from './ChatArea';
import InputArea from './InputArea';
import ModeSelector from './ModeSelector';
import SystemPromptInput from './SystemPromptInput';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface MainInterfaceProps {
  initialState: Pick<AppState, 'provider' | 'model' | 'apiKey' | 'baseURL'>;
  onChangeProvider: () => void;
}

const MainInterface: React.FC<MainInterfaceProps> = ({ initialState, onChangeProvider }) => {
  // Date reviver function to convert timestamp strings back to Date objects
  const dateReviver = (key: string, value: any) => {
    if (key === 'timestamp' && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  };
  
  // State management
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('ai-nodecoder-messages', [], dateReviver);
  const [currentMode, setCurrentMode] = useState<OperationMode>('none');
  const [isTyping, setIsTyping] = useState(false);
  const [customSystemPrompt, setCustomSystemPrompt] = useLocalStorage<string>('ai-nodecoder-system-prompt', '');
  const [systemPromptEnabled, setSystemPromptEnabled] = useLocalStorage<boolean>('ai-nodecoder-system-prompt-enabled', false);

  // Add initial welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'system',
        content: `Welcome to **11ku7 AI Chat v1.0.0**! 

You're now connected to **${initialState.provider}** (${initialState.model})

**Available Commands:**
- \`/help\` - Show all commands and key bindings
- \`/code\` - Toggle code-only generation mode
- \`/webapp\` - Toggle webapp-only generation mode  
- \`/copy\` - Copy code blocks to clipboard
- \`/clear\` - Clear chat history
- \`/model\` - Change AI provider/model

**New Features:**
- 📎 **File Attachments**: Click the paperclip icon to attach images, documents, or code files
- 🖼️ **Vision Support**: Upload images for analysis with vision-capable models
- 📄 **Document Processing**: Attach PDFs (converted to images), text files, or code for context-aware responses
- 🔄 **PDF to Images**: PDFs are automatically split into pages and converted to images for vision model analysis
- ⚙️ **Custom System Prompt**: Use the system prompt panel to override default AI behavior in normal mode
- 📝 **Multiline Input**: Toggle multiline mode in the input area for longer messages

**Supported File Types:**
- **Images**: JPG, PNG, GIF, WebP (for vision models)
- **Documents**: PDF (auto-converted to images), TXT, MD, JSON, CSV
- **Code Files**: JS, JSX, TS, TSX, PY, HTML, CSS, XML

Start by typing a message, using a command, or attaching files!`,
        timestamp: new Date()
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

  // Get previous context from recent messages
  const getPreviousContext = (): string => {
    const recentMessages = chatMessages.slice(-6); // Last 6 messages for context
    if (recentMessages.length === 0) return '';
    
    const contextMessages = recentMessages
      .filter(msg => msg.role !== 'system') // Exclude system messages
      .map(msg => {
        let content = `${msg.role}: ${msg.content}`;
        
        // Add attachment context
        if (msg.attachments && msg.attachments.length > 0) {
          const attachmentInfo = msg.attachments.map(att => {
            if (att.documentPages && att.documentPages.length > 0) {
              return `[PDF: ${att.name} (${att.documentPages.length} pages as images)]`;
            }
            return `[Attachment: ${att.name} (${att.type})]`;
          }).join(', ');
          content += `\n${attachmentInfo}`;
        }
        
        return content;
      })
      .join('\n\n');
    
    return contextMessages ? `Previous conversation context:\n${contextMessages}\n\n` : '';
  };

  // Create mode-specific prompts for AI
  const createModePrompt = (userMessage: string, mode: OperationMode, attachments?: FileAttachment[]): string => {
    const previousContext = getPreviousContext();
    let attachmentContext = '';
    
    // Process text attachments for context
    if (attachments && attachments.length > 0) {
      attachmentContext = '\n\nAttached files:\n';
      attachments.forEach((attachment, index) => {
        if (!attachment.type.startsWith('image/') && !attachment.documentPages) {
          // Only include text content in prompt, images and PDF pages are handled separately
          attachmentContext += `\n${index + 1}. ${attachment.name} (${attachment.type}, ${Math.round(attachment.size / 1024)}KB):\n`;
          attachmentContext += `${attachment.content}\n`;
        } else if (attachment.documentPages) {
          // For PDFs, include text content from all pages
          attachmentContext += `\n${index + 1}. ${attachment.name} (PDF with ${attachment.documentPages.length} pages):\n`;
          attachmentContext += `${attachment.content}\n`;
        }
      });
    }
    
    const baseContext = `${previousContext}${attachmentContext}`;

    switch (mode) {
      case 'code':
        return `${baseContext}You are in CODE MODE. Generate ONLY clean, production-ready code without any explanations, descriptions, or commentary.

User request: "${userMessage}"

Requirements:
- Provide ONLY code in proper markdown code blocks with language specification
- NO explanations, descriptions, or text outside code blocks
- Clean, production-ready code with proper formatting
- Include necessary comments within the code only
- Multiple code blocks if multiple files are needed
- If images or PDF pages are attached, analyze them and generate relevant code
- For PDFs, each page has been converted to an image for analysis

Respond with code only.`;

      case 'webapp':
        return `${baseContext}You are in WEBAPP MODE. Create ONLY a complete, production-ready web application as a single HTML file without any explanations.

User request: "${userMessage}"

Requirements:
- Provide ONLY ONE HTML code block containing the complete web application
- Include CSS in <style> tags within the HTML
- Include JavaScript in <script> tags within the HTML
- NO explanations, descriptions, or text outside the code block
- Modern, responsive design using Tailwind CSS or vanilla CSS
- Interactive functionality with proper event handling
- Professional UI/UX implementation
- Complete, self-contained HTML file that can be saved and opened in a browser
- If images or PDF pages are attached, incorporate them or create similar functionality
- For PDFs, each page has been converted to an image for analysis

Respond with a single HTML code block only.`;

      default:
        // For normal mode, check if custom system prompt is enabled
        if (systemPromptEnabled && customSystemPrompt.trim()) {
          return `${customSystemPrompt.trim()}\n\n${baseContext}User request: "${userMessage}"`;
        }
        // For normal mode without custom prompt, return raw user message with context
        return `${baseContext}${userMessage}`;
    }
  };

  // Helper function to convert base64 data URL to just base64 string
  const extractBase64FromDataURL = (dataURL: string): string => {
    const base64Index = dataURL.indexOf(',');
    return base64Index !== -1 ? dataURL.substring(base64Index + 1) : dataURL;
  };

  // Actual AI response function using fetch API
  const getActualAIResponse = async (userMessage: string, mode: OperationMode = 'none', attachments?: FileAttachment[]): Promise<string> => {
    try {
      const prompt = createModePrompt(userMessage, mode, attachments);
      const hasImages = attachments?.some(att => att.type.startsWith('image/') || (att.documentPages && att.documentPages.length > 0));
      
      if (initialState.provider === 'Gemini') {
        let requestBody: any = {
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        };

        if (hasImages) {
          // For Gemini with images, use the parts format
          const parts: any[] = [{ text: prompt }];
          
          attachments?.forEach(attachment => {
            if (attachment.type.startsWith('image/')) {
              const base64Data = extractBase64FromDataURL(attachment.content);
              parts.push({
                inline_data: {
                  mime_type: attachment.type,
                  data: base64Data
                }
              });
            } else if (attachment.documentPages) {
              // Add each PDF page as an image
              attachment.documentPages.forEach((page, index) => {
                parts.push({
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: page.imageBase64
                  }
                });
              });
            }
          });
          
          requestBody.contents = [{ parts }];
        } else {
          // For text-only requests
          requestBody.contents = [{
            parts: [{ text: prompt }]
          }];
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${initialState.model}:generateContent?key=${initialState.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response format from Gemini API');
        }
        
        return data.candidates[0].content.parts[0].text || 'No response from Gemini API';
      } else if (initialState.provider === 'OpenAI') {
        // For OpenAI-compatible APIs, use the OpenAI format
        const messages: any[] = [];
        
        if (hasImages) {
          // For vision models, use the content array format
          const content: any[] = [{ type: 'text', text: prompt }];
          
          attachments?.forEach(attachment => {
            if (attachment.type.startsWith('image/')) {
              content.push({
                type: 'image_url',
                image_url: {
                  url: attachment.content // Use the full data URL
                }
              });
            } else if (attachment.documentPages) {
              // Add each PDF page as an image
              attachment.documentPages.forEach((page) => {
                content.push({
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${page.imageBase64}`
                  }
                });
              });
            }
          });
          
          messages.push({
            role: 'user',
            content: content
          });
        } else {
          // For text-only requests
          messages.push({
            role: 'user',
            content: prompt
          });
        }

        const response = await fetch(`${initialState.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${initialState.apiKey}`
          },
          body: JSON.stringify({
            model: initialState.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 4096,
            stream: false
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenAI API');
        }
        
        return data.choices[0].message.content || 'No response from OpenAI API';
      }
    } catch (error) {
      console.error('AI API Error:', error);
      throw error;
    }
    
    return 'No AI provider configured';
  };

  // AI response handler
  const simulateAIResponse = async (userMessage: string, attachments?: FileAttachment[]) => {
    setIsTyping(true);
    
    let responseContent = '';
    let codeBlocks: CodeBlock[] = [];

    try {
      // Handle different modes and commands
      if (userMessage.startsWith('/')) {
        responseContent = handleCommand(userMessage);
      } else {
        // Use actual AI response for all other modes
        responseContent = await getActualAIResponse(userMessage, currentMode, attachments);
        codeBlocks = extractCodeBlocks(responseContent);
      }
    } catch (error) {
      responseContent = `**Error communicating with AI:**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Troubleshooting:**
- Check your API key is valid and has sufficient credits
- Verify your internet connection
- For vision models, ensure you're using a compatible model (e.g., gemini-pro-vision, gpt-4-vision-preview)
- For PDF processing, ensure the PDF is not corrupted or password-protected
- Try again in a few moments
- Use /model to switch providers if the issue persists

**Current Configuration:**
- Provider: ${initialState.provider}
- Model: ${initialState.model}
- Base URL: ${initialState.baseURL || 'Default'}`;
    }

    // Create AI response with unique ID
    const aiMessage: ChatMessage = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'ai',
      content: responseContent,
      timestamp: new Date(),
      codeBlocks
    };

    // Add AI response to chat messages
    setChatMessages(prev => {
      const newMessages = [...prev, aiMessage];
      console.log('Adding AI response:', aiMessage);
      return newMessages;
    });
    
    setIsTyping(false);
  };

  const handleCommand = (command: string): string => {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case '/help':
        return `**11ku7 AI Chat - Command Reference**

**🔧 Mode Commands:**
- \`/code\` - Toggle code-only generation mode (clean code without explanations)
- \`/webapp\` - Toggle webapp-only generation mode (single HTML file with embedded CSS/JS)

**📋 Utility Commands:**
- \`/copy\` - Copy all code blocks from last AI response to clipboard
- \`/clear\` - Clear chat history
- \`/model\` - Change AI provider/model

**💾 Session Commands:**
- \`/savecon\` - Save entire conversation to markdown file
- \`/loadcon\` - Load saved conversation from file

**📎 File Attachment Features:**
- **Images**: Upload images for analysis with vision-capable models (Gemini Pro Vision, GPT-4V)
- **PDFs**: Automatically split into pages and converted to images for vision model analysis
- **Documents**: Attach text files, code files for context-aware responses
- **Supported formats**: Images (jpg, png, gif, webp), PDFs, Text files, Code files, JSON, CSV
- **Max file size**: 10MB per file
- **Multiple files**: Attach multiple files at once for comprehensive analysis

**🔄 PDF Processing:**
- PDFs are automatically processed page by page
- Each page is converted to a high-quality image
- Text content is extracted from each page
- Both images and text are sent to vision models for analysis
- Perfect for analyzing documents, forms, diagrams, and technical papers

**⚙️ Custom System Prompt:**
- Use the System Prompt panel to override default AI behavior in normal mode
- Toggle ON/OFF to enable/disable custom system instructions
- Only affects normal mode - code and webapp modes have fixed behavior
- Useful for role-playing, specific expertise, or custom response formats

**📝 Input Features:**
- **Multiline Toggle**: Switch between single-line and multiline input modes
- **Shift+Enter**: Add new line in multiline mode
- **Enter**: Send message in both modes

**🎯 Mode Descriptions:**
- **Normal**: Raw AI responses with previous conversation context and file attachments
  - Can use custom system prompt when enabled
- **Code**: Clean code generation only, no explanations (with context and attachments)
- **Webapp**: Single HTML file with embedded CSS/JS, no explanations (with context and attachments)

**💡 Tips:**
- All modes include previous conversation context automatically
- Use multiline input for long error messages or additional context
- Attach images to get visual analysis and code generation
- Attach PDFs to analyze documents, research papers, or technical diagrams
- Vision models can analyze screenshots, UI mockups, and handwritten notes
- Code and Webapp modes provide only code without any explanations
- PDF pages are processed as individual images for detailed analysis
- Custom system prompts only work in normal mode for maximum flexibility

Type any message, use commands, or attach files to start interacting!`;

      case '/clear':
        // Clear messages immediately
        setChatMessages([]);
        return 'Chat cleared successfully.';

      case '/model':
        onChangeProvider();
        return 'Switching AI provider...';

      case '/copy':
        const lastMessage = chatMessages[chatMessages.length - 1];
        if (lastMessage?.codeBlocks?.length) {
          const allCode = lastMessage.codeBlocks.map(block => block.code).join('\n\n');
          copyToClipboard(allCode);
          return `✅ Copied ${lastMessage.codeBlocks.length} code block(s) to clipboard.`;
        }
        return '❌ No code blocks found in the last response.';

      case '/code':
        const newCodeMode = currentMode === 'code' ? 'none' : 'code';
        setCurrentMode(newCodeMode);
        return `🔧 Code mode ${newCodeMode === 'code' ? '**enabled**' : '**disabled**'}. AI will now ${newCodeMode === 'code' ? 'provide clean code only without explanations (with conversation context and file attachments)' : 'provide raw responses with conversation context and file attachments'}.`;

      case '/webapp':
        const newWebappMode = currentMode === 'webapp' ? 'none' : 'webapp';
        setCurrentMode(newWebappMode);
        return `🌐 Webapp mode ${newWebappMode === 'webapp' ? '**enabled**' : '**disabled**'}. AI will now ${newWebappMode === 'webapp' ? 'provide a single HTML file with embedded CSS/JS without explanations (with conversation context and file attachments)' : 'provide raw responses with conversation context and file attachments'}.`;

      case '/savecon':
        handleSaveConversation();
        return '✅ Conversation export initiated. Check your downloads folder.';

      default:
        return `❌ Unknown command: **${cmd}**. Type \`/help\` for available commands.`;
    }
  };

  const extractCodeBlocks = (content: string): CodeBlock[] => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: CodeBlock[] = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }

    return blocks;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleSendMessage = (message: string, attachments?: FileAttachment[]) => {
    // Create user message with full attachments for display
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: message,
      timestamp: new Date(),
      attachments: attachments // Keep full attachments for display
    };

    // Add user message to chat immediately
    setChatMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('Adding user message:', userMessage);
      return newMessages;
    });
    
    // Pass the original attachments with full data to AI processing
    simulateAIResponse(message, attachments);
  };

  const handleCommandExecute = (command: string, args: string[]) => {
    const fullCommand = `${command} ${args.join(' ')}`.trim();
    
    // Create user message for the command
    const userMessage: ChatMessage = {
      id: `user-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: fullCommand,
      timestamp: new Date()
    };

    // Add user command message and ensure it persists
    setChatMessages(prev => {
      const newMessages = [...prev, userMessage];
      console.log('Adding user command:', userMessage);
      return newMessages;
    });
    
    // Handle the command and get response
    const response = handleCommand(fullCommand);
    
    // Create system response message
    const systemMessage: ChatMessage = {
      id: `system-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content: response,
      timestamp: new Date()
    };

    // Add system response
    setChatMessages(prev => {
      const newMessages = [...prev, systemMessage];
      console.log('Adding system response:', systemMessage);
      return newMessages;
    });
  };

  const handleSaveConversation = () => {
    const conversation = chatMessages.map(msg => {
      let content = `## ${msg.role.charAt(0).toUpperCase() + msg.role.slice(1)}\n${msg.content}`;
      
      // Add attachment info to saved conversation
      if (msg.attachments && msg.attachments.length > 0) {
        content += '\n\n**Attachments:**\n';
        msg.attachments.forEach((att, index) => {
          content += `${index + 1}. ${att.name} (${att.type}, ${Math.round(att.size / 1024)}KB)`;
          if (att.documentPages) {
            content += ` - PDF with ${att.documentPages.length} pages converted to images`;
          }
          content += '\n';
        });
      }
      
      return content + '\n';
    }).join('\n');
    
    const blob = new Blob([`# Chat Conversation\n\n${conversation}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-conversation-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const saveMessage: ChatMessage = {
      id: `system-save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content: 'Conversation saved to markdown file successfully.',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, saveMessage]);
  };

  const handleLoadConversation = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      // Parse markdown conversation format
      const sections = content.split(/## (User|Ai|System)/i);
      const newMessages: ChatMessage[] = [];
      
      for (let i = 1; i < sections.length; i += 2) {
        const role = sections[i].toLowerCase() as 'user' | 'ai' | 'system';
        const messageContent = sections[i + 1]?.trim();
        
        if (messageContent) {
          newMessages.push({
            id: `loaded-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
            role,
            content: messageContent,
            timestamp: new Date(),
            codeBlocks: extractCodeBlocks(messageContent)
          });
        }
      }
      
      setChatMessages(newMessages);
      
      const loadMessage: ChatMessage = {
        id: `system-load-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'system',
        content: `Conversation loaded from ${file.name} successfully. ${newMessages.length} messages restored.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, loadMessage]);
    };
    
    reader.readAsText(file);
  };

  const handleClearChat = () => {
    setChatMessages([]);
    
    // Add a confirmation message that persists
    const clearMessage: ChatMessage = {
      id: `system-clear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'system',
      content: 'Chat cleared successfully. Start a new conversation!',
      timestamp: new Date()
    };
    setChatMessages([clearMessage]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-4">
      <div className="max-w-7xl mx-auto h-screen flex flex-col space-y-4">
        {/* Header */}
        <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <h1 className="text-green-400 font-mono text-xl font-bold">11ku7 AI Chat</h1>
            <div className="text-gray-400 font-mono text-sm hidden sm:block"> {/* Hide on smaller screens */}
              Connected to {initialState.provider} ({initialState.model})
            </div>
            {systemPromptEnabled && (
              <div className="text-green-400 font-mono text-xs bg-green-500/10 px-2 py-1 rounded border border-green-500/20 hidden sm:block"> {/* Hide on smaller screens */}
                Custom System Prompt: ON
              </div>
            )}
            {/* Built with Bolt.new badge */}
            <a
              href="https://bolt.new/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-green-400 text-xs font-mono transition-colors duration-200 hidden sm:block" // Hidden on small screens
              title="Built with Bolt.new"
            >
              Built with Bolt.new
            </a>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Clear Chat Button */}
            <button
              onClick={handleClearChat}
              className="p-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
              title="Clear Chat"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            {/* Save/Load Conversation */}
            <button
              onClick={handleSaveConversation}
              className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-200"
              title="Save Conversation"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <label className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-200 cursor-pointer" title="Load Conversation">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".md"
                onChange={handleLoadConversation}
                className="hidden"
              />
            </label>
            
            <button
              onClick={onChangeProvider}
              className="p-2 text-gray-400 hover:text-green-400 transition-colors duration-200"
              title="Change Provider"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-0">
          {/* Left Sidebar - Mode Selector and System Prompt */}
          <div className="col-span-12 md:col-span-3 flex flex-col space-y-4 min-h-0">
            {/* Mode Selector - Fixed height */}
            <div className="h-auto md:h-80">
              <ModeSelector
                currentMode={currentMode}
                onModeChange={setCurrentMode}
              />
            </div>
            
            {/* System Prompt Input - Only show in normal mode, flex-1 to fill remaining space */}
            {currentMode === 'none' && (
              <div className="flex-1 min-h-0">
                <SystemPromptInput
                  value={customSystemPrompt}
                  onChange={setCustomSystemPrompt}
                  enabled={systemPromptEnabled}
                  onToggle={setSystemPromptEnabled}
                />
              </div>
            )}
          </div>

          {/* Right Side - Chat Area and Input */}
          <div className="col-span-12 md:col-span-9 flex flex-col space-y-4 min-h-0">
            {/* Chat Area */}
            <div className="flex-1 min-h-0">
              <ChatArea
                messages={chatMessages}
                isTyping={isTyping}
                onCopyCode={copyToClipboard}
              />
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0">
              <InputArea
                onSendMessage={handleSendMessage}
                currentMode={currentMode}
                isTyping={isTyping}
                onCommandExecute={handleCommandExecute}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainInterface;