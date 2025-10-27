import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Send, Sparkles, Loader2 } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

type AssistantChat = {
  id: string;
  userId: string;
  workflowId: string | null;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
};

export default function AppAssistant() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch or create chat session
  const { data: chat, isLoading } = useQuery<AssistantChat>({
    queryKey: ['/api/assistant/chat'],
    enabled: isAuthenticated,
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assistant/chat'] });
      setInput("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMutation.isPending) return;
    sendMutation.mutate(input.trim());
  };

  const messages = chat?.messages || [];

  return (
    <div className="container py-8 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500">
            <Bot className="w-6 h-6 text-primary-foreground" />
          </div>
          AI Assistant
        </h1>
        <p className="text-muted-foreground mt-2">Get help building and optimizing your workflows</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 p-6 space-y-4">
            <div className="flex gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="flex-1 space-y-2 max-w-md">
                <Skeleton className="h-4 w-1/4 ml-auto" />
                <Skeleton className="h-16 w-full" />
              </div>
              <Skeleton className="w-10 h-10 rounded-full" />
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-md text-center space-y-6">
              <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 w-20 h-20 mx-auto flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
                <p className="text-muted-foreground">
                  Ask me about workflow design, agent configuration, best practices, or troubleshooting.
                </p>
              </div>
              <div className="grid gap-2 text-left">
                <button
                  onClick={() => setInput("How do I create my first workflow?")}
                  className="p-3 rounded-lg border hover-elevate active-elevate-2 transition-all text-sm"
                  data-testid="suggestion-first-workflow"
                >
                  💡 How do I create my first workflow?
                </button>
                <button
                  onClick={() => setInput("What's the difference between agent types?")}
                  className="p-3 rounded-lg border hover-elevate active-elevate-2 transition-all text-sm"
                  data-testid="suggestion-agent-types"
                >
                  🤔 What's the difference between agent types?
                </button>
                <button
                  onClick={() => setInput("How does the knowledge base work?")}
                  className="p-3 rounded-lg border hover-elevate active-elevate-2 transition-all text-sm"
                  data-testid="suggestion-knowledge-base"
                >
                  🧠 How does the knowledge base work?
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 p-6" ref={scrollRef}>
            <div className="space-y-6">
              {messages.map((message, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  data-testid={`message-${message.role}-${i}`}
                >
                  {message.role === 'assistant' && (
                    <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500 h-fit">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`flex flex-col gap-1 max-w-[70%]`}>
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <span className="text-xs text-muted-foreground px-2">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {message.role === 'user' && (
                    <div className="p-2 rounded-lg bg-primary/10 h-fit">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              {sendMutation.isPending && (
                <div className="flex gap-4 justify-start">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500 h-fit">
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col gap-1 max-w-[70%]">
                    <div className="p-4 rounded-lg bg-muted">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        <div className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about workflows, agents, or best practices..."
              className="min-h-[60px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              disabled={sendMutation.isPending}
              data-testid="input-chat-message"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || sendMutation.isPending}
              className="h-[60px] w-[60px]"
              data-testid="button-send-message"
            >
              {sendMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
