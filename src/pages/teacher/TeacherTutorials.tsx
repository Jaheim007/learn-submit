import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Video, Link as LinkIcon, Upload, Play, ExternalLink } from 'lucide-react';
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
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    return url;
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tutoriels</h1>
          <p className="text-sm text-muted-foreground">Gérez vos vidéos tutoriels par classe</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Ajouter un tutoriel
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
          <CardContent className="py-12 text-center">
            <Video className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Aucun tutoriel pour le moment</p>
            <p className="text-sm text-muted-foreground/60">Cliquez sur "Ajouter un tutoriel" pour commencer</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tutorials.map(t => (
            <Card key={t.id} className="group overflow-hidden">
              {t.video_type === 'url' && t.video_url && (
                <div className="aspect-video bg-muted">
                  <iframe
                    src={extractEmbedUrl(t.video_url)}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}
              {t.video_type === 'upload' && (
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <Play className="h-12 w-12 text-muted-foreground/40" />
                </div>
              )}
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">{t.title}</CardTitle>
                  <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(t)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-fit text-xs">
                  {t.classes?.title || 'Classe'}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                {t.description && <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
                <p className="text-xs text-muted-foreground/60 mt-2">
                  {new Date(t.created_at).toLocaleDateString('fr-FR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
