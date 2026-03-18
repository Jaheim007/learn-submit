import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StudentDashboardLayout } from '@/components/StudentDashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Video, Play, Calendar } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
      const uniqueClasses = classRes.data
        .map((e: any) => e.classes)
        .filter(Boolean)
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

  const filtered = selectedClass === 'all'
    ? tutorials
    : tutorials.filter(t => String(t.class_id) === selectedClass);

  return (
    <StudentDashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tutoriels</h1>
            <p className="text-sm text-muted-foreground">Regardez les vidéos tutoriels de vos formateurs</p>
          </div>
          {classes.length > 1 && (
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Chargement...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Video className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Aucun tutoriel disponible</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Vos formateurs ajouteront bientôt des vidéos ici</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Tutoriels disponibles
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {filtered.map(t => {
                const thumbnail = t.video_type === 'url' && t.video_url ? getYoutubeThumbnail(t.video_url) : null;

                return (
                  <Card
                    key={t.id}
                    className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50"
                    onClick={() => handlePlay(t)}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Thumbnail */}
                      <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-muted overflow-hidden">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={t.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                            <Video className="h-10 w-10 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                        <div>
                          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{t.title}</h3>
                          <Badge variant="secondary" className="mt-2 text-xs bg-primary/10 text-primary border-0">
                            {t.classes?.title}
                          </Badge>
                          {t.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{t.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {/* Video Player Dialog */}
        <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
            <div className="p-4 pb-2">
              <h2 className="text-lg font-semibold">{playingVideo?.title}</h2>
              {playingVideo?.description && (
                <p className="text-sm text-muted-foreground mt-1">{playingVideo.description}</p>
              )}
            </div>
            <div className="aspect-video w-full bg-black">
              {playingVideo?.video_type === 'url' && playingVideo.video_url && (
                <iframe
                  src={extractEmbedUrl(playingVideo.video_url)}
                  className="w-full h-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
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
