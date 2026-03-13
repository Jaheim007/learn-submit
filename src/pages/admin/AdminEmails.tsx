import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Send, Users, Mail, Zap, Loader2, CheckCircle, X, History } from 'lucide-react';
import EmailLogsPanel from '@/components/admin/EmailLogsPanel';

interface ClassOption {
  id: number;
  title: string;
  code: string;
}

interface StudentOption {
  id: string;
  email: string;
  full_name: string;
}

export default function AdminEmails() {
  const [mode, setMode] = useState<'individual' | 'class' | 'broadcast'>('individual');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
    loadClasses();
    loadStudents();
  }, []);

  const loadClasses = async () => {
    const { data } = await supabase.from('classes').select('id, title, code').eq('is_active', true).order('title');
    if (data) setClasses(data);
  };

  const loadStudents = async () => {
    const { data } = await supabase.from('students').select('id, email, full_name').eq('is_active', true).eq('status', 'active').order('full_name');
    if (data) setStudents(data);
  };

  const addEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && !selectedEmails.includes(trimmed) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setSelectedEmails(prev => [...prev, trimmed]);
      setEmailInput('');
    }
  };

  const removeEmail = (email: string) => {
    setSelectedEmails(prev => prev.filter(e => e !== email));
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error('Veuillez remplir le sujet et le contenu');
      return;
    }

    if (mode === 'individual' && selectedEmails.length === 0) {
      toast.error('Veuillez ajouter au moins un destinataire');
      return;
    }

    if (mode === 'class' && !selectedClass) {
      toast.error('Veuillez sélectionner une classe');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      // Wrap body in styled HTML
      const htmlBody = `
        <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: linear-gradient(135deg, #1a2744, #c7253e); padding: 24px; text-align: center;">
            <h1 style="color: white; font-size: 20px; margin: 0;">Kelya Group × Hacktualiz</h1>
          </div>
          <div style="padding: 24px;">
            ${body.replace(/\n/g, '<br/>')}
          </div>
          <div style="padding: 16px; text-align: center; color: #888; font-size: 12px; border-top: 1px solid #eee;">
            <p>Kelya Group × Hacktualiz INC — Plateforme d'apprentissage</p>
          </div>
        </div>`;

      const payload: Record<string, any> = {
        mode,
        subject,
        html_body: htmlBody,
      };

      if (mode === 'individual') payload.to = selectedEmails;
      if (mode === 'class') payload.class_id = parseInt(selectedClass);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: payload,
      });

      if (error) throw error;

      setLastResult({ sent: data.sent, total: data.total });
      toast.success(`${data.sent} email(s) envoyé(s) sur ${data.total}`);

      // Reset form
      setSubject('');
      setBody('');
      setSelectedEmails([]);
      setSelectedClass('');
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-foreground">Emails</h1>
        <p className="text-muted-foreground">Envoyer des emails aux étudiants et gérer les automatisations</p>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compose" className="gap-2">
            <Mail className="h-4 w-4" />
            Composer
          </TabsTrigger>
          <TabsTrigger value="automations" className="gap-2">
            <Zap className="h-4 w-4" />
            Automatisations
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <History className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compose Form */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Composer un email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Mode selector */}
                  <div className="flex gap-2">
                    <Button
                      variant={mode === 'individual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('individual')}
                    >
                      <Mail className="h-4 w-4 mr-1" />
                      Individuel
                    </Button>
                    <Button
                      variant={mode === 'class' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('class')}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Classe
                    </Button>
                    <Button
                      variant={mode === 'broadcast' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMode('broadcast')}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Tous les étudiants
                    </Button>
                  </div>

                  {/* Recipients */}
                  {mode === 'individual' && (
                    <div className="space-y-2">
                      <Label>Destinataires</Label>
                      <div className="flex gap-2">
                        <Select onValueChange={(val) => addEmail(val)}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Sélectionner un étudiant..." />
                          </SelectTrigger>
                          <SelectContent>
                            {students.map(s => (
                              <SelectItem key={s.id} value={s.email}>
                                {s.full_name} ({s.email})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="ou tapez un email..."
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addEmail(emailInput);
                            }
                          }}
                          className="flex-1"
                        />
                      </div>
                      {selectedEmails.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedEmails.map(email => (
                            <Badge key={email} variant="secondary" className="gap-1">
                              {email}
                              <X className="h-3 w-3 cursor-pointer" onClick={() => removeEmail(email)} />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {mode === 'class' && (
                    <div className="space-y-2">
                      <Label>Classe</Label>
                      <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une classe..." />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map(c => (
                            <SelectItem key={c.id} value={c.id.toString()}>
                              {c.title} ({c.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {mode === 'broadcast' && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                      ⚠️ Cet email sera envoyé à <strong>tous les étudiants actifs</strong> de la plateforme.
                    </div>
                  )}

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label>Sujet</Label>
                    <Input
                      placeholder="Sujet de l'email..."
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  {/* Body */}
                  <div className="space-y-2">
                    <Label>Contenu</Label>
                    <Textarea
                      placeholder="Contenu de l'email (le formatage HTML de base sera appliqué automatiquement)..."
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={10}
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={handleSend}
                    disabled={sending}
                    className="w-full"
                    size="lg"
                  >
                    {sending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Envoi en cours...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" /> Envoyer</>
                    )}
                  </Button>

                  {lastResult && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      {lastResult.sent} email(s) envoyé(s) sur {lastResult.total}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Preview */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Aperçu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden text-xs">
                    <div className="bg-gradient-to-r from-[#1a2744] to-[#c7253e] p-3 text-center">
                      <span className="text-white font-bold text-sm">Kelya Group × Hacktualiz</span>
                    </div>
                    <div className="p-3 bg-white text-gray-800">
                      <p className="font-semibold mb-1">{subject || 'Sujet...'}</p>
                      <p className="text-gray-600 whitespace-pre-wrap">{body || 'Contenu...'}</p>
                    </div>
                    <div className="p-2 text-center text-[10px] text-gray-400 border-t">
                      Kelya Group × Hacktualiz INC
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="automations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AutomationCard
              title="Nouveau cours ajouté"
              description="Email automatique quand un nouveau contenu est ajouté à une classe"
              icon="📚"
              enabled={true}
            />
            <AutomationCard
              title="Nouveau projet assigné"
              description="Email automatique quand un nouveau projet est assigné à une classe"
              icon="🎯"
              enabled={true}
            />
            <AutomationCard
              title="Rappel d'échéance (48h)"
              description="Email de rappel automatique 48h avant la date limite d'un projet"
              icon="⏰"
              enabled={true}
            />
          </div>

          <Card className="mt-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">Comment fonctionnent les automatisations</h3>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• <strong>Nouveau cours/projet :</strong> L'email est envoyé automatiquement lors de la création du contenu</li>
                    <li>• <strong>Rappel d'échéance :</strong> Un job vérifie toutes les heures les projets expirant dans les 48h</li>
                    <li>• Les étudiants reçoivent aussi une notification push dans l'application</li>
                    <li>• Seuls les étudiants n'ayant pas encore soumis reçoivent le rappel d'échéance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AutomationCard({ title, description, icon, enabled }: {
  title: string;
  description: string;
  icon: string;
  enabled: boolean;
}) {
  const [isEnabled, setIsEnabled] = useState(enabled);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>
        <Badge variant={isEnabled ? 'default' : 'secondary'} className="mt-3">
          {isEnabled ? 'Actif' : 'Inactif'}
        </Badge>
      </CardContent>
    </Card>
  );
}
