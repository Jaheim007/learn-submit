import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCheck, Bell, AlertCircle, Star, MessageSquare, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const typeIcons = {
  submission_created: Bell,
  status_changed: AlertCircle,
  grade_assigned: Star,
  feedback_added: MessageSquare,
};

const typeLabels = {
  submission_created: "Nouvelle soumission",
  status_changed: "Changement de statut",
  grade_assigned: "Note attribuée",
  feedback_added: "Commentaire ajouté",
};

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .is('read_at', null);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications'] });
      toast({
        title: "Notifications marquées comme lues",
        description: "Toutes les notifications ont été marquées comme lues."
      });
    }
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Notifications</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="bg-muted/50 h-20" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-muted-foreground">
                {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              variant="outline"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Aucune notification</h3>
            <p className="text-muted-foreground">Vous n'avez aucune notification pour le moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type as keyof typeof typeIcons];
            const isUnread = !notification.read_at;
            
            return (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors ${
                  isUnread ? 'bg-primary/5 border-primary/20' : ''
                }`}
                onClick={() => {
                  if (isUnread) {
                    markAsReadMutation.mutate(notification.id);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${isUnread ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex items-center gap-2">
                        <Badge variant={isUnread ? 'default' : 'secondary'} className="text-xs">
                          {typeLabels[notification.type as keyof typeof typeLabels]}
                        </Badge>
                        {isUnread && (
                          <Badge variant="destructive" className="text-xs">
                            Nouveau
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true,
                        locale: fr 
                      })}
                    </span>
                  </div>
                  <CardTitle className={`text-base ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                    {notification.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm">
                    {notification.body}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}