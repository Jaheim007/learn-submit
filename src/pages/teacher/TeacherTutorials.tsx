import { useState, useEffect } from 'react';
import * as tus from 'tus-js-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Trash2, Video, Link as LinkIcon, Upload, Play, Calendar, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SUPABASE_URL = 'https://ucgaxcnfvrbhsxxcwceo.supabase.co';

async function resumableUpload(file: File, bucket: string, filePath: string, onProgress: (p: number) => void): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: false,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: filePath,
        contentType: file.type || 'video/mp4',
        cacheControl: '3600',
      },
      chunkSize: 6 * 1024 * 1024,
      onError: (err) => {
        const message = err?.message || '';
        if (message.includes('413') || message.toLowerCase().includes('maximum size exceeded')) {
          reject(new Error('Le serveur a refusé la création de l’upload. Réessayez maintenant que l’envoi se fait bien en morceaux.'));
          return;
        }
        reject(err);
      },
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });

    upload.findPreviousUploads().then((prev) => {
      if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
      upload.start();
    });
  });
}

interface TutorialRow {
  id: string;
  group_id: string;
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

interface TutorialGroup {
  group_id: string;
  title: string;
  description: string | null;
  video_type: string;
  video_url: string | null;
  file_name: string | null;
  file_path: string | null;
  created_at: string;
  classes: { id: number; title: string; code: string }[];
  rows: TutorialRow[];
}

export default function TeacherTutorials() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<TutorialGroup[]>([]);
  const [classes, setClasses] = useState<{ id: number; title: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<TutorialGroup | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [editingGroup, setEditingGroup] = useState<TutorialGroup | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoType, setVideoType] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [tutRes, classRes] = await Promise.all([
      supabase.from('tutorials').select('*, classes(id, title, code)').order('created_at', { ascending: false }),
      supabase.from('classes').select('id, title, code').eq('is_active', true).order('title'),
    ]);
    if (tutRes.data) {
      const rows = tutRes.data as any as TutorialRow[];
      const map = new Map<string, TutorialGroup>();
      for (const r of rows) {
        const g = map.get(r.group_id);
        if (g) {
          if (r.classes) g.classes.push({ id: r.class_id, ...(r.classes as any) });
          g.rows.push(r);
        } else {
          map.set(r.group_id, {
            group_id: r.group_id,
            title: r.title,
            description: r.description,
            video_type: r.video_type,
            video_url: r.video_url,
            file_name: r.file_name,
            file_path: r.file_path,
            created_at: r.created_at,
            classes: r.classes ? [{ id: r.class_id, ...(r.classes as any) }] : [],
            rows: [r],
          });
        }
      }
      setGroups(Array.from(map.values()));
    }
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
    const { data } = await supabase.storage.from('tutorials').createSignedUrl(filePath, 60 * 60 * 24);
    return data?.signedUrl;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setVideoType('url');
    setVideoUrl('');
    setVideoFile(null);
    setSelectedClassIds([]);
    setEditingGroup(null);
  };

  const openEdit = (g: TutorialGroup) => {
    setEditingGroup(g);
    setTitle(g.title);
    setDescription(g.description || '');
    setVideoType(g.video_type as 'url' | 'upload');
    setVideoUrl(g.video_url || '');
    setVideoFile(null);
    setSelectedClassIds(g.classes.map(c => c.id));
    setDialogOpen(true);
  };

  const toggleClass = (id: number) => {
    setSelectedClassIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || selectedClassIds.length === 0) {
      toast.error('Veuillez remplir le titre et sélectionner au moins une classe');
      return;
    }
    if (videoType === 'url' && !videoUrl.trim()) {
      toast.error('Veuillez entrer un lien vidéo');
      return;
    }
    if (!editingGroup && videoType === 'upload' && !videoFile) {
      toast.error('Veuillez sélectionner un fichier vidéo');
      return;
    }

    setSubmitting(true);
    try {
      if (editingGroup) {
        // Update shared fields on all existing rows in group
        const { error: upErr } = await supabase
          .from('tutorials')
          .update({
            title: title.trim(),
            description: description.trim() || null,
            video_url: videoType === 'url' ? videoUrl.trim() : editingGroup.video_url,
          })
          .eq('group_id', editingGroup.group_id);
        if (upErr) throw upErr;

        const existingIds = editingGroup.classes.map(c => c.id);
        const toAdd = selectedClassIds.filter(id => !existingIds.includes(id));
        const toRemove = existingIds.filter(id => !selectedClassIds.includes(id));

        if (toRemove.length) {
          const { error } = await supabase
            .from('tutorials')
            .delete()
            .eq('group_id', editingGroup.group_id)
            .in('class_id', toRemove);
          if (error) throw error;
        }

        if (toAdd.length) {
          const inserts = toAdd.map(class_id => ({
            title: title.trim(),
            description: description.trim() || null,
            video_type: editingGroup.video_type,
            video_url: videoType === 'url' ? videoUrl.trim() : editingGroup.video_url,
            file_name: editingGroup.file_name,
            file_path: editingGroup.file_path,
            class_id,
            group_id: editingGroup.group_id,
            created_by: user!.id,
          }));
          const { error } = await supabase.from('tutorials').insert(inserts);
          if (error) throw error;
        }

        toast.success('Tutoriel mis à jour');
      } else {
        let filePath: string | null = null;
        let fileName: string | null = null;

        if (videoType === 'upload' && videoFile) {
          fileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          filePath = `${selectedClassIds[0]}/${Date.now()}_${fileName}`;
          setUploadProgress(0);
          await resumableUpload(videoFile, 'tutorials', filePath, setUploadProgress);
        }

        const group_id = crypto.randomUUID();
        const inserts = selectedClassIds.map(class_id => ({
          title: title.trim(),
          description: description.trim() || null,
          video_type: videoType,
          video_url: videoType === 'url' ? videoUrl.trim() : null,
          file_name: fileName,
          file_path: filePath,
          class_id,
          group_id,
          created_by: user!.id,
        }));
        const { error } = await supabase.from('tutorials').insert(inserts);
        if (error) throw error;
        toast.success('Tutoriel ajouté avec succès');
      }

      resetForm();
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (g: TutorialGroup) => {
    if (!confirm('Supprimer ce tutoriel de toutes les classes ?')) return;
    if (g.file_path) {
      await supabase.storage.from('tutorials').remove([g.file_path]);
    }
    const { error } = await supabase.from('tutorials').delete().eq('group_id', g.group_id);
    if (error) {
      toast.error('Erreur lors de la suppression');
    } else {
      toast.success('Tutoriel supprimé');
      fetchData();
    }
  };

  const handlePlay = async (g: TutorialGroup) => {
    if (g.video_type === 'upload' && g.file_path) {
      const url = await getSignedUrl(g.file_path);
      if (url) setPlayingVideo({ ...g, video_url: url });
    } else {
      setPlayingVideo(g);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des Tutoriels</h1>
          <p className="text-sm text-muted-foreground">{groups.length} tutoriel{groups.length !== 1 ? 's' : ''} disponible{groups.length !== 1 ? 's' : ''} pour vos groupes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Nouveau tutoriel
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingGroup ? 'Modifier le tutoriel' : 'Nouveau tutoriel'}</DialogTitle>
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
                <Label>Classes * ({selectedClassIds.length} sélectionnée{selectedClassIds.length !== 1 ? 's' : ''})</Label>
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto rounded-lg border border-border/50 p-3">
                  {classes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-colors">
                      <Checkbox
                        checked={selectedClassIds.includes(c.id)}
                        onCheckedChange={() => toggleClass(c.id)}
                      />
                      <span className="text-sm">{c.title} <span className="text-muted-foreground">({c.code})</span></span>
                    </label>
                  ))}
                </div>
              </div>
              {!editingGroup && (
                <div>
                  <Label>Type de vidéo</Label>
                  <div className="flex gap-2 mt-1">
                    <Button type="button" size="sm" variant={videoType === 'url' ? 'default' : 'outline'} onClick={() => setVideoType('url')}>
                      <LinkIcon className="h-4 w-4 mr-1" /> Lien
                    </Button>
                    <Button type="button" size="sm" variant={videoType === 'upload' ? 'default' : 'outline'} onClick={() => setVideoType('upload')}>
                      <Upload className="h-4 w-4 mr-1" /> Upload
                    </Button>
                  </div>
                </div>
              )}
              {videoType === 'url' ? (
                <div>
                  <Label>URL de la vidéo *</Label>
                  <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                </div>
              ) : !editingGroup ? (
                <div>
                  <Label>Fichier vidéo *</Label>
                  <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-muted-foreground mt-1">Aucune limite de taille — tous formats vidéo acceptés</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Fichier vidéo : {editingGroup.file_name} (non modifiable)</p>
              )}
              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? (uploadProgress > 0 ? `Upload ${uploadProgress}%...` : 'Enregistrement...') : (editingGroup ? 'Mettre à jour' : 'Ajouter le tutoriel')}
              </Button>
              {submitting && uploadProgress > 0 && (
                <Progress value={uploadProgress} className="mt-2" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : groups.length === 0 ? (
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
            {groups.map(g => {
              const thumbnail = g.video_type === 'url' && g.video_url ? getYoutubeThumbnail(g.video_url) : null;

              return (
                <Card
                  key={g.group_id}
                  className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer border-border/50"
                  onClick={() => handlePlay(g)}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-muted overflow-hidden">
                      {thumbnail ? (
                        <img src={thumbnail} alt={g.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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

                    <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-foreground leading-tight line-clamp-2">{g.title}</h3>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); openEdit(g); }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); handleDelete(g); }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {g.classes.map(c => (
                            <Badge key={c.id} variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                              {c.title}
                            </Badge>
                          ))}
                        </div>
                        {g.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{g.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground/60">
                        {g.file_name && (
                          <>
                            <Upload className="h-3 w-3" />
                            <span className="truncate max-w-[140px]">{g.file_name}</span>
                          </>
                        )}
                        <Calendar className="h-3 w-3 ml-auto" />
                        <span>{new Date(g.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

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
              <video
                src={playingVideo.video_url}
                controls
                playsInline
                preload="metadata"
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
