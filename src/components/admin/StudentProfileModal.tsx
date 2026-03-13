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
      <DialogContent className="max-w-md w-[95vw] p-0 overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header with gradient — compact */}
        <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] px-5 pt-5 pb-10 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-white/80 text-sm font-normal">Profil de l'étudiant</DialogTitle>
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 -mt-6">
          {/* Avatar overlap */}
          <div className="px-5 relative z-10">
            <div className="flex items-end gap-3">
              <div className="ring-3 ring-background rounded-full shrink-0">
                <ProfileAvatar
                  avatarUrl={student.avatar_url}
                  fullName={student.full_name}
                  size="lg"
                />
              </div>
              <div className="pb-1 min-w-0 flex-1">
                <h2 className="text-base font-bold text-foreground truncate leading-tight">{student.full_name}</h2>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{student.email}</p>
              </div>
              {student.is_active !== undefined && (
                <Badge variant={student.is_active ? 'default' : 'secondary'} className="mb-1 text-[10px] shrink-0">
                  {student.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              )}
            </div>
          </div>

          <div className="px-5 pb-5 space-y-4 mt-4">
            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center py-2.5 px-2 rounded-lg bg-muted/50">
                <BookOpen className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="text-base font-bold text-foreground leading-tight">{student.classes.length}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Classes</p>
              </div>
              <div className="text-center py-2.5 px-2 rounded-lg bg-muted/50">
                <FileText className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="text-base font-bold text-foreground leading-tight">{student.submissions_count ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Soumissions</p>
              </div>
              <div className="text-center py-2.5 px-2 rounded-lg bg-muted/50">
                <Calendar className="h-3.5 w-3.5 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs font-bold text-foreground leading-tight">
                  {student.created_at
                    ? new Date(student.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
                    : '—'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Inscription</p>
              </div>
            </div>

            {/* Classes */}
            {student.classes.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Classes</h3>
                <div className="flex flex-wrap gap-1.5">
                  {student.classes.map((cls, idx) => (
                    <Badge key={idx} variant="outline" className="text-[11px] font-normal">
                      {cls.code} — {cls.title}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Contact info */}
            <div>
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Informations de contact</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {infoItems.map((item) => (
                  <div key={item.label} className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <item.icon className="h-3 w-3 shrink-0" />
                      <span className="text-[10px]">{item.label}</span>
                    </div>
                    {item.value ? (
                      item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-primary hover:underline block truncate"
                        >
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-xs font-medium text-foreground truncate">{item.value}</p>
                      )
                    ) : (
                      <p className="text-xs text-muted-foreground/50 italic">Non renseigné</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
