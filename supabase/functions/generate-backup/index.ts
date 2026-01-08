import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TODAS as tabelas do banco - lista completa
const ALL_TABLES = [
  // Usuários e Perfis
  'profiles',
  'user_roles',
  'user_tokens',
  'user_badges',
  'user_consent_preferences',
  'account_deletion_requests',
  
  // Projetos
  'projects',
  'project_contributions',
  'project_comments',
  'project_gallery',
  'project_images',
  'project_updates',
  'project_update_images',
  'project_update_reactions',
  'project_badges',
  'project_reports',
  'project_rejection_messages',
  
  // Tokens e Transações
  'token_transactions',
  'token_purchases',
  
  // Badges
  'badges',
  
  // Financeiro
  'financial_ledger',
  'ledger_movements',
  'ledger_audit_log',
  'financial_alerts',
  'financial_settings',
  'stripe_payments',
  'stripe_fee_config',
  'bank_reconciliation',
  'transfer_receipts',
  
  // Reembolsos
  'refunds',
  'refund_requests',
  
  // Saques
  'withdrawals',
  'withdrawal_messages',
  'withdrawal_verification_codes',
  
  // Criadores
  'creator_payouts',
  'creator_scores',
  'creator_consent_records',
  
  // Admin
  'admin_logs',
  'admin_access_logs',
  'admin_devices',
  'admin_2fa',
  'moderator_permissions',
  
  // Suporte
  'support_conversations',
  'support_messages',
  
  // Sistema
  'system_settings',
  'google_analytics_settings',
  'notifications',
  
  // LGPD
  'data_processing_registry',
  
  // Blog
  'blog_posts',
  'blog_categories',
  'blog_images',
  'blog_post_versions',
  'blog_snippets',
  
  // Outros
  'mailgun_sync_log',
  'backup_files'
];

