import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Facebook,
    Twitter,
    Linkedin,
    MessageCircle,
    Link2,
    Copy,
    Check,
    Clock,
} from "lucide-react";

interface ShareModalProps {
    videoId: string;
    videoTitle: string;
    currentTime?: number; // in seconds, optional
    children: React.ReactNode; // trigger button
}

export function ShareModal({
    videoId,
    videoTitle,
    currentTime,
    children,
}: ShareModalProps) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const baseUrl = `${window.location.origin}/watch/${videoId}`;
    const timeParam = currentTime && currentTime > 0 ? `?t=${Math.floor(currentTime)}` : "";
    const shareUrl = baseUrl + timeParam;

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
            const textarea = document.createElement("textarea");
            textarea.value = shareUrl;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareOn = (platform: string) => {
        let url = "";
        const encodedUrl = encodeURIComponent(shareUrl);
        const encodedTitle = encodeURIComponent(videoTitle);
        switch (platform) {
            case "facebook":
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
            case "twitter":
                url = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
                break;
            case "linkedin":
                url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
                break;
            case "whatsapp":
                url = `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`;
                break;
            default:
                return;
        }
        window.open(url, "_blank", "width=600,height=500");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share this video</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Link + copy */}
                    <div className="flex items-center gap-2">
                        <Input value={shareUrl} readOnly className="flex-1" />
                        <Button size="icon" onClick={copyToClipboard} variant="outline">
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Social buttons */}
                    <div className="flex justify-around gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => shareOn("facebook")}
                            aria-label="Share on Facebook"
                        >
                            <Facebook className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => shareOn("twitter")}
                            aria-label="Share on X"
                        >
                            <Twitter className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => shareOn("linkedin")}
                            aria-label="Share on LinkedIn"
                        >
                            <Linkedin className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => shareOn("whatsapp")}
                            aria-label="Share on WhatsApp"
                        >
                            <MessageCircle className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Timestamp info */}
                    {currentTime !== undefined && currentTime > 0 && (
                        <p className="text-xs text-muted-foreground text-center">
                            <Clock className="inline h-3 w-3 mr-1" />
                            Link will start at {formatTime(currentTime)}
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
}