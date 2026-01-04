import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '@/types/blog';
import { toast } from 'sonner';

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as BlogPost[];
    },
  });
}

export function useBlogPost(id: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as BlogPost;
    },
    enabled: !!id,
  });
}

export function useCreateBlogPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (post: Partial<BlogPost>) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');
      
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          title: post.title || 'Sem título',
          slug: post.slug || generateSlug(post.title || ''),
          content: post.content || '',
          user_id: user.user.id,
          status: post.status || 'draft',
          excerpt: post.excerpt,
          featured_image_url: post.featured_image_url,
          featured_image_alt: post.featured_image_alt,
          meta_title: post.meta_title,
          meta_description: post.meta_description,
          focus_keyword: post.focus_keyword,
          canonical_url: post.canonical_url,
          og_title: post.og_title,
          og_description: post.og_description,
          og_image_url: post.og_image_url,
          twitter_title: post.twitter_title,
          twitter_description: post.twitter_description,
          twitter_image_url: post.twitter_image_url,
          category: post.category,
          tags: post.tags || [],
          word_count: post.word_count || 0,
          reading_time_minutes: post.reading_time_minutes || 0,
          seo_score: post.seo_score || 0,
          readability_score: post.readability_score || 0,
          published_at: post.published_at,
          scheduled_at: post.scheduled_at,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar post: ' + error.message);
    },
  });
}

export function useUpdateBlogPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...post }: Partial<BlogPost> & { id: string }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(post)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      queryClient.invalidateQueries({ queryKey: ['blog-post', data.id] });
      toast.success('Post atualizado!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar post: ' + error.message);
    },
  });
}

export function useDeleteBlogPost() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast.success('Post excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir post: ' + error.message);
    },
  });
}

export function useBlogPostVersions(postId: string | undefined) {
  return useQuery({
    queryKey: ['blog-post-versions', postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from('blog_post_versions')
        .select('*')
        .eq('post_id', postId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!postId,
  });
}

export function useSaveVersion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ postId, title, content, meta_title, meta_description, focus_keyword }: {
      postId: string;
      title: string;
      content: string;
      meta_title?: string;
      meta_description?: string;
      focus_keyword?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Não autenticado');
      
      // Get current max version
      const { data: versions } = await supabase
        .from('blog_post_versions')
        .select('version_number')
        .eq('post_id', postId)
        .order('version_number', { ascending: false })
        .limit(1);
      
      const nextVersion = versions && versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      const { data, error } = await supabase
        .from('blog_post_versions')
        .insert({
          post_id: postId,
          version_number: nextVersion,
          title,
          content,
          meta_title,
          meta_description,
          focus_keyword,
          created_by: user.user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog-post-versions', variables.postId] });
      toast.success('Versão salva!');
    },
  });
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
