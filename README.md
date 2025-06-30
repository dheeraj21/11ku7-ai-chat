# 11ku7-ai-chat
A simple ai chat assistant
#### version: 1.0.0 

**Deployed on** : https://www.11ku7-ai.com

### Software Requirements :

Node.js 22.12+

### To use it locally : Install & run using below steps.

### Clone the repository
```bash
git clone https://github.com/dheeraj21/11ku7-ai-chat.git
```

### Change directory:
```bash
cd 11ku7-ai-chat
```

### Install dependencies:
```bash
npm install
```

### Start the application:
```bash
npm run dev
```

### Providers support:

- **gemini**
- **openai**
- **openrouter**
- **ollama**


### 🔧 Mode Commands:

**/code** - Toggle code-only generation mode (clean code without explanations)

**/webapp** - Toggle webapp-only generation mode (single HTML file with embedded CSS/JS)

### 📋 Utility Commands:

**/copy** - Copy all code blocks from last AI response to clipboard

**/clear** - Clear chat history

**/model** - Change AI provider/model

### 💾 Session Commands:

**/savecon** - Save entire conversation to markdown file

**/loadcon** - Load saved conversation from file


### 📎 File Attachment Features:

- **Images:** Upload images for analysis with vision-capable models
- **PDFs:** Automatically split into pages and converted to images for vision model analysis
- **Documents:** Attach text files, code files for context-aware responses
- **Supported formats:** Images (jpg, png, gif, webp), PDFs, Text files, Code files, JSON, CSV
- **Max file size:** 10MB per file
- **Multiple files:** Attach multiple files at once for comprehensive analysis


### 🔄 PDF Processing:

- PDFs are automatically processed page by page
- Each page is converted to a high-quality image
- Text content is extracted from each page
- Both images and text are sent to vision models for analysis
- Perfect for analyzing documents, forms, diagrams, and technical papers


### ⚙️ Custom System Prompt:

- Use the System Prompt panel to override default AI behavior in normal mode
- Toggle ON/OFF to enable/disable custom system instructions
- Only affects normal mode - code and webapp modes have fixed behavior
- Useful for role-playing, specific expertise, or custom response formats


### 📝 Input Features:

- Multiline Toggle: Switch between single-line and multiline input modes
- Shift+Enter: Add new line in multiline mode
- Enter: Send message in both modes

### 🎯 Mode Descriptions:

- Normal: Raw AI responses with previous conversation context and file attachments
- Can use custom system prompt when enabled
- Code: Clean code generation only, no explanations 
- Webapp: Single HTML file with embedded CSS/JS, no explanations


### 💡 Tips:

- All modes include previous conversation context automatically
- Use multiline input for long error messages or additional context
- Attach images to get visual analysis and code generation
- Attach PDFs to analyze documents, research papers, or technical diagrams
- Vision models can analyze screenshots, UI mockups, and handwritten notes
- Code and Webapp modes provide only code without any explanations
- PDF pages are processed as individual images for detailed analysis
- Custom system prompts only work in normal mode for maximum flexibility
- Type any message, use commands, or attach files to start interacting!
