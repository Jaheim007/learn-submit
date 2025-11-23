import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, Copy } from 'lucide-react';

interface InviteStudentDialogProps {
  organizationId: string;
  organizationSlug: string;
  onInviteSent?: () => void;
}

interface Class {
  id: string;
  name: string;
  code: string;
}

export function InviteStudentDialog({ organizationId, organizationSlug, onInviteSent }: InviteStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [registrationUrl, setRegistrationUrl] = useState<string>('');

  useEffect(() => {
    if (open && organizationId) {
      loadClasses();
    }
  }, [open, organizationId]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('submito_organization_classes')
        .select('id, name, code')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleInvite = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!fullName.trim()) {
      toast.error('Please enter student full name');
      return;
    }

    if (selectedClassIds.length === 0) {
      toast.error('Please select at least one class for the student');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be signed in to invite students');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-student-magic-link', {
        body: {
          email: email.toLowerCase(),
          full_name: fullName.trim(),
          organization_id: organizationId,
          organization_slug: organizationSlug,
          class_ids: selectedClassIds
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast.success(`Magic link sent to ${email}! The student will receive an email to set up their account.`);

      setEmail('');
      setFullName('');
      setSelectedClassIds([]);
      setOpen(false);
      
      onInviteSent?.();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEmail('');
    setFullName('');
    setSelectedClassIds([]);
  };

  const toggleClassSelection = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle>Invite Student</DialogTitle>
          <DialogDescription>
            Send a magic link invitation to a new student
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="student-name">Full Name</Label>
            <Input
              id="student-name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="student-email">Email Address</Label>
            <Input
              id="student-email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Assign to Classes *</Label>
            <div className="border border-border rounded-md p-3 max-h-40 overflow-y-auto bg-background">
              {classes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No active classes available. Create a class first.
                </p>
              ) : (
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <label
                      key={cls.id}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-accent/50 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClassIds.includes(cls.id)}
                        onChange={() => toggleClassSelection(cls.id)}
                        disabled={loading}
                        className="w-4 h-4 rounded border-border"
                      />
                      <span className="text-sm">
                        {cls.name} ({cls.code})
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select one or more classes to assign the student to
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={loading || !email || !fullName || selectedClassIds.length === 0}
              className="flex-1 gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send Invitation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
