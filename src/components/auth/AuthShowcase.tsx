import { useState, useEffect, useMemo } from 'react';
import { Search, CheckCircle2, FileText, BarChart3, Globe, MessageSquare, Sparkles, ChevronDown, ChevronUp, Languages, Brain, Shield, TrendingUp, Users, Activity, Zap } from 'lucide-react';

type Tool = { id: string; icon: any; label: string; description: string };
type TabType = 'tools' | 'dashboard';

const TOOLS: Tool[] = [
  { id: 'keigo', icon: Brain, label: 'Keigo Checker', description: 'Verify Japanese politeness levels in business communication' },
  { id: 'minutes', icon: FileText, label: 'Meeting Minutes', description: 'Auto-generate structured meeting notes from transcripts' },
  { id: 'translate', icon: Languages, label: 'Translate JP ↔ EN', description: 'Bilingual translation optimized for business context' },
  { id: 'resume', icon: Shield, label: 'Resume Analyzer', description: 'AI-powered resume screening for Japanese market fit' },
];

const PROGRESS_ITEMS = [
  'Analyze meeting transcript',
  'Check keigo politeness',
  'Extract action items',
  'Generate bilingual summary',
  'Send follow-up email',
  'Archive to dashboard',
];

const CONTEXT_ITEMS = [
  { icon: FileText, label: 'Meeting Notes.md' },
  { icon: Globe, label: 'Translation API' },
  { icon: MessageSquare, label: 'Keigo Checker' },
  { icon: BarChart3, label: 'Sentiment Analysis' },
  { icon: Languages, label: 'JP ↔ EN' },
];

const STATS = [
  { icon: TrendingUp, label: 'Accuracy', value: '98.2%', change: '+2.1%' },
  { icon: Users, label: 'Active Users', value: '1,247', change: '+18%' },
  { icon: Activity, label: 'Tasks Today', value: '342', change: '+12%' },
  { icon: Zap, label: 'Avg Response', value: '1.2s', change: '-0.3s' },
];

