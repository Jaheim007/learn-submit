import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MessageCircle, Github, BookOpen, FileText, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface StudentProfileData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  github_profile: string | null;
  avatar_url: string | null;
  classes: { code: string; title: string }[];
  submissions_count?: number;
  created_at?: string;
  is_active?: boolean;
}

interface StudentProfileModalProps {
  student: StudentProfileData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProfileModal({ student, open, onOpenChange }: StudentProfileModalProps) {
  if (!student) return null;

  const infoItems = [
    { icon: User, label: 'Nom complet', value: student.full_name },
    { icon: Mail, label: 'Email', value: student.email, link: `mailto:${student.email}` },
    { icon: Phone, label: 'Téléphone', value: student.phone },
    { icon: MessageCircle, label: 'WhatsApp', value: student.whatsapp },
    { icon: MessageCircle, label: 'Telegram', value: student.telegram },
    {
      icon: Github,
      label: 'GitHub',
      value: student.github_profile,
      link: student.github_profile || undefined,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-6 pt-6 pb-12">
          <DialogHeader>
            <DialogTitle className="text-white/80 text-sm font-normal">Profil de l'étudiant</DialogTitle>
          </DialogHeader>
        </div>

        {/* Avatar overlap */}
        <div className="px-6 -mt-8 relative z-10">
          <div className="flex items-end gap-4">
            <div className="ring-4 ring-background rounded-full">
              <ProfileAvatar
                avatarUrl={student.avatar_url}
                fullName={student.full_name}
                size="xl"
              />
            </div>
            <div className="pb-1 min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground truncate">{student.email}</p>
            </div>
            {student.is_active !== undefined && (
              <Badge variant={student.is_active ? 'default' : 'secondary'} className="mb-1">
                {student.is_active ? 'Actif' : 'Inactif'}
              </Badge>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 space-y-5 mt-4">
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <BookOpen className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{student.classes.length}</p>
              <p className="text-[10px] text-muted-foreground">Classes</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <FileText className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{student.submissions_count ?? '—'}</p>
              <p className="text-[10px] text-muted-foreground">Soumissions</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-bold text-foreground">
                {student.created_at
                  ? new Date(student.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                  : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Inscription</p>
            </div>
          </div>

          {/* Classes */}
          {student.classes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Classes</h3>
              <div className="flex flex-wrap gap-1.5">
                {student.classes.map((cls, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {cls.code} — {cls.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Contact info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations de contact</h3>
            <div className="grid grid-cols-2 gap-3">
              {infoItems.map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5" />
                    <span className="text-[11px]">{item.label}</span>
                  </div>
                  {item.value ? (
                    item.link ? (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline block truncate"
                      >
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-foreground truncate">{item.value}</p>
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground/60 italic">Non renseigné</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
