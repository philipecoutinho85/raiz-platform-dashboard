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

const isStorageFolder = (item: any) => {
  return item?.id === null
    || item?.metadata === null
    || item?.metadata === undefined
    || (!item?.metadata?.size && !item?.updated_at && !item?.created_at);
};

const isNotFoundStorageError = (error: unknown) => {
  const message = String((error as any)?.message || error || '').toLowerCase();
  return message.includes('not found')
    || message.includes('object not found')
    || message.includes('resource was not found')
    || message.includes('404')
    || message.includes('no such file');
};

const toStorageItemPath = (path: string, name: string) => path ? `${path}/${name}` : name;

const pushStorageError = (
  bucketManifest: any,
  manifest: any,
  bucketName: string,
  path: string,
  error: string,
) => {
  const errorEntry = { path: path || '/', error };
  bucketManifest.errors.push(errorEntry);
  bucketManifest.failed_files_count++;
  manifest.storage.files_with_errors.push({ bucket: bucketName, ...errorEntry });
};

const exportBucketToZip = async ({
  supabaseAdmin,
  bucketName,
  zipArchive,
  manifest,
}: {
  supabaseAdmin: any;
  bucketName: string;
  zipArchive: any;
  manifest: any;
}) => {
  const bucketManifest = {
    name: bucketName,
    listed_paths_count: 0,
    downloaded_files_count: 0,
    failed_files_count: 0,
    empty_paths: [] as string[],
    size_bytes: 0,
    errors: [] as Array<{ path: string; error: string }>,
  };

  console.log('[backup:storage] bucket_start', { bucketName });

  const downloadFile = async (itemPath: string, item?: any): Promise<'downloaded' | 'not_found' | 'failed'> => {
    console.log('[backup:storage] download_attempt', { bucketName, itemPath });

    try {
      const { data: fileData, error: downloadError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .download(itemPath);

      if (downloadError) {
        const message = downloadError.message || String(downloadError);
        console.warn('[backup:storage] download_error', { bucketName, itemPath, error: message });
        if (isNotFoundStorageError(downloadError)) return 'not_found';

        pushStorageError(bucketManifest, manifest, bucketName, itemPath, message);
        return 'failed';
      }

      if (!fileData) {
        console.warn('[backup:storage] download_empty_blob', { bucketName, itemPath });
        pushStorageError(bucketManifest, manifest, bucketName, itemPath, 'Download returned empty file data');
        return 'failed';
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const sizeBytes = Number(item?.metadata?.size || uint8Array.byteLength || 0);

      zipArchive.file(`storage/${bucketName}/${itemPath}`, uint8Array);
      bucketManifest.downloaded_files_count++;
      bucketManifest.size_bytes += sizeBytes;
      manifest.storage.total_files++;
      manifest.storage.total_size += sizeBytes;

      console.log('[backup:storage] download_success', {
        bucketName,
        itemPath,
        sizeBytes,
      });

      return 'downloaded';
    } catch (downloadErr: any) {
      const message = downloadErr?.message || String(downloadErr);
      console.warn('[backup:storage] download_exception', { bucketName, itemPath, error: message });
      if (isNotFoundStorageError(downloadErr)) return 'not_found';

      pushStorageError(bucketManifest, manifest, bucketName, itemPath, message);
      return 'failed';
    }
  };

  const listPath = async (path = '', depth = 0): Promise<'listed' | 'not_found' | 'failed'> => {
    if (depth > 50) {
      pushStorageError(bucketManifest, manifest, bucketName, path, 'Maximum storage traversal depth reached');
      return 'failed';
    }

    const limit = 1000;
    let offset = 0;
    let listedAnyItem = false;

    bucketManifest.listed_paths_count++;
    console.log('[backup:storage] list_path_start', { bucketName, path: path || '/', depth });

    while (true) {
      const { data: items, error } = await supabaseAdmin
        .storage
        .from(bucketName)
        .list(path, {
          limit,
          offset,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        const message = error.message || String(error);
        console.warn('[backup:storage] list_path_error', { bucketName, path: path || '/', offset, error: message });
        if (isNotFoundStorageError(error)) return 'not_found';

        pushStorageError(bucketManifest, manifest, bucketName, path || '/', message);
        return 'failed';
      }

      const count = items?.length || 0;
      console.log('[backup:storage] list_path_page', { bucketName, path: path || '/', offset, count });

      if (!items || count === 0) {
        if (!listedAnyItem) {
          bucketManifest.empty_paths.push(path || '/');
        }
        break;
      }

      listedAnyItem = true;

      for (const item of items) {
        if (!item?.name) continue;

        const itemPath = toStorageItemPath(path, item.name);
        const looksLikeFolder = isStorageFolder(item);
        console.log('[backup:storage] item_classified', {
          bucketName,
          itemPath,
          looksLikeFolder,
          hasMetadata: item.metadata !== null && item.metadata !== undefined,
          id: item.id ?? null,
        });

        if (looksLikeFolder) {
          const folderResult = await listPath(itemPath, depth + 1);
          if (folderResult === 'not_found') {
            const downloadResult = await downloadFile(itemPath, item);
            if (downloadResult === 'not_found') {
              pushStorageError(
                bucketManifest,
                manifest,
                bucketName,
                itemPath,
                'Storage item could not be listed as a folder or downloaded as a file',
              );
            }
          }
          continue;
        }

        const downloadResult = await downloadFile(itemPath, item);
        if (downloadResult === 'not_found') {
          const folderResult = await listPath(itemPath, depth + 1);
          if (folderResult === 'not_found') {
            pushStorageError(
              bucketManifest,
              manifest,
              bucketName,
              itemPath,
              'Storage item could not be downloaded as a file or listed as a folder',
            );
          }
        }
      }

      if (count < limit) break;
      offset += limit;
    }

    return 'listed';
  };

  await listPath('');

  manifest.storage.exported_buckets.push(bucketManifest);
  manifest.storage.buckets.push({
    name: bucketName,
    file_count: bucketManifest.downloaded_files_count,
    size_bytes: bucketManifest.size_bytes,
    errors: bucketManifest.errors,
  });

  console.log('[backup:storage] bucket_complete', {
    bucketName,
    listedPaths: bucketManifest.listed_paths_count,
    downloadedFiles: bucketManifest.downloaded_files_count,
    failedFiles: bucketManifest.failed_files_count,
    sizeBytes: bucketManifest.size_bytes,
    emptyPaths: bucketManifest.empty_paths.length,
    errors: bucketManifest.errors.length,
  });

  return bucketManifest;
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
    const backupHealthcheck = {
      generated_at: startedAt,
      version: '2.4',
      database_write_strategy: 'direct-zip-file-path',
      expected_database_tables: ALL_TABLES.length,
      expected_database_manifest: 'database/_tables_manifest.json',
      note: 'If this file is missing from database/, production is not running the updated generate-backup function.'
    };
    const manifest: any = {
      version: '2.4',
      generated_at: startedAt,
      generated_by: user.id,
      generated_by_email: user.email,
      platform: 'Raiz Token',
      backup_file_id: backupFileId,
      integrity_note: 'O SHA-256 do arquivo ZIP completo é armazenado em backup_files.sha256_checksum, no log administrativo e no header X-Backup-SHA256.',
      tables: {},
      storage: {
        buckets: [],
        exported_buckets: [],
        skipped_buckets: [],
        missing_buckets: [],
        total_files: 0,
        total_size: 0,
        files_with_errors: [],
        debug: {
          strategy: 'paginated-recursive-storage-export',
          excluded_buckets: ['backups'],
          critical_buckets: CRITICAL_BUCKETS,
        }
      },
      summary: { total_tables: 0, total_records: 0, tables_with_errors: [], tables_empty: [] }
    };

    zip.file('_backup_healthcheck.json', JSON.stringify(backupHealthcheck, null, 2));
    zip.file('database/_backup_healthcheck.json', JSON.stringify(backupHealthcheck, null, 2));

    for (const table of ALL_TABLES) {
      try {
        const allData: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        let tableError: string | null = null;

        console.log('[backup:database] table_start', { table });

        while (hasMore) {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('*')
            .range(offset, offset + batchSize - 1);

          if (error) {
            tableError = error.message;
            console.warn('[backup:database] table_error', { table, offset, error: tableError });
            manifest.summary.tables_with_errors.push({ table, error: tableError });
            break;
          }

          console.log('[backup:database] table_page', {
            table,
            offset,
            count: data?.length || 0,
          });

          if (data && data.length > 0) {
            allData.push(...data);
            offset += batchSize;
            hasMore = data.length === batchSize;
          } else {
            hasMore = false;
          }
        }

        zip.file(`database/${table}.json`, JSON.stringify(allData, null, 2));
        manifest.tables[table] = {
          record_count: allData.length,
          exported_at: new Date().toISOString(),
          ...(tableError ? { error: tableError } : {})
        };
        manifest.summary.total_records += allData.length;
        manifest.summary.total_tables++;
        if (allData.length === 0 && !tableError) manifest.summary.tables_empty.push(table);

        console.log('[backup:database] table_complete', {
          table,
          records: allData.length,
          hasError: Boolean(tableError),
        });
      } catch (err: any) {
        const message = err?.message || String(err);
        console.error('[backup:database] table_exception', { table, error: message });
        manifest.summary.tables_with_errors.push({ table, error: message });
        zip.file(`database/${table}.json`, JSON.stringify([], null, 2));
        manifest.tables[table] = {
          record_count: 0,
          exported_at: new Date().toISOString(),
          error: message
        };
        manifest.summary.total_tables++;
      }
    }

    zip.file('database/_tables_manifest.json', JSON.stringify({
      exported_at: new Date().toISOString(),
      total_tables: manifest.summary.total_tables,
      total_records: manifest.summary.total_records,
      tables_empty: manifest.summary.tables_empty,
      tables_with_errors: manifest.summary.tables_with_errors,
      tables: manifest.tables,
    }, null, 2));

    if (includeStorage) {
      const { data: existingBuckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
      let bucketNamesToExport: string[] = [];

      if (bucketsError) {
        const message = bucketsError.message || String(bucketsError);
        console.warn('[backup:storage] list_buckets_error', { error: message });
        manifest.storage.files_with_errors.push({ bucket: '*', path: '/', error: message });
        manifest.storage.debug.bucket_discovery_error = message;
        bucketNamesToExport = CRITICAL_BUCKETS.filter((bucketName) => bucketName !== 'backups');
      } else {
        const realBucketNames = (existingBuckets || [])
          .map((bucket: any) => bucket.id || bucket.name)
          .filter(Boolean);

        const realBucketSet = new Set(realBucketNames);
        manifest.storage.missing_buckets = CRITICAL_BUCKETS.filter((bucketName) => !realBucketSet.has(bucketName));

        bucketNamesToExport = realBucketNames
          .filter((bucketName: string) => bucketName !== 'backups')
          .sort((a: string, b: string) => {
            const aCriticalIndex = CRITICAL_BUCKETS.indexOf(a);
            const bCriticalIndex = CRITICAL_BUCKETS.indexOf(b);
            const aPriority = aCriticalIndex === -1 ? Number.MAX_SAFE_INTEGER : aCriticalIndex;
            const bPriority = bCriticalIndex === -1 ? Number.MAX_SAFE_INTEGER : bCriticalIndex;
            if (aPriority !== bPriority) return aPriority - bPriority;
            return a.localeCompare(b);
          });

        if (realBucketSet.has('backups')) {
          manifest.storage.skipped_buckets.push({ name: 'backups', reason: 'excluded_self_backup_bucket' });
        }

        for (const missingBucket of manifest.storage.missing_buckets) {
          console.warn('[backup:storage] missing_critical_bucket', { bucketName: missingBucket });
        }
      }

      for (const bucketName of bucketNamesToExport) {
        try {
          await exportBucketToZip({
            supabaseAdmin,
            bucketName,
            zipArchive: zip,
            manifest,
          });
        } catch (bucketErr: any) {
          const message = bucketErr?.message || String(bucketErr);
          console.error('[backup:storage] bucket_unhandled_error', { bucketName, error: message });
          manifest.storage.files_with_errors.push({ bucket: bucketName, path: '/', error: message });
          manifest.storage.exported_buckets.push({
            name: bucketName,
            listed_paths_count: 0,
            downloaded_files_count: 0,
            failed_files_count: 1,
            empty_paths: [],
            size_bytes: 0,
            errors: [{ path: '/', error: message }],
          });
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
