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
  const [classId, setClassId] = useState<string>('');
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

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be signed in to invite students');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-student-invitation', {
        body: {
          email: email.toLowerCase(),
          full_name: fullName.trim(),
          organization_id: organizationId,
          organization_slug: organizationSlug,
          class_id: classId || null
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      if (data.registration_url) {
        setRegistrationUrl(data.registration_url);
        // Copy to clipboard
        navigator.clipboard.writeText(data.registration_url);
        toast.success('Invitation created! Registration URL copied to clipboard.');
      } else {
        toast.success(`Invitation sent to ${email}`);
        setEmail('');
        setFullName('');
        setClassId('');
        setOpen(false);
      }
      
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
    setClassId('');
    setRegistrationUrl('');
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast.success('URL copied to clipboard');
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Student</DialogTitle>
          <DialogDescription>
            Create a student invitation and get a registration link
          </DialogDescription>
        </DialogHeader>

        {registrationUrl ? (
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label>Registration URL</Label>
              <p className="text-sm text-muted-foreground">Share this URL with the student to complete registration:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={registrationUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUrl}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
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
              <Label htmlFor="class">Assign to Class (Optional)</Label>
              <Select value={classId} onValueChange={setClassId} disabled={loading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No class assigned</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {classes.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No active classes available. Create a class first.
                </p>
              )}
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
                disabled={loading || !email || !fullName}
                className="flex-1 gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Invitation
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
