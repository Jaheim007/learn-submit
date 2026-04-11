import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Video, Play, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface Tutorial {
  id: string;
  title: string;
  description: string | null;
  video_type: string;
  video_url: string | null;
  file_name: string | null;
  file_path: string | null;
  class_id: number;
  created_at: string;
  classes?: { title: string; code: string };
}

export default function StudentTutorials() {
  const { user } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [classes, setClasses] = useState<{ id: number; title: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<Tutorial | null>(null);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    const [tutRes, classRes] = await Promise.all([
      supabase.from('tutorials').select('*, classes(title, code)').order('created_at', { ascending: false }),
      supabase.from('enrollments')
        .select('class_id, classes(id, title)')
        .eq('student_id', (await supabase.from('students').select('id').eq('user_id', user!.id).single()).data?.id || ''),
    ]);
    if (tutRes.data) setTutorials(tutRes.data as any);
    if (classRes.data) {
      const uniqueClasses = classRes.data.map((e: any) => e.classes).filter(Boolean)
        .filter((c: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === c.id) === i);
      setClasses(uniqueClasses);
    }
    setLoading(false);
  };

  const extractEmbedUrl = (url: string): string => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
  };

  const getYoutubeThumbnail = (url: string): string | null => {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
    return null;
  };

  const getSignedUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from('tutorials').createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  const handlePlay = async (tutorial: Tutorial) => {
    if (tutorial.video_type === 'upload' && tutorial.file_path) {
      const url = await getSignedUrl(tutorial.file_path);
      if (url) setPlayingVideo({ ...tutorial, video_url: url });
    } else {
      setPlayingVideo(tutorial);
    }
  };

  const filtered = selectedClass === 'all' ? tutorials : tutorials.filter(t => String(t.class_id) === selectedClass);

  return (
    <StudentDashboardLayout>
      <div className="max-w-2xl mx-auto space-y-5">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground tracking-tight font-heading">Tutoriels</h1>
          <p className="text-sm text-muted-foreground mt-1">Vidéos de vos formateurs</p>
        </motion.div>

        {/* Class filter pills */}
        {classes.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            <button
              onClick={() => setSelectedClass('all')}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-95 ${
                selectedClass === 'all'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                  : 'bg-card text-muted-foreground border border-border/60'
              }`}
            >
              Tout
            </button>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(String(c.id))}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all touch-manipulation active:scale-95 ${
                  selectedClass === String(c.id)
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'bg-card text-muted-foreground border border-border/60'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20">
            <div className="h-20 w-20 rounded-[22px] bg-muted/60 flex items-center justify-center mb-5">
              <Video className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">Aucun tutoriel</h3>
            <p className="text-sm text-muted-foreground">Les tutoriels apparaîtront ici</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3">
            {filtered.map(t => {
              const thumbnail = t.video_type === 'url' && t.video_url ? getYoutubeThumbnail(t.video_url) : null;
              return (
                <motion.div
                  key={t.id}
                  variants={staggerItem}
                  onClick={() => handlePlay(t)}
                  className="bg-card rounded-2xl border border-border/50 overflow-hidden touch-manipulation active:scale-[0.98] cursor-pointer transition-all"
                >
                  <div className="flex">
                    {/* Thumbnail */}
                    <div className="relative w-28 sm:w-36 shrink-0 bg-muted overflow-hidden">
                      {thumbnail ? (
                        <img src={thumbnail} alt={t.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full min-h-[80px] flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                          <Video className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg">
                          <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                      <div>
                        <h3 className="text-sm font-bold text-foreground leading-tight line-clamp-2">{t.title}</h3>
                        <Badge variant="outline" className="mt-1.5 text-[10px] px-1.5 py-0 h-4 rounded-md border-border/50">
                          {t.classes?.code}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground/60">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Video Player — fullscreen-style on mobile */}
        <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="w-[95vw] max-w-4xl p-0 overflow-hidden rounded-2xl">
            <div className="p-4 pb-2">
              <h2 className="text-base font-bold text-foreground">{playingVideo?.title}</h2>
              {playingVideo?.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{playingVideo.description}</p>
              )}
            </div>
            <div className="aspect-video w-full bg-black">
              {playingVideo?.video_type === 'url' && playingVideo.video_url && (
                <iframe src={extractEmbedUrl(playingVideo.video_url)} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              )}
              {playingVideo?.video_type === 'upload' && playingVideo.video_url && (
                <video src={playingVideo.video_url} controls autoPlay className="w-full h-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </StudentDashboardLayout>
  );
}