import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Video, Link as LinkIcon, Upload, Play, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

export default function TeacherTutorials() {
  const { user } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [classes, setClasses] = useState<{ id: number; title: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<Tutorial | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tutRes, classRes] = await Promise.all([
      supabase.from('tutorials').select('*, classes(title, code)').order('created_at', { ascending: false }),
      supabase.from('classes').select('id, title, code').eq('is_active', true).order('title'),
    ]);
    if (tutRes.data) setTutorials(tutRes.data as any);
    if (classRes.data) setClasses(classRes.data);
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

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoType('url');
    setVideoUrl('');
    setVideoFile(null);
    setSelectedClassId('');
  };

  const handleSubmit = async () => {
    if (!title.trim() || !selectedClassId) {
      toast.error('Veuillez remplir le titre et sélectionner une classe');
      return;
    }
    if (videoType === 'url' && !videoUrl.trim()) {
      toast.error('Veuillez entrer un lien vidéo');
      return;
    }
    if (videoType === 'upload' && !videoFile) {
      toast.error('Veuillez sélectionner un fichier vidéo');
      return;
    }

    setSubmitting(true);
    try {
      let filePath: string | null = null;
      let fileName: string | null = null;

      if (videoType === 'upload' && videoFile) {
        fileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        filePath = `${selectedClassId}/${Date.now()}_${fileName}`;
        const { error: uploadErr } = await supabase.storage
          .from('tutorials')
          .upload(filePath, videoFile);
        if (uploadErr) throw uploadErr;
      }

      const { error } = await supabase.from('tutorials').insert({
        title: title.trim(),
        description: description.trim() || null,
        video_type: videoType,
        video_url: videoType === 'url' ? videoUrl.trim() : null,
        file_name: fileName,
        file_path: filePath,
        class_id: parseInt(selectedClassId),
        created_by: user!.id,
      });

      if (error) throw error;
      toast.success('Tutoriel ajouté avec succès');
      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (tutorial: Tutorial) => {
    if (!confirm('Supprimer ce tutoriel ?')) return;
    if (tutorial.file_path) {
      await supabase.storage.from('tutorials').remove([tutorial.file_path]);
    }
    const { error } = await supabase.from('tutorials').delete().eq('id', tutorial.id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Tutoriel supprimé');
      fetchData();
    }
  };

  const handlePlay = async (tutorial: Tutorial) => {
    if (tutorial.video_type === 'upload' && tutorial.file_path) {
      const url = await getSignedUrl(tutorial.file_path);
      if (url) setPlayingVideo({ ...tutorial, video_url: url });
    } else {
      setPlayingVideo(tutorial);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Tutoriels</h1>
          <p className="text-sm text-muted-foreground">{tutorials.length} tutoriel{tutorials.length !== 1 ? 's' : ''} disponible{tutorials.length !== 1 ? 's' : ''} pour vos groupes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nouveau tutoriel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau tutoriel</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Titre *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Introduction à React" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description du tutoriel..." rows={2} />
              </div>
              <div>
                <Label>Classe *</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                  <SelectContent>
                    {classes.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type de vidéo</Label>
                <div className="flex gap-2 mt-1">
                  <Button type="button" size="sm" variant={videoType === 'url' ? 'default' : 'outline'} onClick={() => setVideoType('url')}>
                    <LinkIcon className="h-4 w-4 mr-1" /> Lien (YouTube, Vimeo...)
                  </Button>
                  <Button type="button" size="sm" variant={videoType === 'upload' ? 'default' : 'outline'} onClick={() => setVideoType('upload')}>
                    <Upload className="h-4 w-4 mr-1" /> Upload fichier
                  </Button>
                </div>
              </div>
              {videoType === 'url' ? (
                <div>
                  <Label>URL de la vidéo *</Label>
                  <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
              ) : (
                <div>
                  <Label>Fichier vidéo *</Label>
                  <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground mt-1">Aucune limite de taille — tous formats vidéo acceptés</p>
                </div>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Envoi en cours...' : 'Ajouter le tutoriel'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : tutorials.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Video className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucun tutoriel pour le moment</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Cliquez sur "Nouveau tutoriel" pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Tutoriels disponibles
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {tutorials.map(t => {
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
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{t.title}</h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); handleDelete(t); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <Badge variant="secondary" className="mt-2 text-xs bg-primary/10 text-primary border-0">
                          {t.classes?.title || 'Classe'}
                        </Badge>
                        {t.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{t.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
                        {t.file_name && (
                          <>
                            <Upload className="h-3 w-3" />
                            <span className="truncate max-w-[140px]">{t.file_name}</span>
                          </>
                        )}
                        <Calendar className="h-3 w-3 ml-auto" />
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
  );
}
