import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  fullName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
  xl: 'h-32 w-32'
};

export const ProfileAvatar = ({ avatarUrl, fullName, size = 'md' }: ProfileAvatarProps) => {
  const initials = fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <Avatar className={`${sizeClasses[size]} border-2 border-primary/20`}>
      <AvatarImage src={avatarUrl || undefined} alt={fullName || 'Profile'} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
};
