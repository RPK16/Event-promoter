import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Building2, 
  MapPin, 
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
  MessageSquare,
  Layout,
} from 'lucide-react';
import type { EventDetails, PromoPost, Sponsor, CampaignResult } from './types';

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
  goals: '',
};

export default function App() {
  const [view, setView] = useState<'form' | 'results' | 'settings'>('form');
  const [eventData, setEventData] = useState<EventDetails>(initialEvent);
  const [posts, setPosts] = useState<PromoPost[]>([]);
  const [marketingPlan, setMarketingPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [awsStatus, setAwsStatus] = useState<{ awsConfigured: boolean; region: string; modelId: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    fetch('/api/config-status')
      .then(res => res.json())
      .then(data => setAwsStatus(data))
      .catch(err => console.error('Failed to fetch config status', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent, forceDemo = false) => {
    e && e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event: eventData, demo: forceDemo }),
      });

      const data: CampaignResult = await response.json();

      if (!response.ok) {
        throw new Error((data as any).error || 'Failed to generate posts');
      }

      setPosts(data.posts);
      setMarketingPlan(data.marketingPlan);
      setView('results');
    } catch (err: any) {
      setError(err.message);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventData(prev => ({
            ...prev,
            visualAssets: [...(prev.visualAssets || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setEventData(prev => ({
            ...prev,
            visualAssets: [...(prev.visualAssets || []), reader.result as string]
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updateSponsor = (index: number, name?: string, logoUrl?: string) => {
    const newSponsors = [...eventData.sponsors];
    if (name !== undefined) newSponsors[index].name = name;
    if (logoUrl !== undefined) newSponsors[index].logoUrl = logoUrl;
    setEventData(prev => ({ ...prev, sponsors: newSponsors }));
  };

  const removeSponsor = (index: number) => {
    setEventData(prev => ({
      ...prev,
      sponsors: prev.sponsors.filter((_, i) => i !== index)
    }));
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
            <span>Bedrock Settings</span>
          </button>
        </nav>

        <div className="mt-auto">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold ${awsStatus?.awsConfigured ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-secondary/10 text-secondary'}`}>
            {awsStatus?.awsConfigured ? 'AWS Bedrock Active' : 'AWS Not Configured'}
          </div>
          <p className="text-[10px] text-text-dim mt-2 font-medium">
            {awsStatus?.modelId || 'titan-text'}
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
                  <div className="text-xl font-bold text-text-main mb-4">Event Details</div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Event Name</label>
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
                      <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Company Name</label>
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
                        <Calendar className="w-3 h-3" /> Start Date
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
                        <DollarSign className="w-3 h-3" /> Ticket Prices
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
                    <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim">Target Audiences</label>
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
                    <label className="text-[12px] font-bold uppercase tracking-wider text-text-dim underline decoration-primary decoration-2 underline-offset-4">Event Pitch & Marketing Goals</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-border-main rounded-xl focus:border-primary outline-none text-sm transition-colors resize-none"
                      placeholder="Goal: Increase signups by 20%. Context: This is our first major community event..."
                      value={eventData.eventDescription}
                      onChange={e => setEventData({ ...eventData, eventDescription: e.target.value })}
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
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => updateSponsor(idx, undefined, reader.result as string);
                                reader.readAsDataURL(file);
                              }
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
                      <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 flex flex-col gap-3">
                        <p className="text-xs">{error}</p>
                        <button 
                          type="button" 
                          onClick={(e) => handleSubmit(e, true)}
                          className="text-[10px] font-bold underline text-left hover:text-red-700"
                        >
                          Try Demo Mode instead? (Simulates AI output without AWS connection)
                        </button>
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        "Schedule & Launch Automation"
                      )}
                    </button>
                    {!awsStatus?.awsConfigured && (
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="w-full bg-white border-2 border-primary text-primary font-bold py-4 rounded-xl hover:bg-neutral-50 transition-all text-sm"
                      >
                        Try Demo Mode (Instant)
                      </button>
                    )}
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-[28px] font-bold text-text-main pb-1 tracking-tight">Campaign Strategy</h2>
                    <p className="text-text-dim text-sm">AI-Optimized plan for <span className="text-primary font-bold italic">{eventData.eventName}</span>.</p>
                  </div>
                  <button
                    onClick={() => setView('form')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-border-main rounded-xl text-xs font-bold text-text-dim hover:bg-neutral-50 transition-colors shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New Campaign
                  </button>
                </div>

                {/* Marketing Plan Summary */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/5 border border-primary/20 rounded-[24px] p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Layout className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-text-main">Executive Strategy Summary</h3>
                  </div>
                  <div className="text-sm text-text-main leading-relaxed">
                    {marketingPlan}
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border-[1.5px] border-border-main rounded-[24px] p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all hover:shadow-md hover:border-primary/30"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest mb-1">{post.interval}</span>
                          <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3 text-text-dim" />
                            <span className="text-[11px] font-bold text-text-dim">{post.channel}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-text-dim font-medium block">{post.scheduledDate}</span>
                          <span className="text-[10px] text-text-dim font-medium block">{post.scheduledTime}</span>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[100px]">
                        <div className="text-[13px] text-text-main leading-relaxed italic font-medium">
                          "{post.content}"
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
                              {post.suggestedImageUrl}
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
                          <button className="flex-1 py-2.5 rounded-xl bg-primary/10 text-primary text-[11px] font-extrabold hover:bg-primary/20 transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                            <Send className="w-3.5 h-3.5" />
                            Use Post
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
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
                <h2 className="text-[28px] font-bold text-text-main pb-1 tracking-tight">Bedrock Integration</h2>
                <p className="text-text-dim text-sm">Configure your AWS connection to enable AI-powered campaign generation.</p>
              </div>

              <div className="bg-white border border-border-main rounded-[24px] p-8 space-y-8">
                <div className="flex items-start gap-4 p-4 bg-[#EEF2FF] rounded-2xl border border-primary/20">
                  <Info className="text-primary w-6 h-6 flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h4 className="font-bold text-text-main">How to add your details</h4>
                    <p className="text-sm text-text-dim leading-relaxed">
                      To connect your AWS Bedrock account, you need to add your credentials as <strong>Secrets</strong> in the AI Studio environment.
                    </p>
                    <ol className="text-sm text-text-dim space-y-1 list-decimal ml-4">
                      <li>Open the <strong>Settings</strong> menu in the top bar.</li>
                      <li>Go to <strong>Secrets</strong>.</li>
                      <li>Add the following keys with your AWS values:</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">AWS_ACCESS_KEY_ID</span>
                      <span className={awsStatus?.awsConfigured ? 'text-accent' : 'text-secondary'}>{awsStatus?.awsConfigured ? '✓ Set' : '✗ Missing'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">AWS_SECRET_ACCESS_KEY</span>
                      <span className={awsStatus?.awsConfigured ? 'text-accent' : 'text-secondary'}>{awsStatus?.awsConfigured ? '✓ Set' : '✗ Missing'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">AWS_REGION</span>
                      <span className="text-text-dim italic">{awsStatus?.region || 'us-east-1'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-bg-main rounded-lg border border-border-main">
                      <span className="font-bold">AWS_BEDROCK_MODEL_ID</span>
                      <span className="text-text-dim italic">{awsStatus?.modelId || 'amazon.titan-text-express-v1'}</span>
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
