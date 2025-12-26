import React, { useState } from 'react';
import { ProposalB } from './components/proposals/ProposalB';

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');

  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'construction', label: 'Construction' },
    { id: 'applications', label: 'Applications' },
    { id: 'color', label: 'Color System' },
    { id: 'spacing', label: 'Spacing & Scale' },
    { id: 'usage', label: 'Usage Guidelines' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-slate-950' : 'bg-neutral-50'
    }`}>
      {/* Header */}
      <div className={`border-b ${darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-neutral-200 bg-white/80'} backdrop-blur-sm sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ProposalB variant="symbol" size="custom" customSize={32} darkMode={darkMode} />
                <h1 className={`text-2xl font-serif ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                  Verity Brand System
                </h1>
              </div>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Team Foundation: Structure Over Style
              </p>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                darkMode 
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' 
                  : 'bg-white text-slate-700 hover:bg-neutral-100 border border-neutral-200'
              }`}
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 overflow-x-auto">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? darkMode
                      ? 'bg-teal-900 text-teal-300'
                      : 'bg-teal-100 text-teal-700'
                    : darkMode
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-12">
            {/* Hero */}
            <section>
              <div className={`rounded-2xl p-20 flex items-center justify-center ${
                darkMode ? 'bg-slate-900' : 'bg-white border border-neutral-200'
              }`}>
                <ProposalB variant="full" size="large" darkMode={darkMode} />
              </div>
            </section>

            {/* Design Philosophy */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <h3 className={`font-semibold mb-3 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  The Concept
                </h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Verity is infrastructure for truth. The square frame represents the structured system, while the V-shaped void reveals what's missing—the gap that needs verification.
                </p>
              </div>

              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <h3 className={`font-semibold mb-3 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  The Philosophy
                </h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Structure over style. Form follows function follows purpose. Design the system, not just the artifact. Clarity is kindness.
                </p>
              </div>

              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <h3 className={`font-semibold mb-3 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  The Execution
                </h3>
                <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Geometric precision ensures recognition at any scale. Clean strokes and consistent weight maintain clarity from 16px favicon to billboard.
                </p>
              </div>
            </section>

            {/* Variants */}
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Logo Variants
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-xl p-12 flex flex-col items-center justify-center ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <ProposalB variant="full" size="medium" darkMode={darkMode} />
                  <p className={`text-xs mt-6 uppercase tracking-wide ${
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Primary Lockup
                  </p>
                </div>

                <div className={`rounded-xl p-12 flex flex-col items-center justify-center ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                  <p className={`text-xs mt-6 uppercase tracking-wide ${
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Symbol Mark
                  </p>
                </div>

                <div className={`rounded-xl p-12 flex flex-col items-center justify-center ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <ProposalB variant="wordmark" size="medium" darkMode={darkMode} />
                  <p className={`text-xs mt-6 uppercase tracking-wide ${
                    darkMode ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    Wordmark
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Construction Section */}
        {activeSection === 'construction' && (
          <div className="space-y-12">
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Logo Construction
              </h2>
              
              <div className={`rounded-xl p-12 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <div className="max-w-2xl mx-auto">
                  <svg 
                    width="100%" 
                    viewBox="0 0 400 400" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Grid */}
                    <g opacity="0.1">
                      {[...Array(9)].map((_, i) => (
                        <React.Fragment key={i}>
                          <line x1={50 + i * 37.5} y1="50" x2={50 + i * 37.5} y2="350" stroke={darkMode ? '#fff' : '#000'} strokeWidth="0.5" />
                          <line x1="50" y1={50 + i * 37.5} x2="350" y2={50 + i * 37.5} stroke={darkMode ? '#fff' : '#000'} strokeWidth="0.5" />
                        </React.Fragment>
                      ))}
                    </g>

                    {/* Square frame */}
                    <rect 
                      x="100" 
                      y="100" 
                      width="200" 
                      height="200" 
                      stroke="#0D9488"
                      strokeWidth="8"
                      fill="none"
                    />
                    
                    {/* V-shaped void */}
                    <path 
                      d="M 150 300 L 200 225 L 250 300" 
                      stroke="#0D9488"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    
                    {/* Apex marker */}
                    <circle 
                      cx="200" 
                      cy="225" 
                      r="6" 
                      fill="#0D9488"
                    />

                    {/* Dimension lines */}
                    <g stroke={darkMode ? '#64748b' : '#94a3b8'} strokeWidth="1" opacity="0.6">
                      {/* Width */}
                      <line x1="100" y1="320" x2="300" y2="320" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead-reverse)" />
                      <text x="200" y="340" textAnchor="middle" fill={darkMode ? '#94a3b8' : '#64748b'} fontSize="12">1x</text>
                      
                      {/* Height */}
                      <line x1="320" y1="100" x2="320" y2="300" markerEnd="url(#arrowhead)" markerStart="url(#arrowhead-reverse)" />
                      <text x="345" y="205" fill={darkMode ? '#94a3b8' : '#64748b'} fontSize="12">1x</text>
                    </g>

                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                        <polygon points="0 0, 10 5, 0 10" fill={darkMode ? '#64748b' : '#94a3b8'} />
                      </marker>
                      <marker id="arrowhead-reverse" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
                        <polygon points="10 0, 0 5, 10 10" fill={darkMode ? '#64748b' : '#94a3b8'} />
                      </marker>
                    </defs>
                  </svg>
                </div>
              </div>
            </section>

            {/* Specifications */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Geometric Principles
                </h3>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li>• Perfect square ratio (1:1)</li>
                  <li>• Stroke weight: 2.5% of total height</li>
                  <li>• V apex positioned at 75% height</li>
                  <li>• Equal margins all sides (20% of total)</li>
                  <li>• Consistent stroke caps and joins</li>
                </ul>
              </div>

              <div className={`rounded-xl p-6 ${
                darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
              }`}>
                <h3 className={`font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Optical Adjustments
                </h3>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <li>• Apex marker compensates for visual weight</li>
                  <li>• Rounded caps prevent sharp edges at small sizes</li>
                  <li>• V angle optimized for clarity at 16px</li>
                  <li>• Slight overextension at corners for crispness</li>
                </ul>
              </div>
            </section>
          </div>
        )}

        {/* Applications Section */}
        {activeSection === 'applications' && (
          <div className="space-y-12">
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Real-World Applications
              </h2>

              {/* App Header */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Web Application Header
                </h3>
                <div className={`rounded-xl overflow-hidden border ${
                  darkMode ? 'border-slate-800' : 'border-neutral-200'
                }`}>
                  <div className={`px-6 py-4 flex items-center justify-between border-b ${
                    darkMode ? 'border-slate-800 bg-slate-900' : 'border-neutral-200 bg-white'
                  }`}>
                    <ProposalB variant="full" size="small" darkMode={darkMode} />
                    <div className="flex items-center gap-4">
                      <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Dashboard</span>
                      <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Checks</span>
                      <button className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm">
                        Verify
                      </button>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className={`h-3 rounded mb-4 ${darkMode ? 'bg-slate-800' : 'bg-neutral-100'}`} style={{ width: '40%' }} />
                    <div className={`h-3 rounded mb-4 ${darkMode ? 'bg-slate-800' : 'bg-neutral-100'}`} style={{ width: '70%' }} />
                    <div className={`h-3 rounded ${darkMode ? 'bg-slate-800' : 'bg-neutral-100'}`} style={{ width: '50%' }} />
                  </div>
                </div>
              </div>

              {/* Mobile App Icons */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Mobile App Icon
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { bg: '#0D9488', label: 'Primary Teal' },
                    { bg: '#ffffff', label: 'White (Dark BG)', border: true },
                    { bg: 'linear-gradient(135deg, #0D9488 0%, #14b8a6 100%)', label: 'Gradient Variant' },
                    { bg: '#1e293b', label: 'Dark Slate' }
                  ].map((style, idx) => (
                    <div key={idx} className={`rounded-xl p-6 text-center ${
                      darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                    }`}>
                      <div 
                        className="w-20 h-20 mx-auto rounded-2xl shadow-lg flex items-center justify-center mb-3"
                        style={{ 
                          background: style.bg,
                          border: style.border ? '1px solid #e5e7eb' : 'none'
                        }}
                      >
                        <ProposalB 
                          variant="symbol" 
                          size="custom" 
                          customSize={48} 
                          darkMode={false} 
                          inverted={idx !== 1}
                        />
                      </div>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {style.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Card */}
              <div className="mb-6">
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Business Card
                </h3>
                <div className={`rounded-xl p-8 ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <div 
                    className="max-w-md mx-auto rounded-lg p-8 shadow-xl"
                    style={{ 
                      aspectRatio: '1.75',
                      background: darkMode ? '#0f172a' : '#ffffff',
                      border: `1px solid ${darkMode ? '#1e293b' : '#e5e7eb'}`
                    }}
                  >
                    <div className="flex items-start justify-between mb-6">
                      <ProposalB variant="symbol" size="custom" customSize={32} darkMode={darkMode} />
                      <ProposalB variant="wordmark" size="custom" customSize={20} darkMode={darkMode} />
                    </div>
                    <div className="mt-8">
                      <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Sarah Chen
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Senior Verification Analyst
                      </p>
                      <p className={`text-xs mt-3 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        verity.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Media */}
              <div>
                <h3 className={`text-sm font-semibold mb-3 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Social Media Profile
                </h3>
                <div className={`rounded-xl overflow-hidden border ${
                  darkMode ? 'border-slate-800 bg-slate-900' : 'border-neutral-200 bg-white'
                }`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#0D9488' }}
                      >
                        <ProposalB variant="symbol" size="custom" customSize={40} darkMode={false} inverted={true} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ProposalB variant="wordmark" size="custom" customSize={18} darkMode={darkMode} />
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M14.5 7.5L6 12.5L6 2.5L14.5 7.5Z" fill="#0D9488"/>
                          </svg>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          @verity · AI-powered truth verification
                        </p>
                        <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Helping people understand what is verifiable versus opinion or misinformation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Color System Section */}
        {activeSection === 'color' && (
          <div className="space-y-12">
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Color System
              </h2>

              {/* Primary Color */}
              <div className="mb-8">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Primary Brand Color
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-xl overflow-hidden border border-neutral-200">
                    <div className="h-32" style={{ background: '#0D9488' }} />
                    <div className="p-4 bg-white">
                      <p className="font-mono text-sm font-semibold text-slate-900 mb-1">#0D9488</p>
                      <p className="text-xs text-slate-600">Teal 600 · Primary</p>
                      <p className="text-xs text-slate-500 mt-2">Logo, CTAs, Accents</p>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-neutral-200">
                    <div className="h-32" style={{ background: '#14b8a6' }} />
                    <div className="p-4 bg-white">
                      <p className="font-mono text-sm font-semibold text-slate-900 mb-1">#14b8a6</p>
                      <p className="text-xs text-slate-600">Teal 500 · Light Mode</p>
                      <p className="text-xs text-slate-500 mt-2">Hover states, Highlights</p>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-neutral-200">
                    <div className="h-32" style={{ background: '#134e4a' }} />
                    <div className="p-4 bg-white">
                      <p className="font-mono text-sm font-semibold text-slate-900 mb-1">#134e4a</p>
                      <p className="text-xs text-slate-600">Teal 900 · Dark</p>
                      <p className="text-xs text-slate-500 mt-2">Dark mode accents</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Neutral Palette */}
              <div className="mb-8">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Neutral Palette
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { hex: '#1e293b', name: 'Slate 800', use: 'Text/Dark' },
                    { hex: '#475569', name: 'Slate 600', use: 'Secondary' },
                    { hex: '#94a3b8', name: 'Slate 400', use: 'Muted' },
                    { hex: '#e2e8f0', name: 'Slate 200', use: 'Borders' },
                    { hex: '#f8fafc', name: 'Slate 50', use: 'Backgrounds' }
                  ].map(color => (
                    <div key={color.hex} className="rounded-xl overflow-hidden border border-neutral-200">
                      <div className="h-20" style={{ background: color.hex }} />
                      <div className="p-3 bg-white">
                        <p className="font-mono text-xs font-semibold text-slate-900 mb-1">{color.hex}</p>
                        <p className="text-xs text-slate-600">{color.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{color.use}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Logo on Colors */}
              <div>
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Logo on Colored Backgrounds
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { bg: '#0D9488', label: 'Teal', invert: true },
                    { bg: '#1e293b', label: 'Dark Slate', invert: true },
                    { bg: '#ffffff', label: 'White', invert: false },
                    { bg: '#f8fafc', label: 'Light Gray', invert: false }
                  ].map((bg, idx) => (
                    <div key={idx} className={`rounded-xl p-8 flex flex-col items-center justify-center border ${
                      bg.bg === '#ffffff' ? 'border-neutral-200' : 'border-transparent'
                    }`} style={{ background: bg.bg }}>
                      <ProposalB variant="symbol" size="medium" darkMode={bg.invert} inverted={bg.invert} />
                      <p className={`text-xs mt-4 ${bg.invert ? 'text-white/60' : 'text-slate-500'}`}>
                        {bg.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Spacing & Scale Section */}
        {activeSection === 'spacing' && (
          <div className="space-y-12">
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Spacing & Scale
              </h2>

              {/* Clear Space */}
              <div className="mb-8">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Minimum Clear Space
                </h3>
                <div className={`rounded-xl p-12 ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <div className="max-w-md mx-auto">
                    <div className="relative inline-block">
                      <ProposalB variant="symbol" size="large" darkMode={darkMode} />
                      {/* Clear space indicators */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          border: `2px dashed ${darkMode ? '#475569' : '#cbd5e1'}`,
                          margin: '-20%'
                        }}
                      />
                    </div>
                    <p className={`text-sm mt-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Maintain clear space equal to 20% of the logo's height on all sides
                    </p>
                  </div>
                </div>
              </div>

              {/* Size Range */}
              <div className="mb-8">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Recommended Sizes
                </h3>
                <div className={`rounded-xl p-12 ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <div className="flex items-end justify-center gap-12 flex-wrap">
                    {[
                      { size: 16, label: 'Favicon' },
                      { size: 32, label: 'Small UI' },
                      { size: 48, label: 'Standard' },
                      { size: 80, label: 'Large' }
                    ].map(item => (
                      <div key={item.size} className="flex flex-col items-center gap-3">
                        <ProposalB variant="symbol" size="custom" customSize={item.size} darkMode={darkMode} />
                        <div className="text-center">
                          <p className={`text-xs font-mono ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {item.size}px
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Minimum Size */}
              <div>
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Minimum Size Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`rounded-xl p-6 ${
                    darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Digital/Screen
                    </h4>
                    <div className="flex items-center gap-4 mb-3">
                      <ProposalB variant="symbol" size="custom" customSize={16} darkMode={darkMode} />
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Symbol: 16px minimum
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Optimized for favicon use
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <ProposalB variant="wordmark" size="custom" customSize={12} darkMode={darkMode} />
                      <div>
                        <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Wordmark: 12px minimum
                        </p>
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                          Maintains legibility
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 ${
                    darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Print
                    </h4>
                    <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <li>• Symbol: 0.25" / 6mm minimum</li>
                      <li>• Full lockup: 0.75" / 19mm minimum</li>
                      <li>• Maintain stroke clarity</li>
                      <li>• Test print at target size</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Usage Guidelines Section */}
        {activeSection === 'usage' && (
          <div className="space-y-12">
            <section>
              <h2 className={`text-2xl font-serif mb-6 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`} style={{ fontFamily: 'Crimson Pro, serif' }}>
                Usage Guidelines
              </h2>

              {/* Do's */}
              <div className="mb-8">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide text-teal-600 dark:text-teal-400`}>
                  ✓ Do This
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-teal-900 bg-teal-950/30' : 'border-teal-200 bg-teal-50'
                  }`}>
                    <div className="mb-4 flex justify-center">
                      <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Use approved color variations
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-teal-900 bg-teal-950/30' : 'border-teal-200 bg-teal-50'
                  }`}>
                    <div className="mb-4 flex justify-center">
                      <div style={{ transform: 'scale(1)' }}>
                        <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                      </div>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Maintain proper proportions
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-teal-900 bg-teal-950/30' : 'border-teal-200 bg-teal-50'
                  }`}>
                    <div className="mb-4 flex justify-center p-4" style={{ background: '#0D9488' }}>
                      <ProposalB variant="symbol" size="medium" darkMode={false} inverted={true} />
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Respect clear space
                    </p>
                  </div>
                </div>
              </div>

              {/* Don'ts */}
              <div>
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide text-red-600 dark:text-red-400`}>
                  ✗ Don't Do This
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50">
                      <div style={{ transform: 'rotate(-15deg)' }}>
                        <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                      </div>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't rotate the logo
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50">
                      <div style={{ filter: 'hue-rotate(180deg)' }}>
                        <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                      </div>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't change colors
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50">
                      <div style={{ transform: 'scaleX(1.5)' }}>
                        <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                      </div>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't distort or stretch
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50">
                      <div style={{ filter: 'drop-shadow(0 0 10px #0D9488)' }}>
                        <ProposalB variant="symbol" size="medium" darkMode={darkMode} />
                      </div>
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't add effects or filters
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50" style={{ background: 'linear-gradient(to right, #0D9488, #14b8a6)' }}>
                      <ProposalB variant="symbol" size="medium" darkMode={false} inverted={true} />
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't place on busy backgrounds
                    </p>
                  </div>

                  <div className={`rounded-xl p-6 border-2 ${
                    darkMode ? 'border-red-900 bg-red-950/30' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="mb-4 flex justify-center opacity-50">
                      <ProposalB variant="symbol" size="custom" customSize={24} darkMode={darkMode} />
                    </div>
                    <p className={`text-sm text-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      Don't use below minimum size
                    </p>
                  </div>
                </div>
              </div>

              {/* Best Practices */}
              <div className="mt-12">
                <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wide ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Best Practices
                </h3>
                <div className={`rounded-xl p-6 ${
                  darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-neutral-200'
                }`}>
                  <ul className={`space-y-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>Always use vector files (.SVG) for digital applications</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>Test logo legibility at intended size before finalizing</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>Ensure sufficient contrast between logo and background</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>Use the symbol-only version for square formats (app icons, avatars)</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>Prefer the full lockup for horizontal layouts</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-teal-600 dark:text-teal-400">•</span>
                      <span>When in doubt, choose simplicity and clarity</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
