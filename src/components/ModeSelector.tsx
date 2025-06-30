import React from 'react';
import { Terminal, Code, Globe } from 'lucide-react';
import { OperationMode } from '../types';

interface ModeSelectorProps {
  currentMode: OperationMode;
  onModeChange: (mode: OperationMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, onModeChange }) => {
  const modeButtons = [
    { mode: 'none' as OperationMode, icon: Terminal, label: 'Normal', color: 'gray' },
    { mode: 'code' as OperationMode, icon: Code, label: 'Code', color: 'blue' },
    { mode: 'webapp' as OperationMode, icon: Globe, label: 'Webapp', color: 'purple' },
  ];

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      gray: isActive ? 'bg-gray-500/20 text-gray-300 border-gray-500/50' : 'text-gray-500 border-gray-700 hover:border-gray-500/50',
      blue: isActive ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'text-blue-500 border-gray-700 hover:border-blue-500/50',
      purple: isActive ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'text-purple-500 border-gray-700 hover:border-purple-500/50',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm border border-green-500/20 rounded-lg p-4 h-full overflow-hidden flex flex-col">
      <div className="mb-4">
        <p className="text-green-400 font-mono text-sm mb-3">Operation Mode:</p>
        
        {/* Horizontal layout for mode buttons */}
        <div className="grid grid-cols-3 gap-2">
          {modeButtons.map(({ mode, icon: Icon, label, color }) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              className={`p-2 rounded border transition-all duration-200 flex flex-col items-center space-y-1 ${
                getColorClasses(color, currentMode === mode)
              }`}
              title={label}
            >
              <Icon className="w-4 h-4" />
              <span className="text-xs font-mono font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Description */}
      <div className="flex-1 pt-4 border-t border-green-500/20">
        <div className="text-xs font-mono text-gray-400">
          <div className="mb-2">
            <span className="text-green-400">Current:</span> {currentMode}
          </div>
          
          {currentMode === 'none' && (
            <p>Raw AI responses with previous conversation context. Custom system prompt available.</p>
          )}
          {currentMode === 'code' && (
            <p>Clean code generation only - no explanations or descriptions. Includes conversation context.</p>
          )}
          {currentMode === 'webapp' && (
            <p>Single HTML file with embedded CSS/JS - no explanations. Includes conversation context.</p>
          )}
        </div>
      </div>

      {/* Version Info */}
      <div className="mt-auto pt-4 border-t border-green-500/20">
        <div className="text-xs font-mono text-center">
          <div className="text-gray-500">
            11ku7 AI Chat v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelector;