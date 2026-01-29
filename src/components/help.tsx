import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import TextareaAutosize from 'react-textarea-autosize';
import { useState } from 'react';

interface HelpModalProps {
    onClose: () => void;
}

export function HelpModal({ onClose }: HelpModalProps) {
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

    return (
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
                        onClose();
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
    );
}