const AuthShowcase = () => {
  const [activeTab, setActiveTab] = useState<TabType>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedItems, setCheckedItems] = useState<number[]>([]);
  const [progressOpen, setProgressOpen] = useState(true);
  const [contextOpen, setContextOpen] = useState(true);
  const [toolOpened, setToolOpened] = useState(false);

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS;
    const q = searchQuery.toLowerCase();
    return TOOLS.filter(t => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [searchQuery]);

  // Animate checkmarks
  useEffect(() => {
    const runAnimation = () => {
      setCheckedItems([]);
      PROGRESS_ITEMS.forEach((_, i) => {
        setTimeout(() => setCheckedItems(prev => [...prev, i]), 800 + i * 600);
      });
    };
    runAnimation();
    const interval = setInterval(runAnimation, PROGRESS_ITEMS.length * 600 + 3800);
    return () => clearInterval(interval);
  }, []);

  const handleOpenTool = () => {
    if (!selectedTool) return;
    setToolOpened(true);
    setTimeout(() => setToolOpened(false), 2000);
  };

  return (
    <div className="hidden lg:flex flex-1 flex-col justify-center items-center relative overflow-hidden bg-[hsl(222,30%,10%)] p-8 xl:p-12">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.06]" style={{
        backgroundImage: 'linear-gradient(hsl(0,0%,50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0,0%,50%) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Tab switcher */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-[hsl(222,25%,15%)] rounded-full p-1">
            {(['tools', 'dashboard'] as TabType[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeTab === tab
                    ? 'bg-[hsl(222,25%,22%)] text-white shadow-sm'
                    : 'text-[hsl(220,15%,55%)] hover:text-[hsl(220,15%,70%)]'
                }`}
              >
                {tab === 'tools' ? 'AI Tools' : 'Dashboard'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'tools' ? (
          /* ====== AI Tools Tab ====== */
          <div className="flex gap-4">
            <div className="flex-1">
              {/* Search bar */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(222,20%,20%)] bg-[hsl(222,25%,12%)] focus-within:border-[hsl(190,80%,42%)] focus-within:bg-[hsl(222,25%,14%)] transition-all duration-200 mb-4">
                <Search className="h-3.5 w-3.5 text-[hsl(220,15%,45%)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="bg-transparent text-xs text-white placeholder:text-[hsl(220,15%,45%)] outline-none w-full"
                />
              </div>

              {/* Tool cards grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {filteredTools.length === 0 && (
                  <div className="col-span-2 py-6 text-center text-[11px] text-[hsl(220,15%,45%)]">No tools match "{searchQuery}"</div>
                )}
                {filteredTools.map(tool => {
                  const isSelected = selectedTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setSelectedTool(isSelected ? null : tool.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all duration-200 text-center ${
                        isSelected
                          ? 'bg-[hsl(190,80%,42%,0.12)] border-[hsl(190,80%,42%)] shadow-[0_0_12px_hsl(190,80%,42%,0.15)]'
                          : 'bg-[hsl(222,25%,13%)] border-[hsl(222,20%,18%)] hover:border-[hsl(190,60%,30%)] hover:bg-[hsl(222,25%,15%)]'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[hsl(190,80%,42%,0.2)]' : 'bg-[hsl(190,80%,50%,0.1)]'
                      }`}>
                        <tool.icon className="h-4 w-4" style={{ color: isSelected ? 'hsl(190,80%,55%)' : 'hsl(190,80%,50%)' }} />
                      </div>
                      <span className="text-[11px] text-[hsl(220,15%,65%)] leading-tight">{tool.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected tool description */}
              {selectedTool && (
                <div className="mb-3 px-2 py-2 rounded-md bg-[hsl(222,25%,13%)] border border-[hsl(222,20%,18%)]">
                  <p className="text-[10px] text-[hsl(220,15%,55%)]">
                    {TOOLS.find(t => t.id === selectedTool)?.description}
                  </p>
                </div>
              )}

              {/* Tool opened feedback */}
              {toolOpened && (
                <div className="mb-3 flex items-center gap-2 px-2 py-2 rounded-md bg-[hsl(150,60%,20%,0.3)] border border-[hsl(150,60%,30%)]">
                  <CheckCircle2 className="h-3 w-3 text-[hsl(150,60%,50%)]" />
                  <p className="text-[10px] text-[hsl(150,60%,60%)]">
                    {TOOLS.find(t => t.id === selectedTool)?.label} launched!
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedTool(null); setSearchQuery(''); }}
                  className="flex-1 text-center py-1.5 rounded-md text-[11px] text-[hsl(220,15%,50%)] bg-[hsl(222,25%,13%)] border border-[hsl(222,20%,18%)] hover:bg-[hsl(222,25%,16%)] hover:text-[hsl(220,15%,70%)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOpenTool}
                  disabled={!selectedTool}
                  className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-medium transition-all ${
                    selectedTool
                      ? 'text-white bg-[hsl(190,80%,42%)] hover:bg-[hsl(190,80%,48%)] shadow-sm'
                      : 'text-[hsl(220,15%,40%)] bg-[hsl(222,25%,16%)] cursor-not-allowed'
                  }`}
                >
                  Open
                </button>
              </div>
            </div>

            {/* Right panel - Progress + Context */}
            <div className="flex-1 space-y-4">
              {/* Progress card */}
              <div className="rounded-lg bg-[hsl(222,25%,12%)] border border-[hsl(222,20%,18%)] p-3.5">
                <button onClick={() => setProgressOpen(!progressOpen)} className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-semibold text-white">Progress</span>
                  {progressOpen ? <ChevronUp className="h-3.5 w-3.5 text-[hsl(220,15%,45%)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[hsl(220,15%,45%)]" />}
                </button>
                {progressOpen && (
                  <div className="space-y-2">
                    {PROGRESS_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center transition-all duration-500 ${
                          checkedItems.includes(i) ? 'bg-[hsl(190,80%,42%)]' : 'border border-[hsl(222,20%,25%)]'
                        }`}>
                          {checkedItems.includes(i) ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <span className="text-[9px] text-[hsl(220,15%,40%)]">{i + 1}</span>}
                        </div>
                        <span className={`text-[11px] transition-all duration-300 ${checkedItems.includes(i) ? 'text-[hsl(220,15%,60%)] line-through' : 'text-[hsl(220,15%,70%)]'}`}>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Context card */}
              <div className="rounded-lg bg-[hsl(222,25%,12%)] border border-[hsl(222,20%,18%)] p-3.5">
                <button onClick={() => setContextOpen(!contextOpen)} className="flex items-center justify-between w-full mb-2">
                  <span className="text-xs font-semibold text-white">Context</span>
                  {contextOpen ? <ChevronUp className="h-3.5 w-3.5 text-[hsl(220,15%,45%)]" /> : <ChevronDown className="h-3.5 w-3.5 text-[hsl(220,15%,45%)]" />}
                </button>
                {contextOpen && (
                  <div className="space-y-1.5">
                    {CONTEXT_ITEMS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 py-1 px-1 rounded hover:bg-[hsl(222,25%,15%)] transition-colors cursor-pointer">
                        <item.icon className="h-3.5 w-3.5 text-[hsl(220,15%,50%)]" />
                        <span className="text-[11px] text-[hsl(220,15%,65%)]">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ====== Dashboard Tab ====== */
          <div className="space-y-4">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map((stat, i) => (
                <div key={i} className="rounded-lg bg-[hsl(222,25%,12%)] border border-[hsl(222,20%,18%)] p-3.5 hover:border-[hsl(190,60%,30%)] transition-colors">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-3.5 w-3.5 text-[hsl(190,80%,50%)]" />
                    <span className="text-[10px] text-[hsl(220,15%,50%)]">{stat.label}</span>
                  </div>
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-[hsl(150,60%,50%)] mt-0.5">{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Mini chart placeholder */}
            <div className="rounded-lg bg-[hsl(222,25%,12%)] border border-[hsl(222,20%,18%)] p-4">
              <div className="text-xs font-semibold text-white mb-3">Weekly Activity</div>
              <div className="flex items-end gap-1.5 h-16">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-[hsl(190,80%,42%)] transition-all hover:bg-[hsl(190,80%,55%)]" style={{ height: `${h}%`, opacity: 0.6 + (h / 300) }} />
                ))}
              </div>
              <div className="flex justify-between mt-2">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="text-[9px] text-[hsl(220,15%,40%)] flex-1 text-center">{d}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating sparkles */}
      <div className="absolute top-10 right-10 animate-pulse">
        <Sparkles className="h-4 w-4 text-[hsl(190,80%,42%)] opacity-20" />
      </div>
      <div className="absolute bottom-16 left-10 animate-pulse" style={{ animationDelay: '1.5s' }}>
        <Sparkles className="h-3.5 w-3.5 text-[hsl(190,80%,42%)] opacity-15" />
      </div>
    </div>
  );
};

export default AuthShowcase;
