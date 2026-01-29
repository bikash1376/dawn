import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sun, Moon, Monitor, Sparkles } from 'lucide-react';

interface AppearanceModalProps {
    theme: string;
    setTheme: (theme: any) => void;
}

export function AppearanceModal({ theme, setTheme }: AppearanceModalProps) {
    return (
        <div className="space-y-8">
            <div className="space-y-4">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Theme Preference</label>
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
                            onClick={() => setTheme(item.id)}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase">{item.name}</span>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/20 border border-border/40 text-xs text-muted-foreground leading-relaxed">
                <Sparkles className="w-4 h-4 mb-2 opacity-50" />
                More customization options including font scaling and accent colors will be available in future updates.
            </div>
        </div>
    );
}
