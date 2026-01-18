'use client';

import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  MessageSquare,
  PanelLeft,
  X,
  Calculator,
  Cloud,
  Search,
  FileText,
  Receipt,
  Lock,
  Wrench,
  Puzzle,
  Settings,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  ChevronDown,
  Camera,
  Briefcase,
  Rocket,
  ExternalLink,
  Trash
} from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';
import toolsData from '@/data/tools.json';
import integrationsData from '@/data/integrations.json';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', locked: false },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', locked: true },
  { id: 'mistral-large-latest', name: 'Mistral Large', provider: 'Mistral', locked: true },
  { id: 'command-r-plus', name: 'Cohere Command R+', provider: 'Cohere', locked: true },
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B (DeepInfra)', provider: 'DeepInfra', locked: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', locked: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', locked: true },
];

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeModal, setActiveModal] = useState<'tools' | 'integrations' | 'settings' | 'upgrade' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [searchQuery, setSearchQuery] = useState('');

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'dark';
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel.id,
      provider: selectedModel.provider,
    },
    maxSteps: 5, // Enable multi-step for tool calls
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "How can I help you today?",
      },
    ],
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleModelChange = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    if (model && !model.locked) {
      setSelectedModel(model);
    }
  };

  const clearChat = () => {
    setMessages([{ id: 'welcome', role: 'assistant', content: "How can I help you today?" }]);
  };

  const getStatusMessage = () => {
    if (!isLoading) return null;

    const lastMessage = messages[messages.length - 1];

    // Check for ongoing tool calls in any message (though usually it's the last one)
    const allToolInvocations = messages.flatMap(m => m.toolInvocations || []);
    const ongoingTool = allToolInvocations.find(ti => ti.state === 'call');

    if (ongoingTool) {
      switch (ongoingTool.toolName) {
        case 'calculate': return 'Calculating...';
        case 'weather': return 'Checking weather...';
        case 'webSearch': return 'Searching the web...';
        case 'pdfGenerator': return 'Generating PDF...';
        case 'invoiceGenerator': return 'Designing invoice...';
        case 'screenshot': return 'Taking screenshot...';
        case 'portfolio': return 'Generating portfolio...';
        case 'landingPageGenerator': return 'Deploying landing page...';
        case 'deleteLandingPage': return 'Deleting site...';
        default: return `Using ${ongoingTool.toolName}...`;
      }
    }

    if (lastMessage?.role === 'user') return 'Thinking...';
    return 'Writing...';
  };

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden font-sans antialiased">
      {/* Static Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <>
            {/* Mobile Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -260, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -260, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed z-50 h-full w-[260px] border-r border-border/40 bg-background flex flex-col shrink-0"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm font-bold tracking-tight px-2 uppercase tracking-[0.2em] opacity-40">Dropdawn</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 hover:bg-secondary">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-xs h-9 bg-secondary/50 border-border/40"
                  onClick={clearChat}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </Button>

                <ScrollArea className="flex-1 mt-4">
                  <div className="space-y-1">
                    {/* { {[1, 2, 3].map((i) => ( */}
                    <Button
                      // key={i}
                      variant="ghost"
                      className="w-full justify-start gap-3 h-9 text-[13px] font-normal text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span className="truncate">Conversation</span>
                    </Button>
                    {/* ))} */}
                  </div>

                  <div className="mt-8 space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveModal('tools')}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Tools
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveModal('integrations')}
                    >
                      <Puzzle className="w-3.5 h-3.5" />
                      Integrations
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveModal('settings')}
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings
                    </Button>
                  </div>
                </ScrollArea>

                <div className="mt-auto pt-4 border-t border-border/40">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-primary hover:text-primary/90 bg-primary/20"
                    onClick={() => setActiveModal('upgrade')}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    UPGRADE
                  </Button>
                  <div className="flex items-center gap-3 px-2 py-1">

                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                      JD
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[12px] font-medium">User</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Free</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full overflow-hidden">
        {/* Minimal Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)} className="h-8 w-8 hover:bg-secondary">
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              {isSidebarOpen ? (
                <span></span>
              ) : (
                <span className="text-sm font-semibold tracking-tight">Dropdawn</span>
              )}
              {/* <div className="h-4 w-[1px] bg-border/40 mx-2" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">{selectedModel.name}</span> */}
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          <ScrollArea className="flex-1 h-full">
            <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
              {messages.map((m: Message) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-2",
                    m.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[90%] rounded-lg p-3 text-[15px] leading-relaxed",
                    m.role === 'user'
                      ? "bg-secondary/40 border border-border/40 text-foreground"
                      : "bg-secondary/10 border border-border/20"
                  )}>
                    {/* Tool Call Rendering */}
                    {m.toolInvocations?.map((toolInvocation) => {
                      const { toolName, toolCallId, state } = toolInvocation;

                      const getToolIcon = (name: string) => {
                        switch (name) {
                          case 'calculate': return <Calculator className="w-3 h-3" />;
                          case 'weather': return <Cloud className="w-3 h-3" />;
                          case 'webSearch': return <Search className="w-3 h-3" />;
                          case 'pdfGenerator': return <FileText className="w-3 h-3" />;
                          case 'invoiceGenerator': return <Receipt className="w-3 h-3" />;
                          case 'screenshot': return <Camera className="w-3 h-3" />;
                          case 'portfolio': return <Briefcase className="w-3 h-3" />;
                          case 'landingPageGenerator': return <Rocket className="w-3 h-3" />;
                          case 'deleteLandingPage': return <Trash className="w-3 h-3" />;
                          default: return <Calculator className="w-3 h-3" />;
                        }
                      };

                      if (state === 'result') {
                        const { result } = toolInvocation;
                        return (
                          <div key={toolCallId} className="flex flex-col gap-2 mb-4 p-2 rounded bg-background/50 border border-border/40">
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground uppercase font-bold">
                              {getToolIcon(toolName)}
                              {toolName} result
                            </div>
                            <div className="text-sm">
                              {toolName === 'calculate' ? (
                                <div className="font-mono">
                                  {result.expression} = <span className="text-foreground font-bold">{result.result}</span>
                                </div>
                              ) : toolName === 'weather' ? (
                                <div className="space-y-1">
                                  <div className="font-bold">{result.location}</div>
                                  <div>{result.temperature}, {result.condition}</div>
                                  <div className="text-xs text-muted-foreground">Humidity: {result.humidity} | Wind: {result.wind}</div>
                                </div>
                              ) : toolName === 'webSearch' ? (
                                <div className="space-y-2">
                                  {result.results?.results?.slice(0, 3).map((r: any, i: number) => (
                                    <div key={i} className="border-l-2 border-border/40 pl-2">
                                      <a href={r.url} target="_blank" rel="noopener noreferrer" className="font-bold hover:underline decoration-primary text-primary/80">{r.title}</a>
                                      <p className="text-xs text-muted-foreground line-clamp-1">{r.content}</p>
                                    </div>
                                  ))}
                                </div>
                              ) : (toolName === 'pdfGenerator' || toolName === 'invoiceGenerator') ? (
                                <div className="space-y-2">
                                  <div className="font-medium">{result.message}</div>
                                  {result.dataUri && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-2"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = result.dataUri;
                                        link.download = result.filename || 'document.pdf';
                                        link.click();
                                      }}
                                    >
                                      <FileText className="w-3 h-3" />
                                      Download PDF
                                    </Button>
                                  )}
                                </div>
                              ) : toolName === 'screenshot' ? (
                                <div className="relative rounded-lg overflow-hidden border border-border/40 bg-secondary/20">
                                  {result.image ? (
                                    <img src={result.image} alt="Screenshot" className="w-full h-auto block" />
                                  ) : (
                                    <div className="p-4 text-xs text-destructive">No image data returned</div>
                                  )}
                                </div>
                              ) : toolName === 'portfolio' ? (
                                <details className="group">
                                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground list-none flex items-center gap-2 select-none">
                                    <span>View Portfolio Details</span>
                                    <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                                  </summary>
                                  <div className="mt-2 p-3 bg-secondary/10 rounded-md border border-border/20 text-sm space-y-1">
                                    <div className="font-bold">URL: <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{result.url}</a></div>
                                    <div className="text-muted-foreground">{result.info}</div>
                                    {result.twitter && <div>Twitter: <a href={result.twitter} target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">{result.twitter}</a></div>}
                                  </div>
                                </details>
                              ) : toolName === 'landingPageGenerator' ? (
                                <div className="space-y-2">
                                  <div className="font-medium text-green-500">{result.message}</div>
                                  {result.siteUrl && (
                                    <div className="flex flex-col gap-1">
                                      <a href={result.siteUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold flex items-center gap-1">
                                        {result.siteUrl} <ExternalLink className="w-3 h-3" />
                                      </a>
                                      {result.adminUrl && (
                                        <a href={result.adminUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground">
                                          Manage Site
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  {result.error && <div className="text-destructive font-bold">{result.error}</div>}
                                </div>
                              ) : toolName === 'deleteLandingPage' ? (
                                <div className="space-y-1">
                                  {result.error ? (
                                    <div className="font-medium text-destructive">{result.error}</div>
                                  ) : (
                                    <div className="font-medium text-destructive flex items-center gap-2">
                                      <Trash className="w-3 h-3" />
                                      {result.message}
                                    </div>
                                  )}
                                  {result.siteId && <div className="text-xs text-muted-foreground">ID: {result.siteId}</div>}
                                </div>
                              ) : (
                                <pre className="text-[10px] overflow-auto max-h-40 p-2 bg-secondary/20 rounded">
                                  {JSON.stringify(result, null, 2)}
                                </pre>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={toolCallId} className="flex items-center gap-2 text-[11px] text-muted-foreground animate-pulse mb-2">
                          {getToolIcon(toolName)}
                          Using {toolName}...
                        </div>
                      );
                    })}

                    {m.content && (
                      <div className="prose prose-sm dark:prose-invert max-w-none break-words prose-p:leading-relaxed prose-pre:bg-muted">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2 items-start"
                >
                  <div className="bg-secondary/10 border border-border/20 rounded-lg p-3 flex flex-col gap-2 min-w-[140px]">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground animate-pulse font-bold uppercase tracking-widest">
                      {getStatusMessage()}
                    </span>
                  </div>
                </motion.div>
              )}
              {error && (
                <div className="p-3 text-xs border border-destructive/50 text-destructive bg-destructive/5 rounded-lg max-w-md">
                  {error.message || 'An error occurred.'}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </main>

        {/* Unified Input Area */}
        <div className="w-full p-4 bg-background pt-2 z-20 shrink-0">
          <div className="max-w-2xl mx-auto relative flex flex-col gap-2 bg-secondary/20 backdrop-blur-md border border-border/30 rounded-xl p-2 transition-all duration-200 focus-within:border-foreground/20 focus-within:ring-1 focus-within:ring-foreground/5 shadow-2xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              className="flex flex-col"
            >
              <TextareaAutosize
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading) {
                      const formEvent = new Event('submit', { cancelable: true, bubbles: true });
                      e.currentTarget.form?.dispatchEvent(formEvent);
                    }
                  }
                }}
                disabled={isLoading}
                placeholder={isLoading ? "Please wait..." : "Ask me something or use tools..."}
                minRows={1}
                maxRows={6}
                className="w-full border-none focus:outline-none bg-transparent py-3 px-3 text-sm shadow-none placeholder:text-muted-foreground/50 disabled:opacity-50 resize-none flex-1 overflow-hidden leading-relaxed"
              />
              <div className="flex items-center justify-between px-2 pt-1 border-t border-border/10">
                <Select value={selectedModel.id} onValueChange={handleModelChange}>
                  <SelectTrigger className="w-auto h-7 bg-transparent border-none text-[11px] font-medium text-muted-foreground/70 hover:bg-secondary/50 rounded-md transition-colors px-2 gap-1 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border/40 shadow-2xl">
                    {MODELS.map((model) => (
                      <SelectItem
                        key={model.id}
                        value={model.id}
                        disabled={model.locked}
                        className="text-xs focus:bg-secondary/50 focus:text-foreground py-1.5"
                      >
                        <div className="flex items-center justify-between w-full gap-2">
                          <span>{model.name}</span>
                          {model.locked && <Lock className="w-3 h-3 text-muted-foreground/50" />}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "rounded-md h-7 w-7 transition-all duration-200 shadow-sm",
                    input.trim() ? "bg-foreground text-background hover:opacity-90" : "bg-transparent text-muted-foreground/30"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground/40 tracking-widest font-medium uppercase">
            DROPDAWN • TOOL ENABLED
          </p>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-background/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-popover border border-border/40 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/40">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  {activeModal === 'tools' && <Wrench className="w-4 h-4" />}
                  {activeModal === 'integrations' && <Puzzle className="w-4 h-4" />}
                  {activeModal === 'settings' && <Settings className="w-4 h-4" />}
                  {activeModal === 'upgrade' && <Sparkles className="w-4 h-4" />}
                  {activeModal}
                </h3>
                <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} className="h-8 w-8 hover:bg-white/5">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                <ScrollArea className="h-[300px] pr-4">
                  {activeModal === 'tools' ? (
                    <div className="space-y-6">
                      <Input
                        className="bg-transparent border-none focus:outline-none focus:ring-0 focus:border-none focus:shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-md placeholder:text-muted-foreground/50"
                        placeholder="Search tools"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />

                      {toolsData.filter((tool) =>
                        tool.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((tool, i) => (
                        <div key={i} className="flex flex-col gap-1">
                          <h4 className="text-sm font-bold text-foreground">{tool.name}</h4>
                          <p className="text-[13px] text-muted-foreground leading-relaxed">
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : activeModal === 'settings' ? (
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Appearance</label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'light', name: 'Light', icon: Sun },
                            { id: 'dark', name: 'Dark', icon: Moon },
                            { id: 'system', name: 'System', icon: Monitor },
                          ].map((item) => (
                            <Button
                              key={item.id}
                              variant={theme === item.id ? 'default' : 'outline'}
                              className={cn(
                                "flex flex-col items-center gap-2 h-20 bg-muted/50",
                                theme === item.id ? "bg-primary text-primary-foreground" : "border-border/40 hover:bg-muted"
                              )}
                              onClick={() => setTheme(item.id as any)}
                            >
                              <item.icon className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase">{item.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="pt-4 border-t border-border/40 space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">General</label>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/40">
                          <span className="text-xs font-medium">Clear Conversations</span>
                          <Button variant="ghost" size="sm" onClick={clearChat} className="text-destructive h-7 px-3 text-[10px] font-bold uppercase hover:bg-destructive/10">Delete All</Button>
                        </div>
                      </div>
                    </div>
                  ) : activeModal === 'upgrade' ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                      </div>
                      <h4 className="text-lg font-bold">Pro Plan is coming soon!</h4>
                      <p className="text-sm text-muted-foreground max-w-[280px]">
                        We're working on advanced features like longer memory, more powerful models, and private storage.
                      </p>
                      <Button className="mt-4" onClick={() => setActiveModal(null)}>Get Notified</Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground py-12">
                      <Puzzle className="w-8 h-8 opacity-20" />
                      <p className="text-sm font-medium">No active integrations found.</p>
                      <p className="text-xs opacity-50">Integrations will appear here once configured.</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
}
