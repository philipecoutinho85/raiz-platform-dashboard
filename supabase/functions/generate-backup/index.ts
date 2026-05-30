import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALL_TABLES = [
  'profiles', 'user_roles', 'user_tokens', 'user_badges', 'user_consent_preferences', 'account_deletion_requests',
  'projects', 'project_contributions', 'project_comments', 'project_gallery', 'project_images', 'project_updates',
  'project_update_images', 'project_update_reactions', 'project_badges', 'project_reports', 'project_rejection_messages',
  'token_transactions', 'token_purchases', 'badges',
  'financial_ledger', 'ledger_movements', 'ledger_audit_log', 'financial_alerts', 'financial_settings',
  'stripe_payments', 'stripe_fee_config', 'bank_reconciliation', 'transfer_receipts',
  'refunds', 'refund_requests',
  'withdrawals', 'withdrawal_messages', 'withdrawal_verification_codes',
  'creator_payouts', 'creator_scores', 'creator_consent_records',
  'admin_logs', 'admin_access_logs', 'admin_devices', 'admin_2fa', 'moderator_permissions',
  'support_conversations', 'support_messages',
  'system_settings', 'google_analytics_settings', 'notifications',
  'data_processing_registry',
  'blog_posts', 'blog_categories', 'blog_images', 'blog_post_versions', 'blog_snippets',
  'mailgun_sync_log', 'backup_files'
];

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

