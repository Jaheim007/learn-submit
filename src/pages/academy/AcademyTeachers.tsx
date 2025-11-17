import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCheck, Plus, RefreshCw, Copy } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

interface Teacher {
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  assigned_classes: { id: number; code: string; title: string }[];
}

interface Class {
  id: number;
  code: string;
  title: string;
}

export default function AcademyTeachers() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  const generatePassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    setPassword(password);
    setShowPassword(true);
  };

  const copyPassword = async () => {
    await navigator.clipboard.writeText(password);
    toast.success('Mot de passe copié dans le presse-papiers');
  };

  useEffect(() => {
    loadTeachers();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, code, title')
        .eq('is_active', true)
        .order('code');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Erreur lors du chargement des classes');
    }
  };

  const handleClassToggle = (classId: number) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const loadTeachers = async () => {
    try {
      const { data: teacherRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'teacher');

      if (!teacherRoles || teacherRoles.length === 0) {
        setTeachers([]);
        setLoadingTeachers(false);
        return;
      }

      const userIds = teacherRoles.map(r => r.user_id);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, created_at')
        .in('id', userIds)
        .order('created_at', { ascending: false });

      // Get class assignments for each teacher
      const { data: classAssignments } = await supabase
        .from('supervisor_class_assignments')
        .select(`
          supervisor_user_id,
          class:classes(id, code, title)
        `)
        .in('supervisor_user_id', userIds);

      // Group classes by teacher
      const classesMap = new Map<string, any[]>();
      classAssignments?.forEach(assignment => {
        const classes = classesMap.get(assignment.supervisor_user_id) || [];
        if (assignment.class) {
          classes.push(assignment.class);
        }
        classesMap.set(assignment.supervisor_user_id, classes);
      });

      setTeachers((profiles || []).map(p => ({
        user_id: p.id,
        full_name: p.full_name || '',
        email: p.email,
        created_at: p.created_at,
        assigned_classes: classesMap.get(p.id) || [],
      })));
    } catch (error) {
      console.error('Error loading teachers:', error);
      toast.error('Erreur lors du chargement des formateurs');
    } finally {
      setLoadingTeachers(false);
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-supervisor', {
        body: {
          email: email.trim(),
          password,
          full_name: fullName.trim(),
          role: 'teacher',
          class_ids: selectedClasses,
        },
      });

      if (error) {
        console.error('Error creating teacher:', error);
        toast.error(error.message || 'Erreur lors de la création du formateur');
        return;
      }

      if (data?.error) {
        console.error('Server error:', data.error);
        toast.error(data.error);
        return;
      }

      if (!data?.success) {
        toast.error('Erreur lors de la création du formateur');
        return;
      }

      toast.success('Formateur créé avec succès');
      setEmail('');
      setPassword('');
      setFullName('');
      setSelectedClasses([]);
      setShowPassword(false);
      loadTeachers();
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Erreur inattendue lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestion des Formateurs</h1>
          <p className="text-muted-foreground mt-2">
            Créer et gérer les comptes formateurs
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {teachers.length} {teachers.length > 1 ? 'formateurs' : 'formateur'}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Teacher Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              <CardTitle>Créer un formateur</CardTitle>
            </div>
            <CardDescription>
              Ajoutez un nouveau formateur à la plateforme
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeacher} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean.dupont@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe temporaire</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Générer
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 6 caractères"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                  />
                  {password && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8"
                      onClick={copyPassword}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Le formateur pourra changer ce mot de passe après connexion
                </p>
              </div>

              <div className="space-y-2">
                <Label>Classes assignées (optionnel)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {classes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune classe disponible</p>
                  ) : (
                    classes.map(cls => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={selectedClasses.includes(cls.id)}
                          onCheckedChange={() => handleClassToggle(cls.id)}
                          disabled={loading}
                        />
                        <label
                          htmlFor={`class-${cls.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {cls.code} - {cls.title}
                        </label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez les classes que ce formateur pourra gérer
                </p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le formateur'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              <CardTitle>Rôle Formateur</CardTitle>
            </div>
            <CardDescription>
              Informations sur les privilèges formateur
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Accès et permissions</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Gérer les cours de leurs classes assignées</li>
                <li>• Superviser les soumissions d'étudiants</li>
                <li>• Publier du contenu de cours</li>
                <li>• Communiquer avec les étudiants</li>
                <li>• Évaluer les projets</li>
              </ul>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Portail de connexion</h4>
              <p className="text-sm text-muted-foreground">
                Les formateurs se connectent via :
              </p>
              <code className="block mt-2 p-2 bg-muted rounded text-xs">
                /teacher/login
              </code>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Teachers List */}
      <Card>
        <CardHeader>
          <CardTitle>Formateurs existants</CardTitle>
          <CardDescription>Liste de tous les formateurs créés</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTeachers ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun formateur créé
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Classes assignées</TableHead>
                  <TableHead>Créé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers.map((teacher) => (
                  <TableRow key={teacher.user_id}>
                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>
                      {teacher.assigned_classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.assigned_classes.map(cls => (
                            <span key={cls.id} className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                              {cls.code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Aucune</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(teacher.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
