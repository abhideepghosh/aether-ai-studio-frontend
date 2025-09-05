"use client";

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { History, Loader2, PanelLeftClose, PanelLeftOpen, Trash2, UploadCloud, Wand2, X } from 'lucide-react';

import { AetherLogo } from '@/components/aether-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { HistoryItem } from '@/lib/types';

const STYLE_OPTIONS = ['Editorial', 'Streetwear', 'Vintage', 'Cyberpunk', 'Fantasy'];
const MAX_FILE_SIZE_MB = 10;
const MAX_DIMENSION_PX = 1920;
const MAX_HISTORY_ITEMS = 5;
const RETRY_ATTEMPTS = 3;

// Main Page Component
export default function AetherStudioPage() {
  // State Management
  const [prompt, setPrompt] = useState<string>('');
  const [style, setStyle] = useState<string>(STYLE_OPTIONS[0]);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true);

  const { toast } = useToast();

  // Load history from localStorage on initial render
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('aether-ai-history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Failed to load history from localStorage:', error);
    }
  }, []);

  // Handlers
  const handleImageUpload = (dataUrl: string) => {
    setImageDataUrl(dataUrl);
    setGeneratedImageUrl(null);
  };

  const handleGeneration = async () => {
    if (!imageDataUrl) {
      toast({ variant: 'destructive', title: 'Please upload an image first.' });
      return;
    }
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Please enter a prompt.' });
      return;
    }

    setIsLoading(true);
    setGeneratedImageUrl(null);
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await mockApiCall({ signal });
        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          imageDataUrl,
          prompt,
          style,
          timestamp: new Date().toISOString(),
          resultImageUrl: response.imageUrl,
        };

        const updatedHistory = [newHistoryItem, ...history].slice(0, MAX_HISTORY_ITEMS);
        setHistory(updatedHistory);
        localStorage.setItem('aether-ai-history', JSON.stringify(updatedHistory));

        setGeneratedImageUrl(response.imageUrl);
        toast({ title: '✨ Generation successful!', description: 'Your new image is ready.' });
        break; // Exit loop on success
      } catch (error: any) {
        if (error.name === 'AbortError') {
          toast({ title: 'Generation cancelled' });
          break;
        }
        if (attempt === RETRY_ATTEMPTS) {
          toast({ variant: 'destructive', title: 'Generation Failed', description: error.message || 'The model failed to generate an image after multiple attempts.' });
        } else {
          const delay = 1000 * 2 ** (attempt - 1);
          toast({ title: `Attempt ${attempt} failed. Retrying in ${delay / 1000}s...`, description: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    setIsLoading(false);
    abortControllerRef.current = null;
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleRestoreHistory = (item: HistoryItem) => {
    setImageDataUrl(item.imageDataUrl);
    setPrompt(item.prompt);
    setStyle(item.style);
    setGeneratedImageUrl(item.resultImageUrl);
    toast({ title: 'History Restored', description: 'Loaded a previous generation.' });
  };
  
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('aether-ai-history');
    toast({ title: 'History Cleared' });
  }

  return (
    <div className="flex h-screen w-full bg-muted/30 font-body">
      <HistoryPanel
        history={history}
        onRestore={handleRestoreHistory}
        onClear={handleClearHistory}
        isOpen={isHistoryPanelOpen}
        setIsOpen={setIsHistoryPanelOpen}
      />
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <AppHeader toggleHistory={() => setIsHistoryPanelOpen(o => !o)} isHistoryOpen={isHistoryPanelOpen} />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="lg:col-span-2 flex flex-col gap-8">
              <ImageUploader onUpload={handleImageUpload} initialImage={imageDataUrl} />
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Customize Your Generation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., A futuristic cityscape at dusk..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      rows={4}
                      className="text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="style">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger id="style">
                        <SelectValue placeholder="Select a style" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleGeneration} disabled={isLoading} size="lg" className="flex-1">
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wand2 className="mr-2 h-5 w-5" />}
                  {isLoading ? 'Generating...' : 'Generate Image'}
                </Button>
                {isLoading && (
                  <Button onClick={handleCancel} variant="outline" size="lg">
                    <X className="mr-2 h-5 w-5" /> Cancel
                  </Button>
                )}
              </div>
            </div>

            <div className="lg:col-span-3 flex flex-col gap-8">
              <LiveSummary image={imageDataUrl} prompt={prompt} style={style} />
              <ResultDisplay generatedImage={generatedImageUrl} isLoading={isLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sub-components for better organization
const AppHeader = ({ toggleHistory, isHistoryOpen }: { toggleHistory: () => void; isHistoryOpen: boolean }) => (
  <header className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <AetherLogo className="h-8 w-8 text-primary" />
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Aether AI Studio</h1>
        <p className="text-muted-foreground">Transform your images with generative AI</p>
      </div>
    </div>
    <Button onClick={toggleHistory} variant="ghost" size="icon" className="md:hidden">
      {isHistoryOpen ? <PanelLeftClose /> : <History />}
    </Button>
  </header>
);

const ImageUploader = ({ onUpload, initialImage }: { onUpload: (dataUrl: string) => void; initialImage: string | null; }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid File Type', description: 'Please upload a PNG or JPG image.' });
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'File Too Large', description: `Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.` });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
          if (width > height) {
            height = Math.round((height * MAX_DIMENSION_PX) / width);
            width = MAX_DIMENSION_PX;
          } else {
            width = Math.round((width * MAX_DIMENSION_PX) / height);
            height = MAX_DIMENSION_PX;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          onUpload(canvas.toDataURL('image/jpeg', 0.9));
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onUpload, toast]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary');
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
  };

  return (
    <Card
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="transition-colors"
    >
      <CardContent className="p-4">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/png, image/jpeg" className="hidden" />
        {initialImage ? (
          <div className="relative group aspect-square rounded-md overflow-hidden">
            <Image src={initialImage} alt="Uploaded preview" layout="fill" objectFit="cover" data-ai-hint="user image" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <Button onClick={() => fileInputRef.current?.click()}>Change Image</Button>
              <Button variant="destructive" size="icon" onClick={() => onUpload('')}><Trash2 /></Button>
            </div>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-md text-center cursor-pointer hover:border-primary transition-colors">
            <UploadCloud className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">Click or drag & drop to upload</p>
            <p className="text-sm text-muted-foreground">PNG or JPG, up to {MAX_FILE_SIZE_MB}MB</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const LiveSummary = ({ image, prompt, style }: { image: string | null; prompt: string; style: string; }) => (
  <Card>
    <CardHeader>
      <CardTitle>Live Summary</CardTitle>
      <CardDescription>A preview of your generation inputs.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div>
        <Label className="font-semibold">Source Image</Label>
        {image ? <div className="mt-2 w-full aspect-video relative rounded-md overflow-hidden bg-muted"><Image src={image} alt="Summary preview" layout="fill" objectFit="contain" data-ai-hint="user image" /></div> : <p className="text-sm text-muted-foreground mt-1">No image uploaded.</p>}
      </div>
      <div>
        <Label className="font-semibold">Prompt</Label>
        <p className="text-sm text-muted-foreground mt-1 h-20 overflow-y-auto rounded-md bg-muted/50 p-2">{prompt || 'No prompt entered.'}</p>
      </div>
      <div>
        <Label className="font-semibold">Style</Label>
        <p className="text-sm text-muted-foreground mt-1">{style}</p>
      </div>
    </CardContent>
  </Card>
);

const ResultDisplay = ({ generatedImage, isLoading }: { generatedImage: string | null, isLoading: boolean }) => (
  <Card className="flex-1 flex flex-col">
    <CardHeader>
      <CardTitle>Result</CardTitle>
      <CardDescription>Your generated image will appear here.</CardDescription>
    </CardHeader>
    <CardContent className="flex-1 flex items-center justify-center">
      <div className="w-full aspect-square relative bg-muted/50 rounded-lg border border-dashed flex items-center justify-center overflow-hidden">
        {isLoading && <Skeleton className="w-full h-full" />}
        {!isLoading && generatedImage && <Image src={generatedImage} alt="Generated result" layout="fill" objectFit="cover" data-ai-hint="ai generated" />}
        {!isLoading && !generatedImage && (
          <div className="text-center text-muted-foreground">
            <Wand2 className="mx-auto h-12 w-12" />
            <p className="mt-4 font-medium">Your creation awaits</p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const HistoryPanel = ({ history, onRestore, onClear, isOpen, setIsOpen }: {
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}) => (
  <aside className={`bg-card border-r flex-col h-full transition-all duration-300 ease-in-out ${isOpen ? 'w-80 p-4' : 'w-0 p-0'} hidden md:flex`}>
    <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100 delay-200' : 'opacity-0'} w-full h-full flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5" /> Generation History
        </h2>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}><PanelLeftClose /></Button>
      </div>
      <div className="flex-1 overflow-y-auto -mr-4 pr-4 space-y-3">
        {history.length > 0 ? history.map(item => (
          <div key={item.id} onClick={() => onRestore(item)} className="group cursor-pointer p-2 rounded-lg hover:bg-accent transition-colors">
            <div className="flex items-start gap-3">
              <Image src={item.resultImageUrl} width={64} height={64} alt="History item" className="rounded-md aspect-square object-cover" data-ai-hint="ai generated" />
              <div className="flex-1 truncate">
                <p className="font-medium truncate text-sm">{item.prompt}</p>
                <p className="text-xs text-muted-foreground">{item.style} &middot; {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}</p>
              </div>
            </div>
          </div>
        )) : (
          <div className="text-center text-muted-foreground pt-10">
            <p className="text-sm">No generations yet.</p>
          </div>
        )}
      </div>
      {history.length > 0 && <Button variant="outline" onClick={onClear}><Trash2 className="mr-2 h-4 w-4" />Clear History</Button>}
    </div>
    {!isOpen && (
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="absolute top-4 left-4 z-10"><PanelLeftOpen /></Button>
    )}
  </aside>
);

// Mock API call function
const mockApiCall = ({ signal }: { signal: AbortSignal }): Promise<{ imageUrl: string }> => {
  return new Promise((resolve, reject) => {
    const delay = 2000 + Math.random() * 3000;
    const timeoutId = setTimeout(() => {
      if (Math.random() > 0.3) { // 70% success rate
        resolve({ imageUrl: `https://picsum.photos/1024/1024?random=${Math.random()}` });
      } else {
        reject(new Error('Model overloaded'));
      }
    }, delay);

    signal.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new DOMException('Request was aborted', 'AbortError'));
    });
  });
};
