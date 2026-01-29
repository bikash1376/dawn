import { motion } from 'framer-motion';
import { Cloud, Cog, Lock, User, Bell, Activity, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SettingsModal({ user }: { user: any }) {

    // Calculate credits left
    const messageHistory: number[] = user?.user_metadata?.message_history || [];
    const TWELVE_HOURS_AGO = Date.now() - 12 * 60 * 60 * 1000;
    const recentMessages = messageHistory.filter((timestamp: number) => timestamp > TWELVE_HOURS_AGO);
    const messagesLeft = Math.max(0, 5 - recentMessages.length);
    const progress = (messagesLeft / 5) * 100;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-secondary/20 border border-border/40">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-lg font-bold uppercase ring-2 ring-border/40">
                    {user?.email?.slice(0, 2)}
                </div>
                <div className="flex-1">
                    <h4 className="text-sm font-bold text-foreground">{user?.user_metadata?.full_name || 'User'}</h4>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Online</span>
                    </div>
                </div>
                {/* <Button variant="outline" size="sm" className="h-7 text-xs">Edit Profile</Button> */}
            </div>

            <div className="space-y-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Usage & Limits</label>
                <div className="p-4 rounded-xl bg-secondary/10 border border-border/40 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Daily Credits</span>
                        </div>
                        <span className="text-xs font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/20">{messagesLeft} / 5 Left</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Free tier limit. Resets every 12 hours.
                    </p>
                </div>
            </div>

            {/* 
            <div className="space-y-4 opacity-50 pointer-events-none grayscale">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">General</label>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Account</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Manage</Button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                        <div className="flex items-center gap-3">
                            <Lock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Privacy & Security</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">View</Button>
                    </div>
                </div>
            </div> 
            */}
        </div>
    );
}