// Buckets críticos para backup
const CRITICAL_BUCKETS = [
  'refund-proofs',
  'withdrawal-proofs', 
  'project-images',
  'avatars',
  'blog-images',
  'support-attachments',
  'accountability-images',
  'transfer-receipts'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verificar se é admin master
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, admin_type')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !roleData || roleData.admin_type !== 'master') {
      return new Response(JSON.stringify({ error: 'Apenas administradores master podem gerar backups' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { includeStorage = true, saveForLater = false } = await req.json().catch(() => ({}));

    console.log('Iniciando geração de backup completo...');
    console.log(`Total de tabelas a exportar: ${ALL_TABLES.length}`);
    
    const zip = new JSZip();
    const manifest: any = {
      version: '2.1',
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      generated_by_email: user.email,
      platform: 'Raiz Token',
      tables: {},
      storage: {
        buckets: [],
        total_files: 0,
        total_size: 0
      },
      summary: {
        total_tables: 0,
        total_records: 0,
        tables_with_errors: [],
        tables_empty: []
      }
    };

    // ========== BACKUP DO BANCO DE DADOS ==========
    console.log('Exportando tabelas do banco de dados...');
    const databaseFolder = zip.folder('database');
    
    for (const table of ALL_TABLES) {
      try {
        console.log(`Exportando tabela: ${table}`);
        
        // Buscar todos os registros (sem limite)
        let allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .range(offset, offset + batchSize - 1);

          if (error) {
            console.error(`Erro ao exportar ${table}:`, error.message);
            manifest.summary.tables_with_errors.push({
              table,
              error: error.message
            });
            break;
          }

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            offset += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        // Adicionar ao ZIP
        databaseFolder?.file(`${table}.json`, JSON.stringify(allData, null, 2));
        
        manifest.tables[table] = {
          record_count: allData.length,
          exported_at: new Date().toISOString()
        };
        manifest.summary.total_records += allData.length;
        manifest.summary.total_tables++;

        if (allData.length === 0) {
          manifest.summary.tables_empty.push(table);
        }

        console.log(`${table}: ${allData.length} registros exportados`);
      } catch (err: any) {
        console.error(`Erro ao processar tabela ${table}:`, err);
        manifest.summary.tables_with_errors.push({
          table,
          error: err.message
        });
      }
    }

    // ========== BACKUP DO STORAGE ==========
    if (includeStorage) {
      console.log('Exportando arquivos do Storage...');
      const storageFolder = zip.folder('storage');

      for (const bucketName of CRITICAL_BUCKETS) {
        try {
          console.log(`Processando bucket: ${bucketName}`);
          
          // Listar arquivos do bucket
          const { data: files, error: listError } = await supabaseAdmin
            .storage
            .from(bucketName)
            .list('', { limit: 10000 });

          if (listError) {
            console.log(`Bucket ${bucketName} não encontrado ou vazio:`, listError.message);
            continue;
          }

          if (!files || files.length === 0) {
            console.log(`Bucket ${bucketName} está vazio`);
            continue;
          }

          const bucketFolder = storageFolder?.folder(bucketName);
          let bucketFileCount = 0;
          let bucketSize = 0;

          // Processar arquivos (recursivamente)
          const processFolder = async (path: string, folder: any) => {
            const { data: items, error } = await supabaseAdmin
              .storage
              .from(bucketName)
              .list(path, { limit: 10000 });

            if (error || !items) return;

            for (const item of items) {
              const itemPath = path ? `${path}/${item.name}` : item.name;
              
              if (item.id === null) {
                // É uma pasta
                const subFolder = folder?.folder(item.name);
                await processFolder(itemPath, subFolder);
              } else {
                // É um arquivo - baixar e adicionar ao ZIP
                try {
                  const { data: fileData, error: downloadError } = await supabaseAdmin
                    .storage
                    .from(bucketName)
                    .download(itemPath);

                  if (!downloadError && fileData) {
                    const arrayBuffer = await fileData.arrayBuffer();
                    folder?.file(item.name, new Uint8Array(arrayBuffer));
                    bucketFileCount++;
                    bucketSize += item.metadata?.size || arrayBuffer.byteLength;
                  }
                } catch (downloadErr) {
                  console.log(`Erro ao baixar ${itemPath}:`, downloadErr);
                }
              }
            }
          };

          await processFolder('', bucketFolder);

          manifest.storage.buckets.push({
            name: bucketName,
            file_count: bucketFileCount,
            size_bytes: bucketSize
          });
          manifest.storage.total_files += bucketFileCount;
          manifest.storage.total_size += bucketSize;

          console.log(`${bucketName}: ${bucketFileCount} arquivos exportados`);
        } catch (bucketErr) {
          console.error(`Erro ao processar bucket ${bucketName}:`, bucketErr);
        }
      }
    }

    // ========== ADICIONAR MANIFESTO ==========
    manifest.completed_at = new Date().toISOString();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // ========== GERAR ZIP ==========
    console.log('Gerando arquivo ZIP...');
    const zipContent = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const filename = `raiztoken-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;

    // ========== SALVAR PARA DOWNLOAD POSTERIOR ==========
    if (saveForLater) {
      console.log('Salvando backup no storage...');
      
      // Upload para o bucket de backups usando octet-stream (mais compatível)
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('backups')
        .upload(filename, zipContent, {
          contentType: 'application/octet-stream',
          upsert: true
        });

      if (uploadError) {
        console.error('Erro ao salvar backup:', uploadError);
      } else {
        console.log('Backup salvo com sucesso:', uploadData?.path);
        
        // Registrar backup na tabela
        const { error: insertError } = await supabaseAdmin
          .from('backup_files')
          .insert({
            filename,
            file_path: uploadData?.path || filename,
            file_size: zipContent.length,
            tables_count: manifest.summary.total_tables,
            records_count: manifest.summary.total_records,
            storage_files_count: manifest.storage.total_files,
            storage_size_bytes: manifest.storage.total_size,
            include_storage: includeStorage,
            manifest: manifest,
            errors: manifest.summary.tables_with_errors.length > 0 ? manifest.summary.tables_with_errors : null,
            created_by: user.id,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
          });

        if (insertError) {
          console.error('Erro ao registrar backup:', insertError);
        } else {
          console.log('Backup registrado na tabela backup_files');
        }
      }
    }

    // ========== REGISTRAR LOG ADMINISTRATIVO ==========
    await supabaseAdmin.rpc('log_admin_action', {
      p_admin_id: user.id,
      p_action: 'backup_generated',
      p_target_type: 'system',
      p_target_id: null,
      p_details: {
        filename,
        tables_count: manifest.summary.total_tables,
        records_count: manifest.summary.total_records,
        storage_files: manifest.storage.total_files,
        storage_size_bytes: manifest.storage.total_size,
        errors: manifest.summary.tables_with_errors,
        tables_empty: manifest.summary.tables_empty,
        include_storage: includeStorage,
        save_for_later: saveForLater
      }
    });

    console.log('Backup gerado com sucesso!');

    // Retornar o ZIP como download
    return new Response(zipContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': zipContent.length.toString()
      }
    });

  } catch (error: any) {
    console.error('Erro ao gerar backup:', error);
    return new Response(JSON.stringify({ 
      error: 'Erro ao gerar backup',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
