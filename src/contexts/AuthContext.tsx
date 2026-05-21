import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  nome?: string;
  sobrenome?: string;
  email?: string;
  avatar_url?: string;
  cpf?: string;
  celular?: string;
  data_nascimento?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  has_completed_tour?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; session: Session | null }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return null;
      }

      setProfile(data || null);
      return data || null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
      return null;
    }
  };

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role, admin_type')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        return false;
      }

      const admin = !!data;
      setIsAdmin(admin);
      return admin;
    } catch (error) {
      console.error('Error checking admin role:', error);
      setIsAdmin(false);
      return false;
    }
  };

  const loadUserData = async (currentSession: Session | null) => {
    setSession(currentSession);
    setUser(currentSession?.user ?? null);

    if (!currentSession?.user?.id) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    try {
      await Promise.all([
        fetchProfile(currentSession.user.id),
        checkAdminRole(currentSession.user.id),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await Promise.all([
        fetchProfile(user.id),
        checkAdminRole(user.id),
      ]);
    }
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      loadUserData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      loadUserData(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const syncWithMailgun = async (userId: string, email: string, fullName: string, userType: 'autor' | 'apoiador' | 'ambos') => {
    try {
      console.log('Syncing user with Mailgun:', { userId, email, userType });

      const { data, error } = await supabase.functions.invoke('sync-mailgun', {
        body: {
          userId,
          email,
          fullName,
          userType,
        },
      });

      if (error) {
        console.warn('Mailgun sync failed (non-blocking):', error);
        return { success: false, error };
      }

      console.log('Mailgun sync successful:', data);
      return { success: true, data };
    } catch (error) {
      console.warn('Mailgun sync error (non-blocking):', error);
      return { success: false, error };
    }
  };

  const sendWelcomeEmail = async (email: string, fullName: string) => {
    try {
      console.log('Sending welcome email to:', email);

      const { data, error } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          fullName,
        },
      });

      if (error) {
        console.warn('Welcome email failed (non-blocking):', error);
        return { success: false, error };
      }

      console.log('Welcome email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.warn('Welcome email error (non-blocking):', error);
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: userData
        }
      });

      if (!error && data?.user) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar sua conta.",
        });

        const fullName = `${userData.nome || ''} ${userData.sobrenome || ''}`.trim() || 'Usuário Raiz Token';

        sendWelcomeEmail(email, fullName)
          .then((result) => {
            if (result.success) {
              console.log('Welcome email sent successfully');
            }
          })
          .catch((err) => {
            console.warn('Background welcome email failed:', err);
          });

        syncWithMailgun(data.user.id, email, fullName, 'apoiador')
          .then((result) => {
            if (result.success) {
              console.log('User synced with Mailgun newsletter');
            }
          })
          .catch((err) => {
            console.warn('Background Mailgun sync failed:', err);
          });
      } else if (!error) {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu e-mail para confirmar sua conta.",
        });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (!error && data?.session) {
        await loadUserData(data.session);
        toast({
          title: "Login realizado com sucesso!",
          description: "Sincronizando seus dados...",
        });
      }

      return { error, session: data?.session };
    } catch (error) {
      return { error, session: null };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('SignOut error (clearing local state anyway):', error);
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setLoading(false);

    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
