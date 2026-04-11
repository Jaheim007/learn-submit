import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCheck, Bell, AlertCircle, Star, MessageSquare, ArrowLeft, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

const typeIcons: Record<string, any> = {
  submission_created: Bell,
  status_changed: AlertCircle,
  grade_assigned: Star,
  feedback_added: MessageSquare,
  course_material_added: BookOpen,
};

const typeLabels: Record<string, string> = {
  submission_created: "Soumission",
  status_changed: "Statut",
  grade_assigned: "Note",
  feedback_added: "Commentaire",
  course_material_added: "Contenu",
};

const typeColors: Record<string, string> = {
  submission_created: 'bg-success/15 text-success',
  status_changed: 'bg-warning/15 text-warning',
  grade_assigned: 'bg-primary/15 text-primary',
  feedback_added: 'bg-accent text-accent-foreground',
  course_material_added: 'bg-primary/15 text-primary',
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
      toast({ title: "Tout marqué comme lu" });
    }
  });

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <div className="min-h-screen min-h-[100dvh] bg-background">
      {/* Native sticky header */}
      <div className="sticky top-0 z-30 glass-heavy">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl text-foreground hover:bg-muted/60 transition-all touch-manipulation active:scale-90"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-[15px] font-bold text-foreground">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-[11px] text-muted-foreground">{unreadCount} non lue{unreadCount > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors touch-manipulation active:scale-95"
            >
              Tout lire
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl shimmer" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="h-20 w-20 rounded-[22px] bg-muted/60 flex items-center justify-center mb-5">
              <Bell className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Aucune notification</h3>
            <p className="text-sm text-muted-foreground">Vous serez notifié ici</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-2">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type] || Bell;
              const isUnread = !notification.read_at;
              const colorClass = typeColors[notification.type] || 'bg-muted text-muted-foreground';

              return (
                <motion.div
                  key={notification.id}
                  variants={staggerItem}
                  onClick={() => { if (isUnread) markAsReadMutation.mutate(notification.id); }}
                  className={`relative rounded-2xl p-4 transition-all touch-manipulation active:scale-[0.98] cursor-pointer ${
                    isUnread
                      ? 'bg-primary/5 border border-primary/10'
                      : 'bg-card border border-border/40'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`shrink-0 h-10 w-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-0.5">
                        <h3 className={`text-sm font-semibold leading-tight ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h3>
                        {isUnread && (
                          <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1.5">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 rounded-md border-border/50">
                          {typeLabels[notification.type] || notification.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}