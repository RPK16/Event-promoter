import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  DollarSign, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Send, 
  Rocket, 
  History, 
  Info,
  User,
  Hash,
  Layout,
  Clock,
  Clipboard,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type {
  CampaignResult,
  EventDetails,
  GeneratePostsErrorData,
  OllamaConfigStatus,
  PromoPost,
} from './types';

// Mock empty state for the form
const initialEvent: EventDetails = {
  id: crypto.randomUUID(),
  companyName: '',
  eventName: '',
  eventDescription: '',
  location: '',
  startDate: '',
  endDate: '',
  ticketPrices: '',
  sponsors: [],
  visualAssets: [],
  primaryTargetAudience: '',
  secondaryAudiences: ['', ''],
  channels: ['Instagram', 'Facebook'],
  tone: 'Professional',
  postCount: 6,
  budget: '',
};

const testEventData: EventDetails = {
  ...initialEvent,
  id: crypto.randomUUID(),
  eventName: 'AI for Local Retail: From Empty Shelves to Smarter Campaigns',
  companyName: 'Baltic Retail Lab',
  startDate: '2026-09-24',
  ticketPrices: '39 EUR',
  primaryTargetAudience: 'Small retail business owners in Estonia who manage physical stores and want to use artificial intelligence to improve marketing, stock visibility and customer communication.',
  secondaryAudiences: [
    'Marketing coordinators working in small retail chains who need practical tools for creating campaigns faster with limited resources.',
    'Solo entrepreneurs and family-owned shop managers who are not technical specialists but want to understand how artificial intelligence can help with everyday business tasks.',
  ],
  channels: ['Instagram', 'Facebook', 'Email'],
  tone: 'Professional',
  postCount: 6,
  budget: '750 EUR',
  eventDescription: 'Baltic Retail Lab is organizing a practical half-day workshop for local retail businesses in Tallinn. The event focuses on how small shops can use artificial intelligence tools to plan marketing campaigns, write product-focused promotional texts, understand customer segments and reduce time spent on repetitive content tasks. The workshop is designed for non-technical participants, so the messaging must clearly state that no programming or artificial intelligence background is required. A key marketing goal is to position the event as practical, beginner-friendly and directly useful for small retailers, not as a technical conference. The campaign should emphasize that participants will leave with ready-to-use campaign ideas and examples for their own store. Specific condition 1: the venue has only 45 seats, so all marketing content should create a sense of limited availability without sounding aggressive or manipulative. Specific condition 2: one of the primary sponsors is a sustainable packaging company, so the content should subtly connect artificial intelligence, smarter retail planning and reduced waste, but it must not make unrealistic environmental claims. Specific condition 3: the event takes place during a weekday morning, so the campaign should address possible hesitation from busy shop owners by highlighting the short format, practical value and time-saving benefits. Specific condition 4: the campaign should avoid overly technical language such as model training, neural networks or automation architecture, because the audience is business-oriented and beginner-level.',
  sponsors: [
    { name: 'Tallinn Small Business Association' },
    { name: 'Estonian Retail Innovation Network' },
    { name: 'GreenPack Solutions' },
    { name: 'NordPay Business Banking' },
  ],
};

