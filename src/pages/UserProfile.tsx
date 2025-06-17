
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Wallet, CreditCard, Edit, Camera, Coins, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserProfile = () => {
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    bio: 'Empreendedor apaixonado por tecnologia e sustentabilidade',
    avatar: '/placeholder.svg',
    tokens: 1250,
    phone: '(11) 99999-9999',
    location: 'São Paulo, SP'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = () => {
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
    setIsEditing(false);
  };

  const handleTokenPurchase = (amount: number, price: number) => {
    toast({
      title: "Compra realizada!",
      description: `Você adquiriu ${amount} tokens por R$ ${price}.`,
    });
    setProfileData(prev => ({ ...prev, tokens: prev.tokens + amount }));
  };

  const tokenPackages = [
    { amount: 100, price: 10, popular: false },
    { amount: 500, price: 45, popular: true },
    { amount: 1000, price: 80, popular: false },
    { amount: 2500, price: 190, popular: false }
  ];

  const transactionHistory = [
    { id: 1, type: 'purchase', amount: 500, value: 45, date: '2024-02-15', description: 'Compra de tokens' },
    { id: 2, type: 'spent', amount: -50, value: 0, date: '2024-02-10', description: 'Apoio ao projeto EcoTech' },
    { id: 3, type: 'spent', amount: -25, value: 0, date: '2024-02-08', description: 'Apoio ao projeto App Educação' }
  ];

  return (
    <div className="min-h-screen bg-raiz-light py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-raiz-dark mb-2">Meu Perfil</h1>
          <p className="text-raiz-secondary">Gerencie suas informações pessoais e tokens</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="relative mx-auto mb-4">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={profileData.avatar} alt={profileData.name} />
                    <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                </div>
                <CardTitle>{profileData.name}</CardTitle>
                <CardDescription>{profileData.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-raiz-gold/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Coins className="w-5 h-5 text-raiz-gold" />
                    <span className="font-semibold">Saldo de Tokens</span>
                  </div>
                  <Badge variant="secondary" className="bg-raiz-gold/20 text-raiz-gold">
                    {profileData.tokens} tokens
                  </Badge>
                </div>
                <p className="text-sm text-raiz-secondary">{profileData.bio}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Perfil</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="history">Histórico</TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Informações Pessoais</span>
                      </CardTitle>
                      <CardDescription>Atualize seus dados pessoais</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      {isEditing ? 'Cancelar' : 'Editar'}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Localização</Label>
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Biografia</Label>
                      <Input
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    {isEditing && (
                      <Button onClick={handleProfileUpdate} className="bg-raiz-primary hover:bg-raiz-primary/90">
                        Salvar Alterações
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tokens Tab */}
              <TabsContent value="tokens">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Wallet className="w-5 h-5" />
                      <span>Comprar Tokens</span>
                    </CardTitle>
                    <CardDescription>
                      Use tokens para apoiar projetos na plataforma
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tokenPackages.map((pkg, index) => (
                        <div
                          key={index}
                          className={`relative border rounded-lg p-6 ${
                            pkg.popular 
                              ? 'border-raiz-gold bg-raiz-gold/5' 
                              : 'border-raiz-accent/20'
                          }`}
                        >
                          {pkg.popular && (
                            <Badge className="absolute -top-2 left-4 bg-raiz-gold text-raiz-dark">
                              Mais Popular
                            </Badge>
                          )}
                          <div className="text-center space-y-4">
                            <div>
                              <div className="text-2xl font-bold text-raiz-dark">
                                {pkg.amount} tokens
                              </div>
                              <div className="text-lg text-raiz-primary">
                                R$ {pkg.price}
                              </div>
                              <div className="text-sm text-raiz-secondary">
                                R$ {(pkg.price / pkg.amount).toFixed(3)} por token
                              </div>
                            </div>
                            <Button
                              className="w-full"
                              variant={pkg.popular ? 'default' : 'outline'}
                              onClick={() => handleTokenPurchase(pkg.amount, pkg.price)}
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Comprar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <History className="w-5 h-5" />
                      <span>Histórico de Transações</span>
                    </CardTitle>
                    <CardDescription>
                      Acompanhe suas compras e gastos de tokens
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {transactionHistory.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between p-4 border border-raiz-accent/20 rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === 'purchase' 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {transaction.type === 'purchase' ? '+' : '-'}
                            </div>
                            <div>
                              <div className="font-semibold text-raiz-dark">
                                {transaction.description}
                              </div>
                              <div className="text-sm text-raiz-secondary">
                                {transaction.date}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${
                              transaction.type === 'purchase' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {transaction.amount > 0 ? '+' : ''}{transaction.amount} tokens
                            </div>
                            {transaction.value > 0 && (
                              <div className="text-sm text-raiz-secondary">
                                R$ {transaction.value}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
