import { Button } from '@/components/ui/button';
import { Palette, Layout, Type } from 'lucide-react';

export function CustomizeModal() {
    return (
        <div className="space-y-8 text-center py-8">
            <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Palette className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Deep Customization</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Soon you'll be able to tweak every aspect of the UI, including layout presets, font families, and custom seed colors.
                </p>
            </div>
            <div className="flex justify-center gap-3 opacity-50 pointer-events-none grayscale">
                <Button size="sm" variant="outline" className="gap-2"><Layout className="w-3 h-3" /> Layouts</Button>
                <Button size="sm" variant="outline" className="gap-2"><Type className="w-3 h-3" /> Typography</Button>
            </div>
        </div>
    );
}
