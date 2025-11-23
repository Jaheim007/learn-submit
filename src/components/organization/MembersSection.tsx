import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InviteMemberDialog } from './InviteMemberDialog';
import { Users, Mail, MoreVertical, Crown, Shield, GraduationCap, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface Member {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_owner: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

interface MembersSectionProps {
  organizationId: string;
  showOnlyStaff?: boolean; // If true, only show staff members (exclude students)
}

const getRoleIcon = (role: string, isOwner: boolean) => {
  if (isOwner) return <Crown className="w-4 h-4 text-yellow-500" />;
  if (role === 'admin') return <Shield className="w-4 h-4 text-blue-500" />;
  if (role === 'academy') return <GraduationCap className="w-4 h-4 text-purple-500" />;
  if (role === 'teacher') return <User className="w-4 h-4 text-green-500" />;
  return <User className="w-4 h-4 text-gray-500" />;
};

const getRoleLabel = (role: string, isOwner: boolean) => {
  if (isOwner) return 'Owner';
  if (role === 'admin') return 'Administrator';
  if (role === 'academy') return 'Academy Staff';
  if (role === 'teacher') return 'Teacher';
  return 'Member';
};

export function MembersSection({ organizationId, showOnlyStaff = false }: MembersSectionProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('submito_organization_users')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load pending invitations
      let invitesQuery = supabase
        .from('submito_organization_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      // Filter by role if showOnlyStaff is true (exclude student invitations)
      if (showOnlyStaff) {
        invitesQuery = invitesQuery.neq('role', 'student');
      }

      const { data: invitesData, error: invitesError } = await invitesQuery;

      if (invitesError) throw invitesError;
      setInvitations(invitesData || []);
    } catch (error: any) {
      console.error('Error loading members:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvitation = async (invitationId: string, email: string) => {
    try {
      const invitation = invitations.find(inv => inv.id === invitationId);
      if (!invitation) {
        toast.error('Invitation not found');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      toast.info(`Resending invitation to ${email}...`);

      const { error } = await supabase.functions.invoke('send-organization-invitation', {
        body: {
          email: invitation.email,
          role: invitation.role,
          organization_id: organizationId,
        },
      });

      if (error) throw error;

      toast.success('Invitation resent successfully');
      loadData();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to delete this invitation? The invitation link will no longer work.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('submito_organization_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      
      toast.success('Invitation deleted successfully');
      loadData();
    } catch (error: any) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      const { error } = await supabase
        .from('submito_organization_users')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast.success(`${memberName} removed from organization`);
      loadData();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage your organization's team members and their roles
              </CardDescription>
            </div>
            <InviteMemberDialog organizationId={organizationId} onInviteSent={loadData} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading members...</div>
          ) : (
            <>
              {members.map((member) => {
                const isCurrentUser = member.user_id === currentUserId;
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="" alt={member.full_name || member.email} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {(member.full_name || member.email).charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {member.full_name || member.email}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                            )}
                          </p>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            {getRoleIcon(member.role, member.is_owner)}
                            {getRoleLabel(member.role, member.is_owner)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    {!member.is_owner && !isCurrentUser && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                          >
                            Remove from organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </CardContent>
      </Card>

      {invitations.length > 0 && (
        <Card className="bg-card/40 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Pending Invitations
            </CardTitle>
            <CardDescription>
              Invitations sent to team members awaiting acceptance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-muted">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invitation.email}</p>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getRoleIcon(invitation.role, false)}
                        {getRoleLabel(invitation.role, false)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invited {new Date(invitation.created_at).toLocaleDateString()} • 
                      Expires {new Date(invitation.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleResendInvitation(invitation.id, invitation.email)}
                  >
                    Resend
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleCancelInvitation(invitation.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
