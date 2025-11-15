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
  course_material_added: "Nouveau contenu",
};

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
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
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold tracking-tight">NOTIFICATIONS</h1>
            {unreadCount > 0 && (
              <Button 
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                Tout marquer comme lu
              </Button>
            )}
          </div>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} notification{unreadCount > 1 ? 's' : ''} non lue{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Aucune notification</h3>
              <p className="text-sm text-muted-foreground">Vous n'avez aucune notification pour le moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;
              const isUnread = !notification.read_at;
              
              const typeColors = {
                submission_created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                status_changed: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                grade_assigned: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                feedback_added: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                course_material_added: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
              };
              
              return (
                <Card 
                  key={notification.id} 
                  className={`border-0 shadow-sm transition-all hover:shadow-md cursor-pointer ${
                    isUnread ? 'bg-primary/5' : 'bg-card'
                  }`}
                  onClick={() => {
                    if (isUnread) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {isUnread ? (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <CheckCheck className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Badge 
                            className={`text-xs font-medium ${
                              typeColors[notification.type as keyof typeof typeColors] || 'bg-gray-100 text-gray-700'
                            }`}
                            variant="secondary"
                          >
                            {typeLabels[notification.type as keyof typeof typeLabels] || notification.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                            <span className="inline-block w-3 h-3">⏰</span>
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true,
                              locale: fr 
                            })}
                          </span>
                        </div>
                        
                        <h3 className={`text-sm font-semibold mb-1 ${
                          isUnread ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.title}
                        </h3>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.body}
                        </p>
                        
                        {notification.metadata && typeof notification.metadata === 'object' && 
                         Object.keys(notification.metadata).length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs text-primary hover:underline cursor-pointer">
                              Voir les détails
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}