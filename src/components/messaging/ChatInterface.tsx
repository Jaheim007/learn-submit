import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { initZegoCloud, sendMessage, getZimInstance, logoutZego } from '@/lib/zegoCloud';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: number;
  isMine: boolean;
}

interface ChatInterfaceProps {
  recipientId?: string;
  recipientName?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  recipientId = 'admin',
  recipientName = 'Support'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !isInitialized && user) {
      initializeChat();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      logoutZego();
    };
  }, []);

  const initializeChat = async () => {
    if (!user) return;
    
    setIsConnecting(true);
    try {
      const zim = await initZegoCloud(user.id, user.email || 'User');
      
      // Listen for incoming messages
      zim.on('receivePeerMessage', (message: any) => {
        const newMsg: Message = {
          id: Date.now().toString(),
          text: message.message,
          sender: message.fromUserID,
          timestamp: message.timestamp,
          isMine: false
        };
        setMessages(prev => [...prev, newMsg]);
      });

      setIsInitialized(true);
      toast({
        title: "Chat connecté",
        description: "Vous pouvez maintenant envoyer des messages",
      });
    } catch (error: any) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Erreur de connexion",
        description: error.message || "Impossible de se connecter au chat",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !isInitialized) return;

    try {
      await sendMessage(recipientId, newMessage, 'peer');
      
      const msg: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: user?.id || '',
        timestamp: Date.now(),
        isMine: true
      };
      
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur d'envoi",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{recipientName[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{recipientName}</h3>
            <p className="text-xs opacity-90">
              {isInitialized ? 'En ligne' : isConnecting ? 'Connexion...' : 'Hors ligne'}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="text-primary-foreground hover:bg-primary-foreground/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun message pour le moment</p>
              <p className="text-sm">Commencez une conversation</p>
            </div>
          )}
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMine ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  msg.isMine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={isInitialized ? "Tapez un message..." : "Connexion en cours..."}
            disabled={!isInitialized}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isInitialized}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
