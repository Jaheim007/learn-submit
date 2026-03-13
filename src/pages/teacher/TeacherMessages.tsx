import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function TeacherMessages() {
  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground mt-1">Communiquez avec vos étudiants</p>
      </div>

      <Card>
        <CardContent className="py-16 text-center">
          <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Messagerie à venir</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Le système de messagerie intégré sera bientôt disponible. 
            Vous pourrez communiquer directement avec vos étudiants depuis cette interface.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
