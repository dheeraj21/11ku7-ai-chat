export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
  expanded?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  codeBlocks?: CodeBlock[];
  attachments?: FileAttachment[];
}

export interface CodeBlock {
  language: string;
  code: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string; // Base64 for images, text content for documents
  url?: string; // For displaying images
  documentPages?: DocumentPage[]; // For PDF pages converted to images
}

export interface DocumentPage {
  pageNumber: number;
  imageBase64: string;
  textContent?: string;
}

export interface VersionInfo {
  currentVersion: number;
  totalVersions: number;
}

export interface FileVersion {
  timestamp: string;
  files: Array<{
    path: string;
    content: string;
  }>;
}

export type OperationMode = 'none' | 'code' | 'webapp';

export type Provider = 'Gemini' | 'OpenAI';

export interface AppState {
  provider: Provider | null;
  model: string | null;
  baseURL?: string;
  apiKey: string;
  mode: OperationMode;
  currentDirectory: string;
  fileSystem: FileNode[];
  chatMessages: ChatMessage[];
  loadedCodeContext: string;
  askCodeContext: string;
  editDirContext: string;
  editDirPath: string;
  askDirContext: string;
  askDirPath: string;
  digestContext: string;
  isConversationLoaded: boolean;
  versionInfo: Record<string, VersionInfo>;
}

export interface ExecutionResult {
  command: string;
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}