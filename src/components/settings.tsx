import { motion } from 'framer-motion';
import { Cloud, Cog, Lock, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SettingsModal() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
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
                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border/40">
                        <div className="flex items-center gap-3">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Notifications</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Configure</Button>
                    </div>
                </div>
            </div>

            <div className="pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <Cloud className="w-4 h-4 text-primary" />
                    <div className="flex-1">
                        <h4 className="text-xs font-bold text-foreground">Sync Status</h4>
                        <p className="text-[10px] text-muted-foreground">Last synced 2 mins ago</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </div>
        </div>
    );
}
