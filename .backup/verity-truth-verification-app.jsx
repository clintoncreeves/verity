import React, { useState } from 'react';
import { Search, Upload, Link, Shield, AlertTriangle, CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, ExternalLink, Eye, FileText, Image, Globe, Clock, Users, BookOpen, Zap, Info } from 'lucide-react';

// Mock verification engine - in production, this would call actual APIs
const mockVerify = async (input, type) => {
  await new Promise(r => setTimeout(r, 2000));
  
  const scenarios = {
    'The Earth is flat': {
      category: 'confirmed_false',
      score: 2,
      summary: 'This claim is demonstrably false according to overwhelming scientific evidence.',
      sources: [
        { name: 'NASA', type: 'Government/Scientific Agency', url: 'https://nasa.gov', reliability: 98 },
        { name: 'Nature Journal', type: 'Peer-Reviewed Publication', url: 'https://nature.com', reliability: 97 },
        { name: 'European Space Agency', type: 'Scientific Agency', url: 'https://esa.int', reliability: 98 }
      ],
      evidence: [
        'Satellite imagery from multiple space agencies shows Earth as an oblate spheroid',
        'Ships disappearing hull-first over the horizon demonstrates curvature',
        'Different star constellations visible from different latitudes confirms spherical shape',
        'Time zone differences only work on a rotating sphere'
      ],
      existingFactChecks: [
        { org: 'Snopes', verdict: 'False', date: '2023-04-15' },
        { org: 'PolitiFact', verdict: 'Pants on Fire', date: '2022-11-20' }
      ]
    },
    'COVID-19 vaccines contain microchips': {
      category: 'confirmed_false',
      score: 3,
      summary: 'This claim has been thoroughly debunked. No microchips exist in any approved vaccines.',
      sources: [
        { name: 'CDC', type: 'Government Health Agency', url: 'https://cdc.gov', reliability: 95 },
        { name: 'FDA', type: 'Regulatory Agency', url: 'https://fda.gov', reliability: 96 },
        { name: 'British Medical Journal', type: 'Peer-Reviewed Publication', url: 'https://bmj.com', reliability: 97 }
      ],
      evidence: [
        'Complete ingredient lists for all approved vaccines are publicly available',
        'Vaccine vials and syringes are too small to contain any microchip technology',
        'Current microchip technology cannot be injected through vaccine needles',
        'No credible evidence of microchips found in any vaccine analysis'
      ],
      existingFactChecks: [
        { org: 'Full Fact', verdict: 'False', date: '2024-01-10' },
        { org: 'Reuters Fact Check', verdict: 'False', date: '2023-08-22' },
        { org: 'AFP Fact Check', verdict: 'False', date: '2023-06-15' }
      ]
    },
    'Water boils at 100 degrees Celsius at sea level': {
      category: 'verified_fact',
      score: 98,
      summary: 'This is a verified scientific fact under standard atmospheric pressure (1 atm).',
      sources: [
        { name: 'NIST (National Institute of Standards)', type: 'Scientific Standards Body', url: 'https://nist.gov', reliability: 99 },
        { name: 'Chemistry LibreTexts', type: 'Educational Resource', url: 'https://chem.libretexts.org', reliability: 92 }
      ],
      evidence: [
        'Boiling point of water at 1 atmosphere pressure is precisely 100°C / 212°F',
        'This is a fundamental physical constant used in scientific calibration',
        'Slight variations occur with altitude and atmospheric pressure changes'
      ],
      existingFactChecks: []
    },
    'default': {
      category: 'partially_verified',
      score: 55,
      summary: 'This claim contains elements that can be verified and others that require more context.',
      sources: [
        { name: 'Associated Press', type: 'News Wire Service', url: 'https://ap.org', reliability: 88 },
        { name: 'Reuters', type: 'News Wire Service', url: 'https://reuters.com', reliability: 89 }
      ],
      evidence: [
        'Some factual elements of this claim align with available evidence',
        'Other aspects require additional context or are subject to interpretation',
        'Recommend consulting primary sources for complete verification'
      ],
      existingFactChecks: []
    }
  };
  
  const match = Object.keys(scenarios).find(key => 
    input.toLowerCase().includes(key.toLowerCase())
  );
  
  return scenarios[match] || scenarios['default'];
};

const categoryConfig = {
  verified_fact: {
    label: 'Verified Fact',
    color: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    icon: CheckCircle,
    description: 'Confirmed by multiple authoritative sources'
  },
  expert_consensus: {
    label: 'Expert Consensus',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    icon: Users,
    description: 'Agreed upon by domain experts with supporting evidence'
  },
  partially_verified: {
    label: 'Partially Verified',
    color: 'from-amber-400 to-yellow-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    icon: HelpCircle,
    description: 'Some elements verified, others uncertain or unverifiable'
  },
  opinion: {
    label: 'Opinion / Analysis',
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    icon: BookOpen,
    description: 'Interpretive judgment based on facts'
  },
  speculation: {
    label: 'Speculation',
    color: 'from-slate-400 to-gray-500',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/30',
    text: 'text-slate-400',
    icon: HelpCircle,
    description: 'Prediction or hypothesis without verification'
  },
  disputed: {
    label: 'Disputed',
    color: 'from-orange-500 to-red-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    icon: AlertTriangle,
    description: 'Conflicting information from authoritative sources'
  },
  likely_false: {
    label: 'Likely False',
    color: 'from-red-400 to-rose-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    icon: XCircle,
    description: 'Contradicted by available evidence'
  },
  confirmed_false: {
    label: 'Confirmed Misinformation',
    color: 'from-red-600 to-red-700',
    bg: 'bg-red-600/10',
    border: 'border-red-600/30',
    text: 'text-red-500',
    icon: XCircle,
    description: 'Previously debunked by fact-checking organizations'
  }
};

