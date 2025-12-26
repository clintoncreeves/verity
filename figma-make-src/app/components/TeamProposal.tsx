import React, { useState } from 'react';

interface TeamProposalProps {
  team: {
    id: number;
    name: string;
    lead: string;
    members: string[];
    philosophy: string;
    approach: string;
    component: any;
    principles: string[];
  };
  index: number;
  darkMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

export function TeamProposal({ team, index, darkMode, isSelected, onSelect }: TeamProposalProps) {
  const [expanded, setExpanded] = useState(false);
  const Component = team.component;

  return (
    <div className={`rounded-xl overflow-hidden transition-all ${
      isSelected 
        ? darkMode
          ? 'ring-2 ring-teal-500 shadow-xl shadow-teal-500/20'
          : 'ring-2 ring-teal-600 shadow-xl shadow-teal-600/20'
        : darkMode
          ? 'border border-slate-800'
          : 'border border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`px-6 py-5 ${
        darkMode ? 'bg-slate-900' : 'bg-white'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-xl font-serif ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                {team.name}
              </h3>
              {isSelected && (
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  darkMode ? 'bg-teal-900 text-teal-300' : 'bg-teal-100 text-teal-700'
                }`}>
                  Selected
                </span>
              )}
            </div>
            <p className={`text-sm italic ${
              darkMode ? 'text-teal-400' : 'text-teal-600'
            }`}>
              "{team.philosophy}"
            </p>
          </div>
          <button
            onClick={onSelect}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isSelected
                ? darkMode
                  ? 'bg-teal-600 text-white hover:bg-teal-500'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
                : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-neutral-100 text-slate-700 hover:bg-neutral-200'
            }`}
          >
            {isSelected ? '✓ Selected' : 'Select This'}
          </button>
        </div>
        <p className={`leading-relaxed ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {team.approach}
        </p>
      </div>

      {/* Main Display */}
      <div className={`px-6 py-16 ${
        darkMode ? 'bg-slate-800' : 'bg-neutral-50'
      }`}>
        <div className="flex items-center justify-center">
          <Component variant="full" size="large" darkMode={darkMode} />
        </div>
      </div>

      {/* Variants Grid */}
      <div className={`grid grid-cols-3 gap-px ${
        darkMode ? 'bg-slate-700' : 'bg-neutral-200'
      }`}>
        <div className={`px-6 py-8 flex flex-col items-center justify-center ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <Component variant="full" size="small" darkMode={darkMode} />
          <p className={`text-xs mt-4 ${
            darkMode ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Full Lockup
          </p>
        </div>
        <div className={`px-6 py-8 flex flex-col items-center justify-center ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <Component variant="symbol" size="small" darkMode={darkMode} />
          <p className={`text-xs mt-4 ${
            darkMode ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Symbol Only
          </p>
        </div>
        <div className={`px-6 py-8 flex flex-col items-center justify-center ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <Component variant="wordmark" size="small" darkMode={darkMode} />
          <p className={`text-xs mt-4 ${
            darkMode ? 'text-slate-500' : 'text-slate-500'
          }`}>
            Wordmark
          </p>
        </div>
      </div>

      {/* Expandable Details */}
      <div className={`border-t ${darkMode ? 'border-slate-700' : 'border-neutral-200'}`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${
            darkMode 
              ? 'bg-slate-900 hover:bg-slate-800 text-slate-300' 
              : 'bg-white hover:bg-neutral-50 text-slate-700'
          }`}
        >
          <span className="text-sm font-medium">
            Team Members & Design Principles
          </span>
          <span className="text-xs">{expanded ? '−' : '+'}</span>
        </button>
        
        {expanded && (
          <div className={`px-6 py-6 border-t ${
            darkMode ? 'border-slate-700 bg-slate-900' : 'border-neutral-200 bg-white'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Design Team
                </h4>
                <ul className={`space-y-2 text-sm ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {team.members.map((member, idx) => (
                    <li key={idx}>• {member}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Core Principles
                </h4>
                <ul className={`space-y-2 text-sm ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  {team.principles.map((principle, idx) => (
                    <li key={idx} className="italic">"{principle}"</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Scale Test */}
            <div className={`mt-6 pt-6 border-t ${
              darkMode ? 'border-slate-800' : 'border-neutral-200'
            }`}>
              <h4 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Favicon Scale Test
              </h4>
              <div className="flex items-end gap-6">
                {[16, 24, 32, 48].map(size => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <div 
                      className={`rounded flex items-center justify-center ${
                        darkMode ? 'bg-slate-800' : 'bg-neutral-100'
                      }`}
                      style={{ width: `${size + 16}px`, height: `${size + 16}px` }}
                    >
                      <Component variant="symbol" size="custom" customSize={size} darkMode={darkMode} />
                    </div>
                    <span className={`text-xs ${
                      darkMode ? 'text-slate-500' : 'text-slate-500'
                    }`}>
                      {size}px
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
