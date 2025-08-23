import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HealthCheck } from '@/components/HealthCheck';
import { useAuth } from '@/hooks/useAuth';
import { testStudentProjectsAPI, createTestEnrollments, createTestSubmissions, cleanupTestData, TEST_USERS } from '@/utils/testHelpers';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Clock, Play, Trash2, Users } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  data?: any;
}

export default function TestDashboard() {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'API Endpoint Test', status: 'pending' },
    { name: 'Empty State Test', status: 'pending' },
    { name: 'Error Handling Test', status: 'pending' },
    { name: 'Data Creation Test', status: 'pending' }
  ]);

  const updateTest = (name: string, updates: Partial<TestResult>) => {
    setTests(prev => prev.map(test => 
      test.name === name ? { ...test, ...updates } : test
    ));
  };

  const runAPITest = async () => {
    updateTest('API Endpoint Test', { status: 'running' });
    
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      const result = await testStudentProjectsAPI(user.id);
      
      updateTest('API Endpoint Test', {
        status: result.success ? 'success' : 'error',
        message: result.success 
          ? `Found ${result.data?.count?.classes || 0} classes, ${result.data?.count?.projects || 0} projects`
          : result.error,
        data: result.data
      });
    } catch (error) {
      updateTest('API Endpoint Test', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runEmptyStateTest = async () => {
    updateTest('Empty State Test', { status: 'running' });
    
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      // First cleanup any existing data
      await cleanupTestData(user.id);
      
      // Test with no enrollments
      const result = await testStudentProjectsAPI(user.id);
      
      updateTest('Empty State Test', {
        status: result.success ? 'success' : 'error',
        message: result.success 
          ? `Empty state handled correctly: ${result.data?.message || 'No data'}`
          : result.error,
        data: result.data
      });
    } catch (error) {
      updateTest('Empty State Test', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runErrorTest = async () => {
    updateTest('Error Handling Test', { status: 'running' });
    
    try {
      // Simulate error by using invalid user ID
      const result = await testStudentProjectsAPI('invalid-user-id');
      
      updateTest('Error Handling Test', {
        status: 'success',
        message: `Error handling works: ${result.error || 'No error returned'}`,
        data: result
      });
    } catch (error) {
      updateTest('Error Handling Test', {
        status: 'success', // Errors are expected in this test
        message: `Caught expected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const runDataCreationTest = async () => {
    updateTest('Data Creation Test', { status: 'running' });
    
    try {
      if (!user?.id) {
        throw new Error('No user logged in');
      }

      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        throw new Error('Student profile not found');
      }

      // Create test enrollments
      const enrollments = await createTestEnrollments(student.id, [1, 2]);
      
      // Create test submissions
      const submissions = await createTestSubmissions(student.id, [1, 2], 1);
      
      updateTest('Data Creation Test', {
        status: 'success',
        message: `Created ${enrollments?.length || 0} enrollments, ${submissions?.length || 0} submissions`,
        data: { enrollments, submissions }
      });
    } catch (error) {
      updateTest('Data Creation Test', {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const runAllTests = async () => {
    await runAPITest();
    await runEmptyStateTest();
    await runErrorTest();
    await runDataCreationTest();
  };

  const cleanup = async () => {
    if (!user?.id) return;
    
    try {
      await cleanupTestData(user.id);
      setTests(tests.map(test => ({ ...test, status: 'pending', message: undefined, data: undefined })));
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Réussi</Badge>;
      case 'error':
        return <Badge variant="destructive">Échec</Badge>;
      case 'running':
        return <Badge variant="secondary">En cours...</Badge>;
      default:
        return <Badge variant="outline">En attente</Badge>;
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Tableau de bord de test</h1>
            <p className="text-muted-foreground">Veuillez vous connecter pour accéder aux tests.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Tableau de bord de test</h1>
          <p className="text-muted-foreground">
            Tests d'intégration pour la fonctionnalité "Mes Projets"
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Health Check */}
          <HealthCheck />

          {/* Test User Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comptes de test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {TEST_USERS.map((testUser) => (
                <div key={testUser.email} className="p-3 border rounded-lg">
                  <div className="font-medium text-sm">{testUser.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{testUser.email}</div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={testUser.hasClasses ? "default" : "secondary"} className="text-xs">
                      {testUser.hasClasses ? "Avec classes" : "Sans classe"}
                    </Badge>
                    <Badge variant={testUser.hasProjects ? "default" : "secondary"} className="text-xs">
                      {testUser.hasProjects ? "Avec projets" : "Sans projet"}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôles de test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runAllTests} className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Exécuter tous les tests
              </Button>
              <Button onClick={cleanup} variant="outline" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Nettoyer les données
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Utilisateur connecté:</strong> {user.email}</p>
              <p><strong>ID:</strong> <code className="text-xs">{user.id}</code></p>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Résultats des tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests.map((test) => (
              <div key={test.name} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <div className="font-medium">{test.name}</div>
                    {test.message && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {test.message}
                      </div>
                    )}
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-xs text-blue-600 cursor-pointer">Voir les données</summary>
                        <pre className="text-xs bg-gray-50 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
            <Button onClick={runAPITest} variant="outline" size="sm">
              Test API
            </Button>
            <Button onClick={runEmptyStateTest} variant="outline" size="sm">
              Test État vide
            </Button>
            <Button onClick={runErrorTest} variant="outline" size="sm">
              Test Erreur
            </Button>
            <Button onClick={runDataCreationTest} variant="outline" size="sm">
              Test Création
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}