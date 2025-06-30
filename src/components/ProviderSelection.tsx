import React, { useState, useEffect } from 'react';
import { Provider } from '../types';
import { Terminal, Globe, Key, Check, X, ChevronDown, Plus } from 'lucide-react';

interface ProviderSelectionProps {
  onProviderSelect: (provider: Provider, model: string, apiKey: string, baseURL?: string) => void;
}

interface OpenAIProvider {
  name: string;
  baseURL: string;
  description: string;
  requiresApiKey: boolean;
  isCustom?: boolean;
  fetchModels?: boolean; // New property to indicate if we should fetch models
}

const openAIProviders: OpenAIProvider[] = [
  {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    description: 'Official OpenAI API',
    requiresApiKey: true,
    fetchModels: true
  },
  {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    description: 'Access to multiple AI models through OpenRouter',
    requiresApiKey: true
  },
  {
    name: 'Ollama',
    baseURL: 'http://localhost:11434/v1',
    description: 'Local Ollama instance (no API key required)',
    requiresApiKey: false
  },
  {
    name: 'Custom Provider',
    baseURL: '',
    description: 'Enter your own API endpoint URL',
    requiresApiKey: true,
    isCustom: true
  }
];

const ProviderSelection: React.FC<ProviderSelectionProps> = ({ onProviderSelect }) => {
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  const [baseURL, setBaseURL] = useState<string>('');
  const [customBaseURL, setCustomBaseURL] = useState<string>('');
  const [selectedOpenAIProvider, setSelectedOpenAIProvider] = useState<OpenAIProvider | null>(null);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [step, setStep] = useState<'provider' | 'openai-provider' | 'custom-url' | 'apikey' | 'model'>('provider');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogo, setShowLogo] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => setShowLogo(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleProviderSelect = (provider: Provider) => {
    setSelectedProvider(provider);
    setError('');
    
    if (provider === 'OpenAI') {
      setStep('openai-provider');
    } else {
      setStep('apikey');
    }
  };

  const handleOpenAIProviderSelect = (provider: OpenAIProvider) => {
    setSelectedOpenAIProvider(provider);
    setShowProviderDropdown(false);
    
    if (provider.isCustom) {
      // For custom provider, go to custom URL step
      setStep('custom-url');
    } else {
      setBaseURL(provider.baseURL);
      
      // Skip API key step for Ollama since it doesn't require one
      if (!provider.requiresApiKey) {
        setApiKey('ollama-local'); // Set a placeholder value for Ollama
        setStep('model');
      } else {
        setStep('apikey');
      }
    }
  };

  const handleCustomURLSubmit = () => {
    if (!customBaseURL.trim()) {
      setError('Please enter a valid base URL');
      return;
    }
    
    setBaseURL(customBaseURL);
    setError('');
    setStep('apikey');
  };

  const handleApiKeySubmit = async () => {
    // Skip API key validation for Ollama
    if (selectedOpenAIProvider?.name === 'Ollama') {
      setApiKey('ollama-local');
      setStep('model');
      return;
    }
    
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    if (selectedProvider === 'Gemini') {
      try {
        // Fetch Gemini models using the same endpoint as in your code
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.models || !Array.isArray(data.models)) {
          throw new Error('Invalid response format from Gemini API');
        }
        
        const models = data.models
          .filter((model: any) => model.supportedGenerationMethods?.includes('generateContent'))
          .map((model: any) => model.name.split('/')[1]);
        
        if (models.length === 0) {
          throw new Error('No compatible models found. Check your API key.');
        }
        
        setAvailableModels(models);
        setStep('model');
      } catch (error: any) {
        setError(`Error fetching Gemini models: ${error.message}`);
        setApiKey('');
      } finally {
        setIsLoading(false);
      }
    } else if (selectedProvider === 'OpenAI' && selectedOpenAIProvider?.fetchModels) {
      // Fetch OpenAI models
      try {
        const response = await fetch(`${baseURL}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
          throw new Error('Invalid response format from OpenAI API');
        }
        
        // Filter and sort models - prioritize GPT models and commonly used ones
        const models = data.data
          .map((model: any) => model.id)
          .filter((modelId: string) => {
            // Filter out fine-tuned models and system models
            return !modelId.includes(':') && !modelId.startsWith('system-');
          })
          .sort((a: string, b: string) => {
            // Prioritize GPT models
            const aIsGPT = a.includes('gpt');
            const bIsGPT = b.includes('gpt');
            
            if (aIsGPT && !bIsGPT) return -1;
            if (!aIsGPT && bIsGPT) return 1;
            
            // Then sort alphabetically
            return a.localeCompare(b);
          });
        
        if (models.length === 0) {
          throw new Error('No compatible models found. Check your API key.');
        }
        
        setAvailableModels(models);
        setStep('model');
      } catch (error: any) {
        setError(`Error fetching OpenAI models: ${error.message}`);
        setApiKey('');
      } finally {
        setIsLoading(false);
      }
    } else {
      // For other OpenAI Compatible providers, go directly to model step
      setIsLoading(false);
      setStep('model');
    }
  };

  const handleModelSelect = (model: string) => {
    setSelectedModel(model);
    onProviderSelect(selectedProvider!, model, apiKey, selectedProvider === 'OpenAI' ? baseURL : undefined);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const goBack = () => {
    setError('');
    if (step === 'openai-provider') {
      setStep('provider');
      setSelectedProvider(null);
      setSelectedOpenAIProvider(null);
      setBaseURL('');
      setCustomBaseURL('');
    } else if (step === 'custom-url') {
      setStep('openai-provider');
      setCustomBaseURL('');
    } else if (step === 'apikey') {
      if (selectedProvider === 'OpenAI') {
        if (selectedOpenAIProvider?.isCustom) {
          setStep('custom-url');
        } else {
          setStep('openai-provider');
        }
      } else {
        setStep('provider');
        setSelectedProvider(null);
      }
      setApiKey('');
    } else if (step === 'model') {
      if (selectedProvider === 'Gemini' || (selectedProvider === 'OpenAI' && selectedOpenAIProvider?.fetchModels)) {
        setStep('apikey');
        setAvailableModels([]);
      } else {
        setStep('apikey');
      }
      setSelectedModel('');
    }
  };

  if (showLogo) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-green-400 font-mono text-xl mb-4">
            <pre className="whitespace-pre text-xs sm:text-sm leading-tight">
{`
    ██╗ ██╗██╗  ██╗██╗   ██╗███████╗     █████╗ ██╗
   ███║███║██║ ██╔╝██║   ██║╚════██║    ██╔══██╗██║
   ╚██║╚██║█████╔╝ ██║   ██║    ██╔╝    ███████║██║
    ██║ ██║██╔═██╗ ██║   ██║   ██╔╝     ██╔══██║██║
    ██║ ██║██║  ██╗╚██████╔╝   ██║      ██║  ██║██║
    ╚═╝ ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝      ╚═╝  ╚═╝╚═╝

         ██████╗██╗  ██╗ █████╗ ████████╗
        ██╔════╝██║  ██║██╔══██╗╚══██╔══╝
        ██║     ███████║███████║   ██║   
        ██║     ██╔══██║██╔══██║   ██║   
        ╚██████╗██║  ██║██║  ██║   ██║   
         ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   
`}
            </pre>
          </div>
          <p className="text-green-300 text-sm font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-black/60 backdrop-blur-sm border border-green-500/20 rounded-lg p-6 shadow-2xl">
          <div className="text-center mb-6">
            <Terminal className="w-12 h-12 text-green-400 mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-green-400 font-mono">11ku7 AI Chat</h1>
            <p className="text-gray-400 text-sm mt-1">Version 1.0.0</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm font-mono">{error}</p>
            </div>
          )}

          {step === 'provider' && (
            <div className="space-y-3">
              <p className="text-gray-300 font-mono text-sm mb-4">Select AI Provider:</p>
              <button
                onClick={() => handleProviderSelect('Gemini')}
                className="w-full p-4 bg-gray-800/50 hover:bg-green-500/10 border border-gray-700 hover:border-green-500/50 rounded-lg transition-all duration-200 flex items-center space-x-3"
              >
                <Terminal className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-mono">Gemini</span>
              </button>
              <button
                onClick={() => handleProviderSelect('OpenAI')}
                className="w-full p-4 bg-gray-800/50 hover:bg-green-500/10 border border-gray-700 hover:border-green-500/50 rounded-lg transition-all duration-200 flex items-center space-x-3"
              >
                <Globe className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-mono">OpenAI Compatible</span>
              </button>
            </div>
          )}

          {step === 'openai-provider' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-4 h-4 text-green-400" />
                <p className="text-gray-300 font-mono text-sm">
                  Select OpenAI Compatible Provider:
                </p>
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50 flex items-center justify-between"
                >
                  <span>
                    {selectedOpenAIProvider ? selectedOpenAIProvider.name : 'Choose a provider...'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProviderDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showProviderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                    {openAIProviders.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => handleOpenAIProviderSelect(provider)}
                        className="w-full p-3 text-left hover:bg-gray-800 transition-colors duration-200 border-b border-gray-700 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          {provider.isCustom && <Plus className="w-4 h-4 text-purple-400" />}
                          <div className="flex-1">
                            <div className="text-green-400 font-mono text-sm font-semibold">
                              {provider.name}
                            </div>
                            <div className="text-gray-400 text-xs mt-1">
                              {provider.description}
                            </div>
                            {!provider.isCustom && (
                              <div className="text-gray-500 text-xs mt-1 font-mono">
                                {provider.baseURL}
                              </div>
                            )}
                            {!provider.requiresApiKey && (
                              <div className="text-green-400 text-xs mt-1 font-semibold">
                                No API key required
                              </div>
                            )}
                            {provider.fetchModels && (
                              <div className="text-blue-400 text-xs mt-1 font-semibold">
                                Auto-fetch available models
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedOpenAIProvider && !selectedOpenAIProvider.isCustom && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="text-green-400 font-mono text-sm font-semibold mb-1">
                    Selected: {selectedOpenAIProvider.name}
                  </div>
                  <div className="text-gray-400 text-xs mb-2">
                    {selectedOpenAIProvider.description}
                  </div>
                  <div className="text-gray-300 text-xs font-mono">
                    Base URL: {selectedOpenAIProvider.baseURL}
                  </div>
                  {!selectedOpenAIProvider.requiresApiKey && (
                    <div className="text-green-400 text-xs mt-2 font-semibold">
                      ✓ No API key required for this provider
                    </div>
                  )}
                  {selectedOpenAIProvider.fetchModels && (
                    <div className="text-blue-400 text-xs mt-2 font-semibold">
                      ✓ Will automatically fetch available models
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => selectedOpenAIProvider && (selectedOpenAIProvider.isCustom ? setStep('custom-url') : (selectedOpenAIProvider.requiresApiKey ? setStep('apikey') : setStep('model')))}
                  disabled={!selectedOpenAIProvider}
                  className="flex-1 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-mono text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Continue</span>
                </button>
                <button
                  onClick={goBack}
                  className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'custom-url' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Plus className="w-4 h-4 text-purple-400" />
                <p className="text-gray-300 font-mono text-sm">
                  Enter Custom API Base URL:
                </p>
              </div>
              
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg mb-4">
                <div className="text-purple-400 font-mono text-sm font-semibold mb-1">
                  Custom Provider Setup
                </div>
                <div className="text-gray-400 text-xs">
                  Enter the base URL for your custom OpenAI-compatible API endpoint
                </div>
                <div className="text-gray-500 text-xs mt-1">
                  Example: https://api.example.com/v1
                </div>
              </div>
              
              <input
                type="url"
                value={customBaseURL}
                onChange={(e) => setCustomBaseURL(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleCustomURLSubmit)}
                placeholder="https://api.example.com/v1"
                className="w-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50"
                autoFocus
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCustomURLSubmit}
                  disabled={!customBaseURL.trim()}
                  className="flex-1 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-mono text-sm"
                >
                  <Check className="w-4 h-4" />
                  <span>Continue</span>
                </button>
                <button
                  onClick={goBack}
                  className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'apikey' && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Key className="w-4 h-4 text-green-400" />
                <p className="text-gray-300 font-mono text-sm">
                  Enter {selectedProvider === 'Gemini' ? 'Gemini' : selectedOpenAIProvider?.name || 'OpenAI'} API Key:
                </p>
              </div>
              
              {selectedOpenAIProvider && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                  <div className="text-blue-400 font-mono text-xs">
                    Provider: {selectedOpenAIProvider.name}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    {selectedOpenAIProvider.isCustom ? customBaseURL : selectedOpenAIProvider.baseURL}
                  </div>
                  {selectedOpenAIProvider.fetchModels && (
                    <div className="text-green-400 text-xs mt-1 font-semibold">
                      Will fetch available models after API key validation
                    </div>
                  )}
                </div>
              )}
              
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, handleApiKeySubmit)}
                placeholder="Enter your API key..."
                className="w-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50"
                autoFocus
                disabled={isLoading}
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleApiKeySubmit}
                  disabled={!apiKey.trim() || isLoading}
                  className="flex-1 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-mono text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>
                        {selectedProvider === 'Gemini' ? 'Fetching Models...' : 
                         selectedOpenAIProvider?.fetchModels ? 'Fetching Models...' : 'Validating...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Continue</span>
                    </>
                  )}
                </button>
                <button
                  onClick={goBack}
                  disabled={isLoading}
                  className="p-3 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'model' && (
            <div className="space-y-3">
              <p className="text-gray-300 font-mono text-sm mb-4">
                {(selectedProvider === 'Gemini' || (selectedProvider === 'OpenAI' && selectedOpenAIProvider?.fetchModels)) ? 'Select Model:' : 'Enter Model Name:'}
              </p>
              
              {(selectedProvider === 'Gemini' || (selectedProvider === 'OpenAI' && selectedOpenAIProvider?.fetchModels)) ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model}
                      onClick={() => handleModelSelect(model)}
                      className="w-full p-3 bg-gray-800/50 hover:bg-green-500/10 border border-gray-700 hover:border-green-500/50 rounded-lg transition-all duration-200 text-left"
                    >
                      <span className="text-blue-400 font-mono text-sm">{model}</span>
                    </button>
                  ))}
                  <button
                    onClick={goBack}
                    className="w-full p-2 text-gray-400 hover:text-green-400 transition-colors duration-200 font-mono text-sm"
                  >
                    ← Back to API Key
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedOpenAIProvider && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-blue-400 font-mono text-xs mb-1">
                        Provider: {selectedOpenAIProvider.name}
                      </div>
                      <div className="text-gray-400 text-xs mb-2">
                        {selectedOpenAIProvider.isCustom ? customBaseURL : selectedOpenAIProvider.baseURL}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {selectedOpenAIProvider.name === 'OpenRouter' && 'e.g., anthropic/claude-3-sonnet, openai/gpt-4-turbo'}
                        {selectedOpenAIProvider.name === 'OpenAI' && 'e.g., gpt-4-turbo-preview, gpt-3.5-turbo'}
                        {selectedOpenAIProvider.name === 'Ollama' && 'e.g., llama2, codellama, mistral, qwen2.5-coder'}
                        {selectedOpenAIProvider.isCustom && 'Enter the model name supported by your API'}
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, () => selectedModel.trim() && handleModelSelect(selectedModel))}
                    placeholder={
                      selectedOpenAIProvider?.name === 'OpenRouter' ? 'anthropic/claude-3-sonnet' :
                      selectedOpenAIProvider?.name === 'OpenAI' ? 'gpt-4-turbo-preview' :
                      selectedOpenAIProvider?.name === 'Ollama' ? 'llama2' :
                      selectedOpenAIProvider?.isCustom ? 'model-name' :
                      'Enter model name...'
                    }
                    className="w-full p-3 bg-gray-900/50 border border-gray-700 focus:border-green-500 rounded-lg text-green-400 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-green-500/50"
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => selectedModel.trim() && handleModelSelect(selectedModel)}
                      disabled={!selectedModel.trim()}
                      className="flex-1 p-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 font-mono text-sm"
                    >
                      <Check className="w-4 h-4" />
                      <span>Start Chat</span>
                    </button>
                    <button
                      onClick={goBack}
                      className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderSelection;