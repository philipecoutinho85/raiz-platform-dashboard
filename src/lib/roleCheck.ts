import { supabase } from "@/integrations/supabase/client";

export const hasRole = (userId: string, role: 'admin' | 'moderator' | 'user'): boolean => {
  // This is a synchronous check that should be used with pre-loaded role data
  // For actual role checking, use the async checkUserRole function
  return false;
};

export const checkUserRole = async (userId: string, role: 'admin' | 'moderator' | 'user'): Promise<boolean> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .single();
  
  if (error || !data) return false;
  return true;
};
