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
  Trash,
  User as UserIcon,
  LogOut,
  HourglassIcon,
  MessageCircleQuestionMark
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
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AuthModal } from '@/components/auth-modal';
import { signout, deleteConversation } from '@/app/auth/actions';
import { uploadImageAction } from '@/app/actions';

const MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google', locked: false },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', provider: 'Google', locked: true },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', locked: true },
  { id: 'mistral-small', name: 'Mistral Small', provider: 'Mistral', locked: true },
  { id: 'command-light', name: 'Cohere Command Light', provider: 'Cohere', locked: true },
  { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', name: 'Llama 3.3 70B (DeepInfra)', provider: 'DeepInfra', locked: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', locked: true },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', locked: true },
];

export default function ChatPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [activeModal, setActiveModal] = useState<'tools' | 'integrations' | 'settings' | 'upgrade' | 'auth' | 'help' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system' | 'dropdawn-theme'>('dark');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  const [isTemporaryMode, setIsTemporaryMode] = useState(false);
  const [temporaryCount, setTemporaryCount] = useState(0);

  // Auth & DB State
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const supabase = createClient();
  const inputRef = useRef('');

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent triggering selection
    if (confirm('Are you sure you want to delete this conversation?')) {
      await deleteConversation(id);
      setConversations(conversations.filter(c => c.id !== id));
      if (currentConversationId === id) {
        clearChat();
      }
    }
  };

  // Effect to check auth status
  // Effect to check auth status
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        loadConversations();
      } else {
        // Show auth modal on first load if not logged in
        setActiveModal('auth');
      }
    };
    checkUser();
  }, []);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setConversations(data);
  };

  const loadMessages = async (conversationId: string) => {
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesData) {
      const formattedMessages: Message[] = messagesData.map(msg => ({
        id: msg.id,
        role: msg.role as any,
        content: msg.content,
        toolInvocations: msg.images ? JSON.parse(JSON.stringify(msg.images)) : undefined // Assuming images stores tool invocations for now or we map back?
        // Actually, for simplicity, we just reload content. Tool invocations might need complex handling to restore state.
        // For V1, we simply show the content. If we stored tool results in content or separate JSON, we'd map it here.
        // Given schema 'images jsonb', we can use it to store toolInvocations if we decide to save them.
      }));
      setMessages(formattedMessages);
    }
  };

  // Theme effect
  useEffect(() => {
    const root = window.document.documentElement;
    const initialTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'dark';
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'dropdawn-theme');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages, append, setInput } = useChat({
    api: '/api/chat',
    body: {
      model: selectedModel.id,
      provider: selectedModel.provider,
      isTemporary: isTemporaryMode
    },
    maxSteps: 5, // Enable multi-step for tool calls
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: "How can I help you today?",
      },
    ],
    onFinish: async (message) => {
      if (isTemporaryMode) {
        setTemporaryCount(prev => prev + 1);
        return; // Don't save to DB
      }

      if (!user) return; // Don't save if not logged in

      try {
        let conversationId = currentConversationId;

        // If no active conversation, create one
        if (!conversationId) {
          // Use input ref as title source or default
          const title = inputRef.current.slice(0, 30) || 'New Conversation';
          const { data: convData, error: convError } = await supabase
            .from('conversations')
            .insert({ user_id: user.id, title })
            .select()
            .single();

          if (convError || !convData) {
            // Handle missing profile error (FK violation)
            if (convError?.code === '23503') {
              console.log('Profile missing, creating one...');
              const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id,
                full_name: user.user_metadata?.full_name || 'User',
                email: user.email, // Common field, worth trying. If it fails, we might need a fallback, but usually schema has this or allows nulls if not present.
                avatar_url: user.user_metadata?.avatar_url
              });

              if (profileError) {
                console.error('Failed to create profile:', profileError);
                // Fallback: try minimal insert if email/avatar causes issues
                await supabase.from('profiles').insert({ id: user.id });
              }

              // Retry conversation creation
              const { data: retryData, error: retryError } = await supabase
                .from('conversations')
                .insert({ user_id: user.id, title })
                .select()
                .single();

              if (retryError || !retryData) {
                console.error('Failed to create conversation after profile fix', retryError);
                return;
              }

              conversationId = retryData.id;
              setCurrentConversationId(conversationId);
              loadConversations();
            } else {
              console.error('Failed to create conversation', JSON.stringify(convError, null, 2));
              // Try to recover user session if it's an RLS issue
              if (convError?.code === '42501' || convError?.message?.includes('security')) {
                console.warn('RLS Error detected. Check if user is authenticated properly.');
              }
              return;
            }
          }
          conversationId = convData.id;
          setCurrentConversationId(conversationId);
          loadConversations(); // Refresh list
        }

        // Save USER message first (the one that triggered this)
        // We access the inputRef to get what the user typed
        if (inputRef.current) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: inputRef.current
          });
        }

        // Process Assistant Message (check for images/tools)
        let finalToolInvocations = message.toolInvocations;
        if (finalToolInvocations) {
          // Check/Upload images
          const updatedInvocations = await Promise.all(finalToolInvocations.map(async (inv) => {
            if (inv.state === 'result' && inv.result?.image && inv.result.image.startsWith('data:')) {
              const uploadRes = await uploadImageAction(inv.result.image);
              if (uploadRes.url) {
                return { ...inv, result: { ...inv.result, image: uploadRes.url } };
              }
            }
            return inv;
          }));
          finalToolInvocations = updatedInvocations as any;
        }

        // Save Assistant Message
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: message.content,
          images: finalToolInvocations ? JSON.parse(JSON.stringify(finalToolInvocations)) : null
        });

      } catch (err) {
        console.error('Error saving to DB:', err);
      }
    }
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
    setCurrentConversationId(null);
    setMessages([{ id: 'welcome', role: 'assistant', content: 'How can I help you today?' }]);
    inputRef.current = '';
    setIsTemporaryMode(false);
    setTemporaryCount(0);
  };

  const startTemporaryChat = () => {
    clearChat();
    setIsTemporaryMode(true);
    setMessages([{ id: 'temp-welcome', role: 'assistant', content: 'You are in Temporary Mode. You have 3 messages available. Chats are not saved.' }]);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleSelectConversation = (convId: string) => {
    setIsTemporaryMode(false);
    setCurrentConversationId(convId);
    loadMessages(convId);
    // Close sidebar on mobile if needed
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  // Custom submit wrapper to capture input
  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isTemporaryMode && temporaryCount >= 3) {
      // Prevent submit
      return;
    }
    inputRef.current = input; // Capture input before it clears
    handleSubmit(e);
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
    <div className={cn(
      "flex h-[100dvh] w-full text-foreground overflow-hidden font-sans antialiased",
      theme === 'dropdawn-theme' ? "bg-transparent" : "bg-background"
    )}>
      {/* Static Sidebar */}
      <AnimatePresence mode="wait">
        {isMounted && isSidebarOpen && (
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
              className={cn(
                "fixed z-50 h-full w-[260px] border-r border-border/40 flex flex-col shrink-0",
                theme === 'dropdawn-theme' ? "bg-[oklch(0.22_0_0)] border-none m-4 rounded-xl h-[calc(100%-2rem)] shadow-2xl" : "bg-background"
              )}
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm tracking-wider px-2 font-serif opacity-40">dropdawn</span>
                  <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)} className="h-8 w-8 hover:bg-secondary">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-xs mb-4 h-9 bg-secondary/50 border-border/40 cursor-pointer"
                  onClick={clearChat}
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Chat
                </Button>


                {/* <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start gap-2 text-xs mb-4 h-9 border-border/40 cursor-pointer",
                    isTemporaryMode ? "bg-primary/20 text-primary border-primary/20" : "bg-secondary/50"
                  )}
                  onClick={startTemporaryChat}
                >
                  <HourglassIcon className="w-3.5 h-3.5" />
                  Temporary Chat
                </Button> */}

                <ScrollArea className="flex-1 mt-4">
                  <div className="space-y-1">
                    {conversations.length === 0 ? (
                      <div className="text-xs text-muted-foreground p-3 text-center opacity-50">
                        {user ? 'No conversations yet' : 'Sign in to save chats'}
                      </div>
                    ) : (
                      conversations.map((conv) => (
                        <div key={conv.id} className="relative group">
                          <Button
                            variant={currentConversationId === conv.id ? "secondary" : "ghost"}
                            className="w-full justify-start gap-3 h-9 text-[13px] font-normal text-muted-foreground hover:text-foreground pr-8"
                            onClick={() => handleSelectConversation(conv.id)}
                          >
                            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{conv.title}</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                            onClick={(e) => handleDeleteConversation(e, conv.id)}
                          >
                            <Trash className="w-3 h-3" />
                          </Button>
                        </div>
                      ))
                    )}
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
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveModal('help')}
                    >
                      <MessageCircleQuestionMark className="w-3.5 h-3.5" />
                      Help
                    </Button>
                  </div>
                </ScrollArea>

                <div className="mt-auto pt-4 border-t border-border/40 space-y-2">
                  {user ? (
                    <div className="flex items-center gap-3 px-2 py-1">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold uppercase">
                        {user.email?.slice(0, 2)}
                      </div>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[12px] font-medium truncate">{user.user_metadata?.full_name || 'User'}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">Free</span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-destructive cursor-pointer" onClick={() => {
                        supabase.auth.signOut().then(() => {
                          setUser(null);
                          setConversations([]);
                          setActiveModal('auth');
                        });
                      }}>
                        <LogOut className="w-3.5 h-3.5 " />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full justify-start gap-2 h-9 text-xs"
                      onClick={() => setActiveModal('auth')}
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                      Sign In / Sign Up
                    </Button>
                  )}

                  {/* <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 h-9 text-[13px] font-medium text-primary hover:text-primary/90 bg-primary/20"
                    onClick={() => setActiveModal('upgrade')}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    UPGRADE
                  </Button> */}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col relative w-full overflow-hidden",
        theme === 'dropdawn-theme' ? "p-4" : ""
      )}>
        {/* Minimal Header */}
        <header className={cn(
          "h-14 flex items-center justify-between px-4 border-b border-border/40 shrink-0",
          theme === 'dropdawn-theme' ? "border-none" : ""
        )}>
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "h-8 w-8 hover:bg-secondary",
                  theme === 'dropdawn-theme' && "bg-card/80 hover:bg-card text-card-foreground backdrop-blur-sm"
                )}
              >
                <PanelLeft className="w-4 h-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              {isSidebarOpen ? (
                <span></span>
              ) : (
                <span className={cn(
                  "text-sm font-normal tracking-wider font-serif",
                  theme === 'dropdawn-theme' && "text-white"
                )}>dropdawn</span>
              )}
            </div>
          </div>
          {isTemporaryMode && (
            <div className="text-[10px] font-medium px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 animate-pulse">
              Temporary Mode: {3 - temporaryCount} left
            </div>
          )}
        </header>

        {/* Chat Area & Input Wrapper */}
        <div className={cn(
          "flex-1 flex flex-col min-h-0 overflow-hidden relative",
          theme === 'dropdawn-theme' ? "bg-[#262626] rounded-md shadow-2xl max-w-2xl mx-auto w-full" : ""
        )}>
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
                        ? (theme === 'dropdawn-theme' ? "bg-white/10 border border-white/20 text-white" : "bg-secondary/40 border border-border/40 text-foreground")
                        : (theme === 'dropdawn-theme' ? "bg-white/5 border border-white/10 text-white/90" : "bg-secondary/10 border border-border/20")
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
                        <div className={cn(
                          "prose prose-sm dark:prose-invert max-w-none break-words prose-p:leading-relaxed prose-pre:bg-muted",
                          m.id === 'welcome' && "[&_p]:text-2xl [&_p]:font-light [&_p]:font-serif",
                          theme === 'dropdawn-theme' && "prose-headings:text-white prose-p:text-white/90 prose-strong:text-white prose-code:text-white/90"
                        )}>
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
                {error && !error.message?.includes('Rate limit') && (
                  <div className="p-3 text-xs border border-destructive/50 text-destructive bg-destructive/5 rounded-lg max-w-md">
                    {error.message || 'An error occurred.'}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </main>

          {/* Rate Limit Warning */}
          {error?.message?.includes('Rate limit') && (
            <div className="w-full px-4 pb-2 z-20">
              <div className="max-w-2xl mx-auto bg-destructive/10 border border-destructive/20 text-destructive text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                Daily limit reached. Resets in 12 hours.
              </div>
            </div>
          )}

          {/* Unified Input Area */}
          <div className={cn(
            "w-full p-4 pt-2 z-20 shrink-0",
            theme === 'dropdawn-theme' ? "" : "bg-background"
          )}>
            {messages.length === 1 && messages[0].id === 'welcome' && (
              <div className="max-w-2xl mx-auto w-full mb-3 overflow-hidden flex mask-gradient-r">
                <div className="flex gap-2 animate-scroll">
                  {[
                    "Design a modern landing page for a coffee shop with sections for hero image, menu highlights, ambience photos, and an online ordering button. Use warm brown and cream colors with clear readable fonts. Clicking 'Order Now' should trigger a call to 8525725721. Include images related to coffee, pastries, and café ambience sourced from Pexels or Unsplash.",
                    "Generate a $2500 invoice for consulting services including 5 consultations, Invoice No. INV-2026-001, client email: client@example.com",
                    "Provide the latest weather update for Delhi",
                    "Search the web for upcoming 2026 events in India"
                  ].concat([
                    "Design a modern landing page for a coffee shop with sections for hero image, menu highlights, ambience photos, and an online ordering button. Use warm brown and cream colors with clear readable fonts. Clicking 'Order Now' should trigger a call to 8525725721. Include images related to coffee, pastries, and café ambience sourced from Pexels or Unsplash.",
                    "Generate a $2500 invoice for consulting services including 5 consultations, Invoice No. INV-2026-001, client email: client@example.com",
                    "Provide the latest weather update for Delhi",
                    "Search the web for upcoming 2026 events in India"
                  ]).map((text, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(text)}
                      className={cn(
                        "flex-none bg-secondary/30 hover:bg-secondary/50 border border-border/40 rounded-full px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-all whitespace-nowrap shadow-sm hover:shadow-md hover:-translate-y-0.5",
                        theme === 'dropdawn-theme' && "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border-white/5"
                      )}
                    >
                      {text.slice(0, 40) + `...`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={cn(
              "mx-auto relative flex flex-col gap-2 backdrop-blur-md border rounded-xl p-2 transition-all duration-200 focus-within:ring-1 shadow-2xl",
              theme === 'dropdawn-theme'
                ? "w-full bg-black/40 border-white/10 focus-within:border-white/20 focus-within:ring-white/10"
                : "max-w-2xl bg-secondary/20 border-border/30 focus-within:border-foreground/20 focus-within:ring-foreground/5"
            )}>
              <form
                onSubmit={onFormSubmit}
                className="flex flex-col"
              >
                <TextareaAutosize
                  value={input}
                  onChange={handleInputChange}
                  onClick={() => (!user && !isTemporaryMode) && setActiveModal('auth')}
                  onFocus={() => (!user && !isTemporaryMode) && setActiveModal('auth')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!user && !isTemporaryMode) {
                        setActiveModal('auth');
                        return;
                      }
                      if (isTemporaryMode && temporaryCount >= 3) {
                        return;
                      }
                      if (input.trim() && !isLoading) {
                        const formEvent = new Event('submit', { cancelable: true, bubbles: true });
                        e.currentTarget.form?.dispatchEvent(formEvent);
                      }
                    }
                  }}
                  disabled={isLoading || !!selectedModel.locked || (isTemporaryMode && temporaryCount >= 3)}
                  placeholder={
                    !user && !isTemporaryMode
                      ? "Please sign in to start chatting..."
                      : (isTemporaryMode && temporaryCount >= 3
                        ? "Temporary limit reached. Please sign in."
                        : (isLoading ? "Please wait..." : (selectedModel.locked ? "This model is currently unavailable." : "Ask anything (Type : for commands)")))
                  }
                  minRows={1}
                  maxRows={6}
                  className={cn(
                    "w-full border-none focus:outline-none bg-transparent py-3 px-3 text-sm shadow-none resize-none flex-1 overflow-y-auto custom-scrollbar leading-relaxed",
                    theme === 'dropdawn-theme' ? "text-white placeholder:text-white/40" : "placeholder:text-muted-foreground/50"
                    // !user && "cursor-not-allowed opacity-50" // Removed to allow clicking
                  )}
                />
                <div className="flex items-center justify-between px-2 pt-1 border-t border-border/10">
                  <Select value={selectedModel.id} onValueChange={handleModelChange}>
                    <SelectTrigger className={cn(
                      "w-auto h-7 bg-transparent border-none text-[11px] font-medium hover:bg-secondary/50 rounded-md transition-colors px-2 gap-1 focus:ring-0",
                      theme === 'dropdawn-theme' ? "text-white/60 hover:text-white/80" : "text-muted-foreground/70"
                    )}>
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
                    disabled={!input.trim() || isLoading || !!selectedModel.locked || (!user && !isTemporaryMode) || (error?.message?.includes('Rate limit') ?? false) || (isTemporaryMode && temporaryCount >= 3)}
                    className={cn(
                      "rounded-md h-7 w-7 transition-all duration-200 shadow-sm",
                      (input.trim() && !selectedModel.locked && (user || isTemporaryMode)) ? "bg-foreground text-background hover:opacity-90" : "bg-transparent text-muted-foreground/30"
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </form>
            </div>
            <Link href="https://x.com/bikash1376" target="_blank">
              <p className={cn(
                "mt-3 text-center text-[10px] tracking-widest font-medium uppercase",
                theme === 'dropdawn-theme' ? "text-white/40" : "text-muted-foreground/50"
              )}>
                Created by <span className={theme === 'dropdawn-theme' ? "text-white/60" : "text-muted-foreground/80"}>Bikash</span>
              </p>
            </Link>
          </div>
        </div>

        {/* Auth Modal */}
        <AuthModal
          isOpen={activeModal === 'auth'}
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            // Re-check auth would be handled by effect or page reload, but server action revalidates. 
            // We can manually force a check.
            supabase.auth.getUser().then(({ data: { user } }) => {
              setUser(user);
              if (user) loadConversations();
            });
          }}
        />

        {/* Modals */}
        <AnimatePresence>
          {activeModal && activeModal !== 'auth' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModal(null)}
                className="absolute inset-0 bg-background/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-background/95 backdrop-blur-xl border border-border/40 ring-1 ring-border/5 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-border/40 bg-muted/30">
                  <h3 className="text-xl font-light tracking-tight text-foreground flex items-center gap-2 font-serif uppercase">
                    {activeModal === 'tools' && <Wrench className="w-4 h-4 text-muted-foreground" />}
                    {activeModal === 'integrations' && <Puzzle className="w-4 h-4 text-muted-foreground" />}
                    {activeModal === 'settings' && <Settings className="w-4 h-4 text-muted-foreground" />}
                    {activeModal === 'upgrade' && <Sparkles className="w-4 h-4 text-muted-foreground" />}
                    {activeModal === 'help' && <MessageCircleQuestionMark className="w-4 h-4 text-muted-foreground" />}
                    {activeModal}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setActiveModal(null)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full transition-colors">
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="p-6">
                  <ScrollArea className="h-[330px] pr-4">
                    {activeModal === 'tools' ? (
                      <div className="space-y-6">
                        <Input
                          className="bg-secondary/50 border-border/40 focus:bg-background text-foreground placeholder:text-muted-foreground/50 rounded-xl focus:border-primary/30 focus:ring-0"
                          placeholder="Search tools..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />

                        {toolsData.filter((tool) =>
                          tool.name.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((tool, i) => (
                          <div key={i} className="flex flex-col gap-1.5 p-3 rounded-lg hover:bg-secondary/50 transition-colors border border-transparent hover:border-border/40 group">
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{tool.name}</h4>
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
                              { id: 'dropdawn-theme', name: 'Dropdawn', icon: Sparkles },
                            ].map((item) => (
                              <Button
                                key={item.id}
                                variant={'outline'}
                                className={cn(
                                  "flex flex-col items-center gap-2 h-20 border-border/40 transition-all",
                                  theme === item.id
                                    ? "bg-foreground text-background hover:bg-foreground/90 dark:bg-foreground dark:text-background dark:hover:bg-foreground/90"
                                    : "bg-transparent dark:bg-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/50 hover:border-border"
                                )}
                                onClick={() => setTheme(item.id as any)}
                              >
                                <item.icon className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase">{item.name}</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                        {/* <div className="pt-6 border-t border-border/40 space-y-4">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Data Management</label>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/40">
                          <span className="text-sm font-medium text-foreground">Clear Conversations</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearChat}
                            className="text-destructive hover:text-destructive/90 h-8 px-4 text-xs font-bold uppercase hover:bg-destructive/10 rounded-lg transition-colors"
                          >
                            Delete All
                          </Button>
                        </div>
                      </div> */}
                      </div>
                    ) : activeModal === 'upgrade' ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 flex items-center justify-center mb-2 ring-1 ring-border/20">
                          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-xl font-bold text-foreground">Pro Plan Coming Soon</h4>
                          <p className="text-sm text-muted-foreground max-w-[280px] mx-auto leading-relaxed">
                            Unlock longer memory, powerful models, and private storage spaces.
                          </p>
                        </div>
                        <Button className="mt-4 bg-foreground text-background hover:bg-foreground/90 font-medium px-8 rounded-full" onClick={() => setActiveModal(null)}>Get Notified</Button>
                      </div>
                    ) : activeModal === 'help' ? (
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-foreground">Found a Problem?</h4>
                          <p className="text-xs text-muted-foreground">Let us know so we can improve Dropdawn.</p>
                        </div>
                        <form className="space-y-4" onSubmit={async (e) => {
                          e.preventDefault();
                          setIsFeedbackSubmitting(true);
                          const form = e.currentTarget;
                          const formData = new FormData(form);

                          try {
                            const response = await fetch("https://formspree.io/f/xzdrkqyg", {
                              method: "POST",
                              body: formData,
                              headers: {
                                'Accept': 'application/json'
                              }
                            });

                            if (response.ok) {
                              alert('Thank you for your feedback!');
                              form.reset();
                              setActiveModal(null);
                            } else {
                              alert('Oops! There was a problem submitting your feedback.');
                            }
                          } catch (error) {
                            alert('Oops! There was a problem submitting your feedback.');
                          } finally {
                            setIsFeedbackSubmitting(false);
                          }
                        }}>
                          <div className="space-y-2">
                            <label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground">Name</label>
                            <Input
                              id="name"
                              name="name"
                              placeholder="Anonymous"
                              defaultValue="Anonymous"
                              className="bg-secondary/50 text-foreground rounded-lg"
                              disabled={isFeedbackSubmitting}
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="message" className="text-xs font-bold uppercase text-muted-foreground">Message <span className="text-destructive">*</span></label>
                            <TextareaAutosize
                              id="message"
                              name="message"
                              required
                              minRows={3}
                              placeholder="Describe the issue or feedback..."
                              className="w-full bg-secondary/50 border border-border/40 text-foreground rounded-lg p-3 text-sm focus:outline-none  focus:ring-primary/50 resize-none disabled:opacity-50"
                              disabled={isFeedbackSubmitting}
                            />
                          </div>
                          <div className="pt-2 flex justify-end">
                            <Button
                              type="submit"
                              className="bg-foreground text-background hover:bg-foreground/90 font-medium text-xs h-9 px-6 rounded-lg disabled:opacity-70"
                              disabled={isFeedbackSubmitting}
                            >
                              {isFeedbackSubmitting ? 'Sending...' : 'Send Feedback'}
                            </Button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground py-16">
                        <Puzzle className="w-12 h-12 opacity-20" />
                        <div className="text-center space-y-1">
                          {/* <p className="text-sm font-medium text-foreground/80">No active integrations</p>
                        <p className="text-xs">Connect your favorite apps to do more.</p> */}
                          <p className="text-sm font-medium text-foreground/80">Integrations Coming Soon</p>
                          <p className="text-xs">Stay tuned.</p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
