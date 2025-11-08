import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const BackupSettings = () => {
  const [password, setPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleExport = async () => {
    if (!password || password.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    setIsExporting(true);
    try {
      // Exportar dados de todas as tabelas principais
      const tables: string[] = [
        'profiles',
        'projects',
        'project_contributions',
        'project_comments',
        'project_gallery',
        'user_tokens',
        'token_transactions',
        'token_purchases',
        'badges',
        'user_badges',
        'notifications',
        'refunds'
      ];

      const backupData: any = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        tables: {}
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table as any).select('*');
        if (error) throw error;
        backupData.tables[table] = data;
      }

      // Converter para JSON e criptografar (simples, para produção usar crypto adequado)
      const jsonData = JSON.stringify(backupData);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raiztoken-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Backup exportado com sucesso!');
      setPassword('');
    } catch (error) {
      console.error('Erro ao exportar backup:', error);
      toast.error('Erro ao exportar backup');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      setShowRestoreDialog(true);
    }
  };

  const handleRestore = async () => {
    if (!password || password.length < 8) {
      toast.error('Senha deve ter no mínimo 8 caracteres');
      return;
    }

    if (!restoreFile) {
      toast.error('Selecione um arquivo de backup');
      return;
    }

    setIsRestoring(true);
    try {
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      if (!backupData.version || !backupData.tables) {
        throw new Error('Formato de backup inválido');
      }

      toast.warning('Restauração de backup não implementada por segurança. Entre em contato com o suporte técnico.');
      
      setShowRestoreDialog(false);
      setRestoreFile(null);
      setPassword('');
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast.error('Erro ao restaurar backup');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Backup</CardTitle>
          <CardDescription>
            Exporte e restaure dados completos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exportar Backup */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Backup
            </h3>
            <div className="space-y-2">
              <Label htmlFor="export-password">Senha de Segurança</Label>
              <Input
                id="export-password"
                type="password"
                placeholder="Digite uma senha (mínimo 8 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
              />
            </div>
            <Button 
              onClick={handleExport} 
              disabled={isExporting || !password}
              className="w-full"
            >
              {isExporting ? 'Exportando...' : 'Exportar Backup Completo'}
            </Button>
          </div>

          {/* Restaurar Backup */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Restaurar Backup</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ ATENÇÃO: Esta operação irá sobrescrever todos os dados atuais. Use com extrema cautela.
            </p>
            <div className="space-y-2">
              <Label htmlFor="backup-file">Arquivo de Backup</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Esta ação irá SUBSTITUIR TODOS OS DADOS ATUAIS pelo backup selecionado.</p>
              <p className="font-semibold text-destructive">Esta operação NÃO PODE SER DESFEITA!</p>
              <div className="mt-4">
                <Label htmlFor="restore-password">Digite a senha de segurança para confirmar</Label>
                <Input
                  id="restore-password"
                  type="password"
                  placeholder="Senha (mínimo 8 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPassword('');
              setRestoreFile(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestore}
              disabled={isRestoring || !password}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRestoring ? 'Restaurando...' : 'Restaurar Backup'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BackupSettings;