const resizeEventDescriptionTextarea = (textarea: HTMLTextAreaElement) => {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight}px`;
};

const RequiredBadge = () => (
  <span className="ml-1 text-secondary" title="Required" aria-label="Required">
    *
  </span>
);

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function App() {
  const [view, setView] = useState<'form' | 'results' | 'settings'>('form');
  const [eventData, setEventData] = useState<EventDetails>(initialEvent);
  const [posts, setPosts] = useState<PromoPost[]>([]);
  const [marketingPlan, setMarketingPlan] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState('');
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);
  const [generationTimeMs, setGenerationTimeMs] = useState<number | null>(null);
  const [generationMetrics, setGenerationMetrics] = useState<CampaignResult['generationMetrics'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [generatedPanelOpen, setGeneratedPanelOpen] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaConfigStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventDescriptionRef = useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    fetch('/api/config-status')
      .then(res => res.json())
      .then(data => {
        setOllamaStatus(data);
        setSelectedModel(current => current || data.modelId || 'qwen2.5:7b');
      })
      .catch(err => console.error('Failed to fetch config status', err));
  }, []);

  React.useEffect(() => {
    const textarea = eventDescriptionRef.current;
    if (!textarea) {
      return;
    }

    resizeEventDescriptionTextarea(textarea);
  }, [eventData.eventDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e && e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: eventData, model: activeModel }),
      });

      const data = await response.json() as CampaignResult | GeneratePostsErrorData;

      if (!response.ok) {
        throw new Error('error' in data ? data.error : 'Failed to generate posts');
      }

      const campaign = data as CampaignResult;

      if (!Array.isArray(campaign.posts) || campaign.posts.length === 0) {
        throw new Error('The model returned an empty campaign. Try again or reduce the number of posts.');
      }

      setPosts(campaign.posts);
      setMarketingPlan(typeof campaign.marketingPlan === 'string' ? campaign.marketingPlan : '');
      setGeneratedModel(campaign.modelId ?? activeModel);
      setGenerationTimeMs(campaign.generationTimeMs ?? null);
      setGenerationMetrics(campaign.generationMetrics ?? null);
      setGeneratedPanelOpen(true);
      setView('results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate posts');
      setView('form');
    } finally {
      setLoading(false);
    }
  };

  const addSponsor = () => {
    setEventData(prev => ({
      ...prev,
      sponsors: [...prev.sponsors, { name: '' }]
    }));
  };

  const addVisualAsset = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      setEventData(prev => ({
        ...prev,
        visualAssets: [...(prev.visualAssets || []), url]
      }));
    }
  };

  const removeVisualAsset = (index: number) => {
    setEventData(prev => ({
      ...prev,
      visualAssets: prev.visualAssets.filter((_, i) => i !== index)
    }));
  };

  const appendVisualAssetFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const urls = (await Promise.all(Array.from(files).map(fileToDataUrl))).filter(Boolean);
    setEventData(prev => ({
      ...prev,
      visualAssets: [...prev.visualAssets, ...urls],
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    appendVisualAssetFiles(e.target.files);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    appendVisualAssetFiles(e.dataTransfer.files);
  };

  const updateSponsor = (index: number, name?: string, logoUrl?: string) => {
    setEventData(prev => ({
      ...prev,
      sponsors: prev.sponsors.map((sponsor, sponsorIndex) => {
        if (sponsorIndex !== index) {
          return sponsor;
        }

        return {
          ...sponsor,
          ...(name !== undefined ? { name } : {}),
          ...(logoUrl !== undefined ? { logoUrl } : {}),
        };
      }),
    }));
  };

  const uploadSponsorLogo = async (index: number, file?: File) => {
    if (!file) {
      return;
    }

    updateSponsor(index, undefined, await fileToDataUrl(file));
  };

  const removeSponsor = (index: number) => {
    setEventData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
  };

  const formatGenerationTime = (milliseconds: number) => {
    if (milliseconds < 1000) {
      return `${milliseconds} ms`;
    }

    return `${(milliseconds / 1000).toFixed(1)} s`;
  };

  const formatModelDate = (value?: string) => {
    if (!value) {
      return 'Unknown';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  };

  const compactDigest = (value?: string) => {
    if (!value) {
      return 'Unknown';
    }

    return value.length > 18 ? `${value.slice(0, 18)}...` : value;
  };

  const isCloudModelName = (name: string) => name.includes(':cloud') || name.includes('-cloud');

  const knownOllamaTimeMs = [
    generationMetrics?.loadMs,
    generationMetrics?.promptEvalMs,
    generationMetrics?.responseEvalMs,
  ].reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  const unaccountedOllamaTimeMs = typeof generationMetrics?.totalMs === 'number'
    ? Math.max(generationMetrics.totalMs - knownOllamaTimeMs, 0)
    : undefined;

  const visibleGenerationMetrics = [
    { label: 'App wall-clock', value: generationTimeMs ?? undefined, hint: 'Full time measured by the app: backend request, Ollama call, JSON parsing, retries if any, and response handling.' },
    { label: 'Ollama total', value: generationMetrics?.totalMs, hint: 'Total time reported by Ollama for this generation request.' },
    { label: 'Known parts', value: knownOllamaTimeMs || undefined, hint: 'Sum of the detailed Ollama timings shown below: model load, prompt processing, and answer generation.' },
    { label: 'Unaccounted', value: unaccountedOllamaTimeMs, hint: 'Part of Ollama total that is not split into detailed fields. This can include internal scheduling, request overhead, and other Ollama processing.' },
    { label: 'Load', value: generationMetrics?.loadMs, hint: 'Time Ollama spent loading or preparing the selected model before generation.' },
    { label: 'Prompt eval', value: generationMetrics?.promptEvalMs, hint: 'Time Ollama spent reading and processing the prompt before writing the answer.' },
    { label: 'Answer eval', value: generationMetrics?.responseEvalMs, hint: 'Time Ollama spent generating the answer text.' },
  ].filter((metric): metric is { label: string; value: number; hint: string } => typeof metric.value === 'number');

  const visibleGenerationCounts = [
    { label: 'Prompt tokens', value: generationMetrics?.promptEvalCount, hint: 'Number of prompt tokens Ollama processed before generation.' },
    { label: 'Answer tokens', value: generationMetrics?.responseEvalCount, hint: 'Number of tokens Ollama generated in the answer.' },
  ].filter((metric): metric is { label: string; value: number; hint: string } => typeof metric.value === 'number');
  const configuredModels = ollamaStatus?.models?.length
    ? ollamaStatus.models
    : [{ name: selectedModel || 'qwen2.5:7b', available: !!ollamaStatus?.modelAvailable, info: ollamaStatus?.modelInfo }];
  const activeModel = selectedModel || configuredModels[0]?.name || 'qwen2.5:7b';
  const activeModelRecord = configuredModels.find(model => model.name === activeModel);
  const selectedModelInfo = activeModelRecord?.info ?? null;
  const selectedModelAvailable = !!activeModelRecord?.available;
  const selectedModelWeight = isCloudModelName(activeModel) ? 'Cloud-hosted' : selectedModelInfo?.size || 'Unknown';

  const copyToClipboard = async (value: string, itemId: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedItem(itemId);
    window.setTimeout(() => setCopiedItem(current => current === itemId ? null : current), 1600);
  };

  const formatCampaignForCopy = () => {
    const postText = posts.map((post, index) => [
      `Post ${index + 1}`,
      `Channel: ${post.channel}`,
      `Timing: ${post.interval}`,
      `Scheduled: ${post.scheduledDate} ${post.scheduledTime}`,
      `Content: ${post.content}`,
      post.visualSuggestion ? `Visual: ${post.visualSuggestion}` : '',
    ].filter(Boolean).join('\n')).join('\n\n');

    return [
      'Campaign Strategy',
      marketingPlan,
      '',
      'Generated Posts',
      postText,
    ].join('\n');
  };

  const fillTestEventData = () => {
    setEventData({
      ...testEventData,
      id: crypto.randomUUID(),
      sponsors: testEventData.sponsors.map(sponsor => ({ ...sponsor })),
      visualAssets: [...testEventData.visualAssets],
      secondaryAudiences: [...testEventData.secondaryAudiences],
      channels: [...testEventData.channels],
    });
  };

  return (
    <div className="min-h-screen flex bg-bg-main">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-border-main hidden md:flex flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Rocket className="text-white w-5 h-5" />
          </div>
          <h1 className="text-24 font-extrabold tracking-tight text-primary">PromoPulse</h1>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setView('form')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${view === 'form' ? 'bg-[#EEF2FF] text-primary' : 'text-text-dim hover:bg-bg-main'}`}
          >
            <Plus className="w-5 h-5" />
            <span>Event Builder</span>
          </button>
          <button 
            disabled
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-text-dim/50 cursor-not-allowed font-semibold"
          >
            <History className="w-5 h-5" />
            <span>Campaign Archive</span>
          </button>
          <button 
            onClick={() => setView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold ${view === 'settings' ? 'bg-[#EEF2FF] text-primary' : 'text-text-dim hover:bg-bg-main'}`}
          >
            <Info className="w-5 h-5" />
            <span>Ollama Settings</span>
          </button>
        </nav>

        <div className="mt-auto">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${ollamaStatus?.ollamaAvailable && selectedModelAvailable ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-secondary/10 text-secondary'}`}>
            {ollamaStatus?.ollamaAvailable && selectedModelAvailable ? 'Ollama Active' : 'Ollama Not Ready'}
          </div>
          <p className="text-[10px] text-text-dim mt-2 font-medium">
            {activeModel}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {view === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-10">
                <h2 className="text-[28px] font-bold text-text-main pb-1 tracking-tight">Create Campaign</h2>
                <p className="text-text-dim text-sm">Automate your event promotion with generative AI.</p>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <div className="bg-white p-6 rounded-[24px] border border-border-main shadow-sm space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="text-xl font-bold text-text-main">Event Details</div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={activeModel}
                        onChange={event => setSelectedModel(event.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-border-main text-[10px] font-extrabold text-text-main outline-none focus:border-primary"
                        title="Select Ollama model"
                      >
                        {configuredModels.map(model => (
                          <option key={model.name} value={model.name}>
                            {model.name}{model.available ? '' : ' (missing)'}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={fillTestEventData}
                        className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider hover:bg-primary/20 transition-colors"
                      >
                        Test event data
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Event Name<RequiredBadge /></label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors"
                        placeholder="e.g. Annual Charity Run"
                        value={eventData.eventName}
                        onChange={e => setEventData({ ...eventData, eventName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Company Name<RequiredBadge /></label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors"
                        placeholder="e.g. Hope Builders"
                        value={eventData.companyName}
                        onChange={e => setEventData({ ...eventData, companyName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-2">
                        <Calendar className="w-3 h-3" /> Start Date<RequiredBadge />
                      </label>
                      <input
                        required
                        type="date"
                        className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors"
                        value={eventData.startDate}
                        onChange={e => setEventData({ ...eventData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Ticket Prices<RequiredBadge />
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors"
                        placeholder="$45.00"
                        value={eventData.ticketPrices}
                        onChange={e => setEventData({ ...eventData, ticketPrices: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Target Audiences<RequiredBadge /></label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <input
                          required
                          type="text"
                          className="flex-1 px-4 py-2 border-2 border-border-main rounded-lg focus:border-primary outline-none text-xs"
                          placeholder="Primary Audience (e.g. Amateur Runners)"
                          value={eventData.primaryTargetAudience}
                          onChange={e => setEventData({ ...eventData, primaryTargetAudience: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          className="px-4 py-2 border-2 border-border-main rounded-lg focus:border-primary outline-none text-xs"
                          placeholder="Alt Audience 1"
                          value={eventData.secondaryAudiences[0]}
                          onChange={e => {
                            const newAlt = [...eventData.secondaryAudiences];
                            newAlt[0] = e.target.value;
                            setEventData({ ...eventData, secondaryAudiences: newAlt });
                          }}
                        />
                        <input
                          type="text"
                          className="px-4 py-2 border-2 border-border-main rounded-lg focus:border-primary outline-none text-xs"
                          placeholder="Alt Audience 2"
                          value={eventData.secondaryAudiences[1]}
                          onChange={e => {
                            const newAlt = [...eventData.secondaryAudiences];
                            newAlt[1] = e.target.value;
                            setEventData({ ...eventData, secondaryAudiences: newAlt });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Marketing Channels</label>
                      <div className="flex flex-wrap gap-2">
                        {['Instagram', 'Facebook', 'Email', 'Twitter'].map(channel => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => {
                              const newChannels = eventData.channels.includes(channel)
                                ? eventData.channels.filter(c => c !== channel)
                                : [...eventData.channels, channel];
                              setEventData({ ...eventData, channels: newChannels });
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border-2 transition-all ${
                              eventData.channels.includes(channel)
                                ? 'bg-primary border-primary text-white'
                                : 'bg-white border-border-main text-text-dim hover:border-primary/50'
                            }`}
                          >
                            {channel}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Tone & Vibe</label>
                      <select
                        className="w-full px-4 py-2 border-2 border-border-main rounded-xl focus:border-primary outline-none text-xs transition-colors bg-white font-bold"
                        value={eventData.tone}
                        onChange={e => setEventData({ ...eventData, tone: e.target.value })}
                      >
                        <option>Professional</option>
                        <option>Fun & Energetic</option>
                        <option>Formal</option>
                        <option>Inspired/Mission-driven</option>
                        <option>Informative</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Posts Count</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="w-full px-4 py-2 border-2 border-border-main rounded-xl focus:border-primary outline-none text-xs transition-colors"
                        value={eventData.postCount}
                        onChange={e => setEventData({ ...eventData, postCount: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Total Budget</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border-2 border-border-main rounded-xl focus:border-primary outline-none text-xs transition-colors"
                        placeholder="e.g. $500"
                        value={eventData.budget}
                        onChange={e => setEventData({ ...eventData, budget: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">
                      <span className="underline decoration-primary decoration-2 underline-offset-4">Event Pitch & Marketing Goals</span><RequiredBadge />
                    </label>
                    <textarea
                      ref={eventDescriptionRef}
                      required
                      rows={4}
                      className="w-full min-h-[120px] px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors resize-y overflow-hidden"
                      placeholder="Goal: Increase signups by 20%. Context: This is our first major community event..."
                      value={eventData.eventDescription}
                      onChange={e => {
                        resizeEventDescriptionTextarea(e.currentTarget);
                        setEventData({ ...eventData, eventDescription: e.target.value });
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Visual Assets</label>
                    <div 
                      className="grid grid-cols-3 gap-3"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={onDrop}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileUpload}
                      />
                      {eventData.visualAssets.map((url, idx) => (
                        <div key={idx} className="aspect-square bg-border-main rounded-xl overflow-hidden border-2 border-border-main relative group shadow-sm ring-inset ring-primary/0 hover:ring-2 hover:ring-primary transition-all">
                          <img 
                            src={url} 
                            alt={`Asset ${idx}`} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() => removeVisualAsset(idx)}
                              className="bg-secondary text-white rounded-xl p-2 shadow-lg hover:scale-110 transition-transform"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square bg-[#EEF2FF] rounded-xl flex flex-col items-center justify-center text-[10px] font-bold text-primary border-2 border-dashed border-primary hover:bg-white hover:border-solid transition-all group relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus className="w-6 h-6 mb-1.5 group-hover:scale-110 transition-transform relative z-10" />
                        <span className="relative z-10">Upload or</span>
                        <span className="relative z-10">Drag Files</span>
                      </button>
                    </div>
                    <div className="flex gap-4">
                      <button 
                        type="button" 
                        onClick={addVisualAsset}
                        className="text-[10px] text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Add by External URL
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border-main">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Partners & Primary Sponsors</label>
                      <button
                        type="button"
                        onClick={addSponsor}
                        className="text-[10px] font-bold text-primary hover:underline px-3 py-1.5 bg-[#EEF2FF] rounded-lg transition-colors"
                      >
                        + Add Sponsor
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {eventData.sponsors.map((sponsor, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-[#F1F5F9] border border-border-main pl-2 pr-1.5 py-1.5 rounded-xl group transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary">
                          <input
                            type="file"
                            id={`sponsor-logo-${idx}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                              uploadSponsorLogo(idx, e.target.files?.[0]);
                              e.target.value = '';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`sponsor-logo-${idx}`)?.click()}
                            className="w-6 h-6 rounded-lg overflow-hidden bg-white border border-border-main flex items-center justify-center hover:opacity-80 transition-opacity"
                          >
                            {sponsor.logoUrl ? (
                              <img src={sponsor.logoUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <ImageIcon className="w-3 h-3 text-text-dim/40" />
                            )}
                          </button>
                          <input
                            type="text"
                            placeholder="Sponsor Name"
                            value={sponsor.name}
                            onChange={(e) => updateSponsor(idx, e.target.value)}
                            className="bg-transparent border-none outline-none text-[11px] font-bold text-text-main w-24 placeholder:text-text-dim/40"
                          />
                          <button
                            type="button"
                            onClick={() => removeSponsor(idx)}
                            className="text-text-dim/40 hover:text-secondary p-1 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {eventData.sponsors.length === 0 && (
                        <p className="text-[10px] text-text-dim italic font-medium">No sponsors listed yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] border border-border-main shadow-sm flex flex-col">
                  <div className="section-title flex justify-between items-center mb-6">
                    <span className="text-xl font-bold text-text-main">Promotion Timeline</span>
                    <div className="text-xs bg-[#EEF2FF] text-primary px-3 py-1.5 rounded-lg font-bold">Preview Mode</div>
                  </div>

                  <div className="flex-1 space-y-4 overflow-hidden mb-8">
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg-main border border-border-main rounded-2xl p-4 opacity-50">
                        <div className="flex justify-between items-center mb-2">
                          <span className="bg-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">4 Weeks Out</span>
                        </div>
                        <div className="text-xs text-text-main line-clamp-2 italic">Posts will be generated after form submission.</div>
                      </div>
                      <div className="bg-white border-2 border-primary rounded-2xl p-4 shadow-lg shadow-primary/10">
                        <div className="flex justify-between items-center mb-2">
                          <span className="bg-primary text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">Active Draft</span>
                          <span className="text-secondary font-bold text-[12px]">Price Rising Soon!</span>
                        </div>
                        <div className="text-xs text-text-main font-medium italic">Our AI model will optimize your message for conversions.</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {error && (
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                        <p className="text-xs">{error}</p>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        "Schedule & Launch Automation"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          ) : view === 'results' ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-[28px] font-bold text-text-main pb-1 tracking-tight">Campaign Strategy</h2>
                    <p className="text-text-dim text-sm">AI-Optimized plan for <span className="text-primary font-bold italic">{eventData.eventName}</span>.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formatCampaignForCopy(), 'campaign-all')}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-primary/20 rounded-xl text-xs font-bold text-primary hover:bg-primary/5 transition-colors shadow-sm"
                    >
                      {copiedItem === 'campaign-all' ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                      {copiedItem === 'campaign-all' ? 'Copied' : 'Copy All'}
                    </button>
                    <button
                      onClick={() => setView('form')}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-border-main rounded-xl text-xs font-bold text-text-dim hover:bg-neutral-50 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      New Campaign
                    </button>
                  </div>
                </div>

                {/* Marketing Plan Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-[24px] p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Layout className="w-5 h-5 text-primary" />
                      <h3 className="font-bold text-text-main">Executive Strategy Summary</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(marketingPlan, 'marketing-plan')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-primary/20 text-[10px] font-extrabold uppercase tracking-wider text-primary hover:bg-primary/5 transition-colors"
                    >
                      {copiedItem === 'marketing-plan' ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                      {copiedItem === 'marketing-plan' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-sm text-text-main leading-relaxed">
                    {marketingPlan}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, idx) => (
                    <motion.div
                      key={post.id || idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border-[1.5px] border-border-main rounded-[24px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">{post.interval || 'Unscheduled'}</span>
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-text-dim" />
                            <span className="text-[11px] font-bold text-text-dim">{post.channel || 'General'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-dim font-medium block">{post.scheduledDate || 'TBD'}</span>
                          <span className="text-[10px] text-text-dim font-medium block">{post.scheduledTime || 'TBD'}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[100px]">
                        <div className="text-[13px] text-text-main leading-relaxed italic font-medium">
                          "{post.content || 'No content returned.'}"
                        </div>
                      </div>

                      <div className="pt-4 mt-auto border-t border-border-main space-y-4">
                        <div className="group">
                          <div className="flex items-center gap-2 text-text-dim mb-2">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Visual Context</span>
                          </div>
                          <div className="bg-bg-main p-3 rounded-xl border border-dashed border-[#CBD5E1] transition-colors group-hover:bg-neutral-50">
                            <p className="text-[10px] text-text-dim leading-snug">
                              {post.visualSuggestion || 'No visual suggestion returned.'}
                            </p>
                          </div>
                        </div>

                        {(eventData.visualAssets.length > 0 || eventData.sponsors.some(s => s.logoUrl)) && (
                          <div className="flex flex-wrap gap-2">
                            {eventData.visualAssets.slice(0, 3).map((url, i) => (
                              <img key={i} src={url} className="w-8 h-8 object-cover rounded-lg border border-border-main" referrerPolicy="no-referrer" />
                            ))}
                            {eventData.sponsors.filter(s => s.logoUrl).slice(0, 2).map((s, i) => (
                              <img key={i} src={s.logoUrl} className="w-8 h-8 object-contain rounded-full bg-neutral-100 border border-border-main p-1" referrerPolicy="no-referrer" />
                            ))}
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(post.content || '', `post-${idx}`)}
                            className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-[11px] font-extrabold hover:bg-primary/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            {copiedItem === `post-${idx}` ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                            {copiedItem === `post-${idx}` ? 'Copied' : 'Copy Post'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {visibleGenerationMetrics.length > 0 && (
                  <div className="border border-border-main bg-white rounded-[24px] shadow-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setGeneratedPanelOpen(open => !open)}
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-bg-main transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-text-main">Generated</div>
                          <div className="text-xs text-text-dim">Ollama response timing{generatedModel ? `, ${generatedModel}` : ''}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {generationTimeMs !== null && (
                          <span className="text-xs font-bold text-primary">{formatGenerationTime(generationTimeMs)}</span>
                        )}
                        <span className="text-xs font-bold text-text-dim">{generatedPanelOpen ? 'Hide' : 'Show'}</span>
                        {generatedPanelOpen ? <ChevronUp className="w-4 h-4 text-text-dim" /> : <ChevronDown className="w-4 h-4 text-text-dim" />}
                      </div>
                    </button>
                    {generatedPanelOpen && (
                      <div className="px-5 pb-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                          {visibleGenerationMetrics.map(metric => (
                            <div key={metric.label} className="rounded-xl border border-border-main bg-bg-main p-3" title={metric.hint}>
                              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-dim">{metric.label}</div>
                              <div className="mt-1 text-sm font-bold text-text-main">{formatGenerationTime(metric.value)}</div>
                            </div>
                          ))}
                        </div>
                        {visibleGenerationCounts.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {visibleGenerationCounts.map(metric => (
                              <div key={metric.label} className="rounded-xl border border-border-main bg-bg-main p-3" title={metric.hint}>
                                <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-dim">{metric.label}</div>
                                <div className="mt-1 text-sm font-bold text-text-main">{metric.value}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-3 text-xs text-text-dim leading-relaxed">
                          Ollama total can be larger than load + prompt eval + answer eval because it also includes internal overhead around the request.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              <div className="mb-8">
                <h2 className="text-[28px] font-bold text-text-main pb-1 tracking-tight">Ollama Integration</h2>
                <p className="text-text-dim text-sm">Run a local Ollama model to enable AI-powered campaign generation.</p>
              </div>

              <div className="bg-white border border-border-main rounded-[24px] p-8 space-y-8">
                <div className="flex items-start gap-4 p-4 bg-[#EEF2FF] rounded-2xl border border-primary/20">
                  <Info className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-text-main">How to add your details</h4>
                    <p className="text-sm text-text-dim leading-relaxed">
                      Install Ollama, pull the model, and keep the Ollama service running while this app is open.
                    </p>
                    <ol className="text-sm text-text-dim space-y-1 list-decimal ml-4">
                      <li>Install Ollama from the official desktop app or package manager.</li>
                      <li>Run <strong>ollama pull qwen2.5:7b</strong>.</li>
                      <li>Start this app with <strong>npm run dev</strong>.</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-main">Model Details</h3>
                    <p className="text-xs text-text-dim mt-1">
                      These values come from Ollama when available, with fallback details for known cloud-hosted models.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-text-dim">Active model</label>
                    <select
                      value={activeModel}
                      onChange={event => setSelectedModel(event.target.value)}
                      className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm bg-white font-bold"
                    >
                      {configuredModels.map(model => (
                        <option key={model.name} value={model.name}>
                          {model.name}{model.available ? '' : ' (missing, pull required)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Model</div>
                      <div className="mt-1 font-bold text-text-main">{activeModel}</div>
                    </div>
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Weight</div>
                      <div className="mt-1 font-bold text-text-main">{selectedModelWeight}</div>
                    </div>
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Parameters</div>
                      <div className="mt-1 font-bold text-text-main">{selectedModelInfo?.parameterSize || 'Unknown'}</div>
                    </div>
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Quantization</div>
                      <div className="mt-1 font-bold text-text-main">{selectedModelInfo?.quantizationLevel || 'Unknown'}</div>
                    </div>
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Family</div>
                      <div className="mt-1 font-bold text-text-main">{selectedModelInfo?.family || 'Unknown'}</div>
                    </div>
                    <div className="p-4 bg-bg-main rounded-xl border border-border-main">
                      <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Modified</div>
                      <div className="mt-1 font-bold text-text-main">{formatModelDate(selectedModelInfo?.modifiedAt)}</div>
                    </div>
                  </div>
                  <div className="p-4 bg-bg-main rounded-xl border border-border-main text-xs">
                    <div className="font-bold text-text-dim uppercase tracking-wider text-[10px]">Digest</div>
                    <div className="mt-1 font-mono text-text-main">{compactDigest(selectedModelInfo?.digest)}</div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-text-main">Configured models</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {configuredModels.map(model => (
                        <button
                          key={model.name}
                          type="button"
                          onClick={() => setSelectedModel(model.name)}
                          className={`flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors ${
                            activeModel === model.name
                              ? 'border-primary bg-primary/5'
                              : 'border-border-main bg-bg-main hover:bg-white'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-text-main">{model.name}</div>
                            <div className="text-[10px] text-text-dim">
                              {[model.info?.parameterSize, model.info?.quantizationLevel, isCloudModelName(model.name) ? 'Cloud-hosted' : model.info?.size].filter(Boolean).join(' / ') || 'No local metadata'}
                            </div>
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${model.available ? 'text-accent' : 'text-secondary'}`}>
                            {model.available ? 'Ready' : 'Missing'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">OLLAMA_BASE_URL</span>
                      <span className="text-text-dim italic">{ollamaStatus?.baseUrl || 'http://localhost:11434'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">OLLAMA_MODEL</span>
                      <span className="text-text-dim italic">{activeModel}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">OLLAMA_SERVER</span>
                      <span className={ollamaStatus?.ollamaAvailable ? 'text-accent' : 'text-secondary'}>{ollamaStatus?.ollamaAvailable ? 'Available' : 'Unavailable'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">MODEL_STATUS</span>
                      <span className={selectedModelAvailable ? 'text-accent' : 'text-secondary'}>{selectedModelAvailable ? 'Pulled' : 'Missing'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => setView('form')}
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 transition-all text-sm"
                  >
                    Return to Event Builder
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