const jsonResponse = (payload: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

const bytesToHex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const sha256 = async (content: Uint8Array) => {
  const digest = await crypto.subtle.digest('SHA-256', content);
  return bytesToHex(digest);
};

const logAdminAction = async (
  supabaseAdmin: any,
  userId: string,
  action: string,
  details: Record<string, unknown>,
) => {
  const { error } = await supabaseAdmin.rpc('log_admin_action', {
    p_admin_id: userId,
    p_action: action,
    p_target_type: 'system',
    p_target_id: null,
    p_details: details
  });

  if (error) {
    console.error(`Falha ao registrar log administrativo (${action}):`, error.message);
  }
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Método não permitido' }, 405);

  const startedAt = new Date().toISOString();
  let backupFileId: string | null = null;
  const filename = `raiztoken-backup-${startedAt.replace(/[:.]/g, '-')}.zip`;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ error: 'Configuração do servidor incompleta' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Não autorizado' }, 401);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return jsonResponse({ error: 'Não autorizado' }, 401);

    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, admin_type')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData || roleData.admin_type !== 'master') {
      return jsonResponse({ error: 'Apenas administradores master podem gerar backups' }, 403);
    }

    const { includeStorage = true, saveForLater = false } = await req.json().catch(() => ({}));

    if (saveForLater) {
      const { data: backupFile, error: backupFileError } = await supabaseAdmin
        .from('backup_files')
        .insert({
          filename,
          file_path: filename,
          file_size: 0,
          tables_count: 0,
          records_count: 0,
          storage_files_count: 0,
          storage_size_bytes: 0,
          include_storage: includeStorage,
          status: 'processing',
          created_by: user.id,
          started_at: startedAt,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (backupFileError) {
        throw new Error(`Não foi possível iniciar o registro do backup: ${backupFileError.message}`);
      }

      backupFileId = backupFile.id;
    }

    const zip = new JSZip();
    const manifest: any = {
      version: '2.2',
      generated_at: startedAt,
      generated_by: user.id,
      generated_by_email: user.email,
      platform: 'Raiz Token',
      backup_file_id: backupFileId,
      integrity_note: 'O SHA-256 do arquivo ZIP completo é armazenado em backup_files.sha256_checksum, no log administrativo e no header X-Backup-SHA256.',
      tables: {},
      storage: { buckets: [], total_files: 0, total_size: 0, files_with_errors: [] },
      summary: { total_tables: 0, total_records: 0, tables_with_errors: [], tables_empty: [] }
    };

    const databaseFolder = zip.folder('database');
    for (const table of ALL_TABLES) {
      try {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .range(offset, offset + batchSize - 1);

          if (error) {
            manifest.summary.tables_with_errors.push({ table, error: error.message });
            break;
          }

          if (data && data.length > 0) {
            allData.push(...data);
            offset += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        databaseFolder?.file(`${table}.json`, JSON.stringify(allData, null, 2));
        manifest.tables[table] = { record_count: allData.length, exported_at: new Date().toISOString() };
        manifest.summary.total_records += allData.length;
        manifest.summary.total_tables++;
        if (allData.length === 0) manifest.summary.tables_empty.push(table);
      } catch (err: any) {
        manifest.summary.tables_with_errors.push({ table, error: err.message });
      }
    }

    if (includeStorage) {
      const storageFolder = zip.folder('storage');

      for (const bucketName of CRITICAL_BUCKETS) {
        try {
          const bucketFolder = storageFolder?.folder(bucketName);
          let bucketFileCount = 0;
          let bucketSize = 0;
          const bucketErrors: Array<{ path: string; error: string }> = [];

          const processFolder = async (path: string, folder: any) => {
            const { data: items, error } = await supabaseAdmin
              .storage
              .from(bucketName)
              .list(path, { limit: 10000, sortBy: { column: 'name', order: 'asc' } });

            if (error) {
              bucketErrors.push({ path: path || '/', error: error.message });
              return;
            }
            if (!items || items.length === 0) return;

            for (const item of items) {
              const itemPath = path ? `${path}/${item.name}` : item.name;
              if (item.id === null) {
                await processFolder(itemPath, folder?.folder(item.name));
                continue;
              }

              try {
                const { data: fileData, error: downloadError } = await supabaseAdmin
                  .storage
                  .from(bucketName)
                  .download(itemPath);

                if (downloadError || !fileData) {
                  bucketErrors.push({ path: itemPath, error: downloadError?.message || 'Arquivo não retornado pelo Storage' });
                  continue;
                }

                const arrayBuffer = await fileData.arrayBuffer();
                folder?.file(item.name, new Uint8Array(arrayBuffer));
                bucketFileCount++;
                bucketSize += item.metadata?.size || arrayBuffer.byteLength;
              } catch (downloadErr: any) {
                bucketErrors.push({ path: itemPath, error: downloadErr?.message || String(downloadErr) });
              }
            }
          };

          await processFolder('', bucketFolder);
          manifest.storage.buckets.push({ name: bucketName, file_count: bucketFileCount, size_bytes: bucketSize, errors: bucketErrors });
          manifest.storage.total_files += bucketFileCount;
          manifest.storage.total_size += bucketSize;
          if (bucketErrors.length > 0) manifest.storage.files_with_errors.push({ bucket: bucketName, errors: bucketErrors });
        } catch (bucketErr: any) {
          manifest.storage.files_with_errors.push({ bucket: bucketName, errors: [{ path: '/', error: bucketErr?.message || String(bucketErr) }] });
        }
      }
    }

    manifest.completed_at = new Date().toISOString();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    const finalZipContent = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    const finalChecksum = await sha256(finalZipContent);

    if (saveForLater) {
      const { data: uploadData, error: uploadError } = await supabaseAdmin
        .storage
        .from('backups')
        .upload(filename, finalZipContent, { contentType: 'application/zip', upsert: true });

      if (uploadError) throw new Error(`Backup gerado, mas falhou ao salvar no Storage: ${uploadError.message}`);

      const { error: updateError } = await supabaseAdmin
        .from('backup_files')
        .update({
          file_path: uploadData?.path || filename,
          file_size: finalZipContent.length,
          tables_count: manifest.summary.total_tables,
          records_count: manifest.summary.total_records,
          storage_files_count: manifest.storage.total_files,
          storage_size_bytes: manifest.storage.total_size,
          include_storage: includeStorage,
          manifest,
          errors: manifest.summary.tables_with_errors.length > 0 || manifest.storage.files_with_errors.length > 0
            ? { tables: manifest.summary.tables_with_errors, storage: manifest.storage.files_with_errors }
            : null,
          status: 'completed',
          completed_at: manifest.completed_at,
          sha256_checksum: finalChecksum,
          error_message: null
        })
        .eq('id', backupFileId);

      if (updateError) throw new Error(`Backup salvo, mas falhou ao atualizar metadados: ${updateError.message}`);
    }

    await logAdminAction(supabaseAdmin, user.id, 'backup_generated', {
      filename,
      backup_file_id: backupFileId,
      file_size: finalZipContent.length,
      sha256_checksum: finalChecksum,
      tables_count: manifest.summary.total_tables,
      records_count: manifest.summary.total_records,
      storage_files: manifest.storage.total_files,
      storage_size_bytes: manifest.storage.total_size,
      errors: { tables: manifest.summary.tables_with_errors, storage: manifest.storage.files_with_errors },
      tables_empty: manifest.summary.tables_empty,
      include_storage: includeStorage,
      save_for_later: saveForLater,
      started_at: startedAt,
      completed_at: manifest.completed_at
    });

    return new Response(finalZipContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': finalZipContent.length.toString(),
        'X-Backup-SHA256': finalChecksum
      }
    });
  } catch (error: any) {
    console.error('Erro ao gerar backup:', error);

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseServiceKey && backupFileId) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        await supabaseAdmin
          .from('backup_files')
          .update({ status: 'failed', completed_at: new Date().toISOString(), error_message: error.message || 'Erro desconhecido ao gerar backup' })
          .eq('id', backupFileId);
      }
    } catch (updateFailure) {
      console.error('Falha ao registrar status failed do backup:', updateFailure);
    }

    return jsonResponse({ error: 'Erro ao gerar backup', details: error.message }, 500);
  }
});
