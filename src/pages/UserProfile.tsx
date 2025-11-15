
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { User, Camera, MapPin, Coins, Lock, AlertCircle } from 'lucide-react';
import TokenPurchase from '@/components/TokenPurchase';
import Footer from '@/components/Footer';
import { validateCPF, formatCPF } from '@/lib/cpfValidator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProfileFormData {
  nome: string;
  sobrenome: string;
  email: string;
  celular: string;
  cpf: string;
  data_nascimento: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [profile, setProfile] = useState<any>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isCpfLocked, setIsCpfLocked] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProfileFormData>();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setIsCpfLocked(!!data.cpf); // CPF travado se já existe
        setValue('nome', data.nome || '');
        setValue('sobrenome', data.sobrenome || '');
        setValue('email', data.email || '');
        setValue('celular', data.celular || '');
        setValue('cpf', data.cpf || '');
        setValue('data_nascimento', data.data_nascimento || '');
        setValue('endereco', data.endereco || '');
        setValue('numero', data.numero || '');
        setValue('complemento', data.complemento || '');
        setValue('bairro', data.bairro || '');
        setValue('cidade', data.cidade || '');
        setValue('estado', data.estado || '');
        setValue('cep', data.cep || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar perfil.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      setAvatarUrl(data.publicUrl);
      toast({
        title: 'Sucesso',
        description: 'Avatar atualizado com sucesso!',
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer upload do avatar.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          nome: data.nome,
          sobrenome: data.sobrenome,
          celular: data.celular,
          cpf: data.cpf,
          data_nascimento: data.data_nascimento,
          endereco: data.endereco,
          numero: data.numero,
          complemento: data.complemento,
          bairro: data.bairro,
          cidade: data.cidade,
          estado: data.estado,
          cep: data.cep,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar perfil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter no mínimo 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setPasswordLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast({
        title: 'Senha alterada',
        description: 'Sua senha foi atualizada com sucesso.',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao alterar senha.',
        variant: 'destructive',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (nome: string, sobrenome: string) => {
    return `${nome?.charAt(0) || ''}${sobrenome?.charAt(0) || ''}`.toUpperCase();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-raiz-light flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-raiz-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meu Perfil</h1>
          <p className="text-raiz-secondary">
            Gerencie suas informações pessoais e preferências.
          </p>
        </div>

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Informações Pessoais</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={avatarUrl} alt="Avatar" />
                        <AvatarFallback className="bg-raiz-primary text-white text-xl">
                          {getInitials(profile.nome, profile.sobrenome)}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-raiz-primary text-white p-2 rounded-full cursor-pointer hover:bg-raiz-primary/80 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                      </label>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-raiz-dark">
                        {profile.nome} {profile.sobrenome}
                      </h3>
                      <p className="text-raiz-secondary">{profile.email}</p>
                      <p className="text-sm text-raiz-secondary mt-1">
                        {uploading ? 'Uploading...' : 'Clique no ícone para alterar a foto'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        {...register('nome', { required: 'Nome é obrigatório' })}
                      />
                      {errors.nome && (
                        <p className="text-red-500 text-sm">{errors.nome.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sobrenome">Sobrenome *</Label>
                      <Input
                        id="sobrenome"
                        {...register('sobrenome', { required: 'Sobrenome é obrigatório' })}
                      />
                      {errors.sobrenome && (
                        <p className="text-red-500 text-sm">{errors.sobrenome.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      disabled
                      className="bg-gray-100"
                      {...register('email')}
                    />
                    <p className="text-sm text-raiz-secondary">
                      O email não pode ser alterado
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="celular">Celular *</Label>
                      <Input
                        id="celular"
                        {...register('celular', { required: 'Celular é obrigatório' })}
                        placeholder="(11) 99999-9999"
                      />
                      {errors.celular && (
                        <p className="text-red-500 text-sm">{errors.celular.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      {!isCpfLocked && (
                        <Alert className="mb-2">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Atenção:</strong> Após cadastrar seu CPF, não será possível alterar. Preencha com cuidado.
                          </AlertDescription>
                        </Alert>
                      )}
                      <Input
                        id="cpf"
                        {...register('cpf', { 
                          required: 'CPF é obrigatório',
                          validate: (value) => {
                            if (!isCpfLocked && value) {
                              return validateCPF(value) || 'CPF inválido';
                            }
                            return true;
                          }
                        })}
                        placeholder="000.000.000-00"
                        disabled={isCpfLocked}
                        className={isCpfLocked ? 'bg-gray-100' : ''}
                        onChange={(e) => {
                          if (!isCpfLocked) {
                            e.target.value = formatCPF(e.target.value);
                          }
                        }}
                        maxLength={14}
                      />
                      {errors.cpf && (
                        <p className="text-red-500 text-sm">{errors.cpf.message}</p>
                      )}
                      {isCpfLocked && (
                        <p className="text-sm text-raiz-secondary">
                          O CPF não pode ser alterado após o cadastro
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      {...register('data_nascimento', { required: 'Data de nascimento é obrigatória' })}
                    />
                    {errors.data_nascimento && (
                      <p className="text-red-500 text-sm">{errors.data_nascimento.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="address">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Endereço</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="endereco">Endereço</Label>
                      <Input
                        id="endereco"
                        {...register('endereco')}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="numero">Número</Label>
                      <Input
                        id="numero"
                        {...register('numero')}
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="complemento">Complemento</Label>
                      <Input
                        id="complemento"
                        {...register('complemento')}
                        placeholder="Apt, Casa, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bairro">Bairro</Label>
                      <Input
                        id="bairro"
                        {...register('bairro')}
                        placeholder="Nome do bairro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade</Label>
                      <Input
                        id="cidade"
                        {...register('cidade')}
                        placeholder="Nome da cidade"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado</Label>
                      <Input
                        id="estado"
                        {...register('estado')}
                        placeholder="SP, RJ, etc."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        {...register('cep')}
                        placeholder="00000-000"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Salvando...' : 'Salvar Endereço'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Segurança</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha *</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite sua nova senha"
                      required
                    />
                    <p className="text-sm text-raiz-secondary">
                      A senha deve ter no mínimo 6 caracteres
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua nova senha"
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={passwordLoading}>
                      {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <TokenPurchase />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
