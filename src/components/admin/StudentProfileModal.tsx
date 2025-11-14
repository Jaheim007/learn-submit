import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, MessageCircle, Github, BookOpen } from 'lucide-react';

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
}

interface StudentProfileModalProps {
  student: StudentProfileData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StudentProfileModal({ student, open, onOpenChange }: StudentProfileModalProps) {
  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil de l'étudiant</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with Avatar */}
          <div className="relative h-40 rounded-xl overflow-hidden bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30">
            <div className="absolute inset-0 flex items-end p-6">
              <div className="flex items-end gap-4">
                <ProfileAvatar 
                  avatarUrl={student.avatar_url} 
                  fullName={student.full_name} 
                  size="xl"
                />
                <div className="mb-2">
                  <h2 className="text-2xl font-bold text-white">{student.full_name}</h2>
                  <p className="text-white/80">{student.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          {student.classes.length > 0 && (
            <div className="premium-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Mes Classes</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {student.classes.map((cls, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {cls.code} - {cls.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Personal Information */}
          <div className="premium-card p-6">
            <h3 className="text-lg font-bold mb-4">Informations Personnelles</h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Nom complet</span>
                </div>
                <p className="font-medium">{student.full_name}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </div>
                <p className="font-medium">{student.email}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span>Téléphone</span>
                </div>
                <p className="font-medium">{student.phone || 'Non renseigné'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </div>
                <p className="font-medium">{student.whatsapp || 'Non renseigné'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>Telegram</span>
                </div>
                <p className="font-medium">{student.telegram || 'Non renseigné'}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Github className="h-4 w-4" />
                  <span>GitHub</span>
                </div>
                {student.github_profile ? (
                  <a 
                    href={student.github_profile} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {student.github_profile}
                  </a>
                ) : (
                  <p className="font-medium">Non renseigné</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
