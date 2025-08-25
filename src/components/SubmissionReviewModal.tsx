import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Download, FileText } from 'lucide-react';

interface Submission {
  id: number;
  submitted_at: string;
  description: string | null;
  status: 'Reçu' | 'En révision' | 'Validé' | 'Refusé';
  grade: number | null;
  feedback: string | null;
  link1: string | null;
  link2: string | null;
  link3: string | null;
  file1_url: string | null;
  file2_url: string | null;
  file3_url: string | null;
  students: {
    full_name: string | null;
    email: string | null;
  };
  classes: {
    code: string;
    title: string;
  };
  projects: {
    code: string;
    title: string;
  };
}

interface SubmissionReviewModalProps {
  submission: Submission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (submissionId: number, updates: { status?: string; grade?: number | null; feedback?: string }) => void;
  onDownloadFile: (fileUrl: string, submissionId: number) => void;
}

export function SubmissionReviewModal({ 
  submission, 
  isOpen, 
  onClose, 
  onUpdate, 
  onDownloadFile 
}: SubmissionReviewModalProps) {
  const [status, setStatus] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpen = (open: boolean) => {
    if (open && submission) {
      setStatus(submission.status);
      setGrade(submission.grade?.toString() || '');
      setFeedback(submission.feedback || '');
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!submission) return;

    setIsSaving(true);
    try {
      const updates: any = {};
      
      if (status !== submission.status) {
        updates.status = status;
      }
      
      const gradeNum = grade ? parseFloat(grade) : null;
      if (gradeNum !== submission.grade) {
        updates.grade = gradeNum;
      }
      
      if (feedback !== (submission.feedback || '')) {
        updates.feedback = feedback;
      }

      if (Object.keys(updates).length > 0) {
        await onUpdate(submission.id, updates);
      }
      
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!submission) return null;

  const links = [submission.link1, submission.link2, submission.link3].filter(Boolean);
  const files = [submission.file1_url, submission.file2_url, submission.file3_url].filter(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Révision - {submission.projects.code}: {submission.projects.title}
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{submission.classes.code}</Badge>
            <span>•</span>
            <span>{submission.students.full_name || submission.students.email}</span>
            <span>•</span>
            <span>Soumis le {new Date(submission.submitted_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Content */}
            <div className="space-y-4">
              {/* Description */}
              {submission.description && (
                <div>
                  <Label className="text-sm font-medium">Description du projet</Label>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm">{submission.description}</p>
                  </div>
                </div>
              )}

              {/* Links */}
              {links.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Liens soumis</Label>
                  <div className="mt-2 space-y-2">
                    {links.map((link, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm truncate flex-1"
                        >
                          {link}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {files.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Fichiers soumis</Label>
                  <div className="mt-2 space-y-2">
                    {files.map((fileUrl, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm flex-1 truncate">
                          {fileUrl.split('/').pop()}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadFile(fileUrl, submission.id)}
                          className="h-auto p-1"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Review */}
            <div className="space-y-4">
              {/* Status */}
              <div>
                <Label htmlFor="status" className="text-sm font-medium">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reçu">Reçu</SelectItem>
                    <SelectItem value="En révision">En révision</SelectItem>
                    <SelectItem value="Validé">Validé</SelectItem>
                    <SelectItem value="Refusé">Refusé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Grade */}
              <div>
                <Label htmlFor="grade" className="text-sm font-medium">Note (/20)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  placeholder="Entrez la note"
                  className="mt-2"
                />
              </div>

              {/* Feedback */}
              <div>
                <Label htmlFor="feedback" className="text-sm font-medium">Commentaires</Label>
                <Textarea
                  id="feedback"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Ajoutez vos commentaires sur le projet..."
                  rows={6}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}