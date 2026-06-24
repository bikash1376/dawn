'use client';

import { Button } from '@/components/ui/button';
import { Download, Presentation } from 'lucide-react';

interface Slide {
    title: string;
    bullets?: string[];
    isTitle?: boolean;
}

interface PptxResultProps {
    result: {
        message?: string;
        filename?: string;
        dataUri?: string;
        theme?: { name: string; bg: string; title: string; body: string; accent: string; key?: string };
        slides?: Slide[];
        error?: string;
    };
}

// hex like "FFFFFF" (no #) -> "#FFFFFF"
const hex = (c?: string) => (c ? `#${c}` : '#000000');

export function PptxResult({ result }: PptxResultProps) {
    if (result.error) {
        return <div className="text-sm text-destructive font-medium">{result.error}</div>;
    }
    const { slides = [], theme, dataUri, filename, message } = result;

    const download = () => {
        if (!dataUri) return;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = filename || 'presentation.pptx';
        link.click();
    };

    return (
        <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                    <Presentation className="w-4 h-4 text-muted-foreground" />
                    {message || 'Presentation'}
                    {theme?.name && <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70">· {theme.name}</span>}
                </div>
                {dataUri && (
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 cursor-pointer shrink-0" onClick={download}>
                        <Download className="w-3 h-3" />
                        .pptx
                    </Button>
                )}
            </div>

            {/* Slide preview carousel (themed mini-slides) */}
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {slides.map((s, i) => (
                    <div
                        key={i}
                        className="shrink-0 w-[240px] aspect-video rounded-md border border-border/40 shadow-sm overflow-hidden flex flex-col p-3 relative"
                        style={{ background: hex(theme?.bg) }}
                    >
                        <div className="h-1 w-8 rounded-full mb-2" style={{ background: hex(theme?.accent) }} />
                        <div
                            className={s.isTitle ? 'text-[15px] font-bold leading-tight' : 'text-[12px] font-bold leading-tight'}
                            style={{ color: hex(theme?.title) }}
                        >
                            {s.title}
                        </div>
                        {s.bullets && s.bullets.length > 0 && (
                            <ul className="mt-1.5 space-y-1 overflow-hidden">
                                {s.bullets.slice(0, 4).map((b, j) => (
                                    <li key={j} className="text-[9px] leading-snug flex gap-1" style={{ color: hex(theme?.body) }}>
                                        {!s.isTitle && <span style={{ color: hex(theme?.accent) }}>•</span>}
                                        <span className="line-clamp-2">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        <span className="absolute bottom-1.5 right-2 text-[8px] opacity-40" style={{ color: hex(theme?.body) }}>
                            {i + 1}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