const VerityApp = () => {
  const [inputType, setInputType] = useState('text');
  const [query, setQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    sources: true,
    evidence: true,
    factChecks: true
  });

  const handleVerify = async () => {
    if (!query.trim()) return;
    setIsVerifying(true);
    setResult(null);
    
    try {
      const verification = await mockVerify(query, inputType);
      setResult(verification);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const config = result ? categoryConfig[result.category] : null;
  const IconComponent = config?.icon || HelpCircle;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Verity
              </span>
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            AI-powered truth verification engine. Understand what's verifiable, what's opinion, and what's misinformation.
          </p>
        </header>

        {/* Input Section */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 mb-8 shadow-2xl shadow-black/20">
          {/* Input Type Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { type: 'text', icon: FileText, label: 'Text / Claim' },
              { type: 'image', icon: Image, label: 'Image' },
              { type: 'url', icon: Globe, label: 'URL / Link' }
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setInputType(type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  inputType === type
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Input Field */}
          {inputType === 'image' ? (
            <div className="border-2 border-dashed border-slate-600 rounded-2xl p-12 text-center hover:border-indigo-500/50 transition-colors cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-slate-500" />
              <p className="text-slate-400 mb-2">Drop an image here or click to upload</p>
              <p className="text-sm text-slate-500">Supports PNG, JPG, WebP, GIF</p>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  inputType === 'url' 
                    ? 'Paste a URL to verify...' 
                    : 'Enter a claim, statement, or question to verify...'
                }
                className="w-full h-32 bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none"
              />
              {inputType === 'url' && (
                <Link className="absolute right-4 top-4 w-5 h-5 text-slate-500" />
              )}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isVerifying || !query.trim()}
            className={`w-full mt-4 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              isVerifying || !query.trim()
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40'
            }`}
          >
            {isVerifying ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Analyzing sources...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                Verify Now
              </>
            )}
          </button>

          {/* Example Queries */}
          <div className="mt-6 pt-6 border-t border-slate-700/50">
            <p className="text-sm text-slate-500 mb-3">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'The Earth is flat',
                'COVID-19 vaccines contain microchips',
                'Water boils at 100 degrees Celsius at sea level'
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1.5 text-sm bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-300 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Section */}
        {result && config && (
          <div className="space-y-6 animate-fadeIn">
            {/* Main Result Card */}
            <div className={`rounded-3xl border ${config.border} ${config.bg} backdrop-blur-xl p-8 shadow-2xl`}>
              {/* Score and Category */}
              <div className="flex items-start gap-6 mb-6">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h2 className={`text-2xl font-bold ${config.text}`}>
                      {config.label}
                    </h2>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700">
                      <span className="text-sm text-slate-400">Confidence</span>
                      <span className={`font-bold ${config.text}`}>{result.score}%</span>
                    </div>
                  </div>
                  <p className="text-slate-400">{config.description}</p>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-800/30 rounded-2xl p-5 mb-6 border border-slate-700/30">
                <p className="text-lg text-slate-200 leading-relaxed">{result.summary}</p>
              </div>

              {/* Confidence Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-slate-400 mb-2">
                  <span>Verifiability Score</span>
                  <span>{result.score}/100</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out rounded-full`}
                    style={{ width: `${result.score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Existing Fact Checks */}
            {result.existingFactChecks.length > 0 && (
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => toggleSection('factChecks')}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-semibold">Previously Fact-Checked</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-sm">
                      {result.existingFactChecks.length} organizations
                    </span>
                  </div>
                  {expandedSections.factChecks ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </button>
                {expandedSections.factChecks && (
                  <div className="px-5 pb-5">
                    <div className="grid gap-3">
                      {result.existingFactChecks.map((check, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm">
                              {check.org.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium">{check.org}</p>
                              <p className="text-sm text-slate-400 flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                {check.date}
                              </p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            check.verdict.toLowerCase().includes('false') || check.verdict.toLowerCase().includes('pants')
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {check.verdict}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sources */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => toggleSection('sources')}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-400" />
                  <span className="font-semibold">Sources Consulted</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                    {result.sources.length} sources
                  </span>
                </div>
                {expandedSections.sources ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {expandedSections.sources && (
                <div className="px-5 pb-5">
                  <div className="grid gap-3">
                    {result.sources.map((source, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {source.name}
                            <ExternalLink className="w-3 h-3 text-slate-500" />
                          </p>
                          <p className="text-sm text-slate-400">{source.type}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-400">Reliability</span>
                            <span className={`font-bold ${source.reliability >= 90 ? 'text-emerald-400' : source.reliability >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                              {source.reliability}%
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${source.reliability >= 90 ? 'bg-emerald-400' : source.reliability >= 70 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${source.reliability}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Evidence */}
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => toggleSection('evidence')}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-violet-400" />
                  <span className="font-semibold">Supporting Evidence</span>
                </div>
                {expandedSections.evidence ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </button>
              {expandedSections.evidence && (
                <div className="px-5 pb-5">
                  <ul className="space-y-3">
                    {result.evidence.map((item, i) => (
                      <li key={i} className="flex gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-violet-400">{i + 1}</span>
                        </div>
                        <p className="text-slate-300">{item}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400 leading-relaxed">
                <strong className="text-slate-300">Important:</strong> This analysis is probabilistic, not definitive. AI verification should be used as a starting point for understanding, not as the final word on truth. Always consult primary sources and exercise critical thinking.
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-slate-800 text-center">
          <p className="text-sm text-slate-500">
            Verity uses ClaimReview databases, web search, and AI analysis to provide verification confidence scores.
            <br />
            Built with transparency and epistemic humility in mind.
          </p>
        </footer>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VerityApp;
