import changelogData from '@/data/changelog.json';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ChangelogModal() {
    return (
        <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border/40" />
            <div className="space-y-8 relative">
                {changelogData.map((item, index) => (
                    <div key={index} className="flex gap-6 group">
                        <div className="relative z-10 flex-none w-10 h-10 rounded-full bg-secondary border border-border/40 flex items-center justify-center group-hover:bg-primary/10 group-hover:border-primary/30 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/50 group-hover:bg-primary transition-colors" />
                        </div>
                        <div className="flex-1 pt-1.5 space-y-1.5">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-mono text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded border border-border/20">{item.date}</span>
                            </div>
                            <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                                {item.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
