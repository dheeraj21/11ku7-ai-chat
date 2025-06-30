import React, { useRef } from 'react';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';

interface SystemPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  placeholder?: string;
}

const SystemPromptInput: React.FC<SystemPromptInputProps> = ({ 
  value, 
  onChange, 
  enabled,
  onToggle,
  placeholder = "Enter custom system prompt to override default behavior..." 
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 h-full overflow-hidden flex flex-col">
      <div className="border-b border-green-500/20 pb-3 mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-green-400 font-mono text-sm font-semibold flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Custom System Prompt
          </h3>
          <button
            onClick={() => onToggle(!enabled)}
            className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-all duration-200 ${
              enabled 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
            }`}
          >
            {enabled ? (
              <ToggleRight className="w-4 h-4" />
            ) : (
              <ToggleLeft className="w-4 h-4" />
            )}
            <span className="text-xs font-mono">
              {enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
        <p className="text-gray-400 text-xs">
          {enabled 
            ? 'Custom system prompt is active - will override default behavior' 
            : 'Using default system behavior - toggle ON to use custom prompt'
          }
        </p>
      </div>
      
      <div className="flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!enabled}
          className={`w-full h-full p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-1 transition-all duration-200 ${
            enabled
              ? 'bg-gray-900/50 border-gray-700 focus:border-green-500 text-green-400 focus:ring-green-500/50'
              : 'bg-gray-900/30 border-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          placeholder={enabled ? placeholder : 'Enable custom system prompt to edit...'}
        />
      </div>
      
      {enabled && value.trim() && (
        <div className="mt-3 pt-3 border-t border-green-500/20 flex-shrink-0">
          <div className="text-xs text-gray-400 font-mono">
            <span className="text-green-400">Characters:</span> {value.length}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemPromptInput;