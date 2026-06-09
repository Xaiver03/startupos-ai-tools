import type { SSOSClient } from '../client.js';
import { readFile } from 'fs/promises';
import { basename } from 'path';

export function createFileTools(client: SSOSClient) {
  return {
    upload_local_file: {
      description: 'Upload a local file to SSOS server',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Local file path (absolute or relative)',
          },
          file_type: {
            type: 'string',
            enum: ['invoice', 'contract', 'bank_statement', 'attachment', 'other'],
            description: 'File type category',
          },
          description: {
            type: 'string',
            description: 'Optional file description',
          },
        },
        required: ['file_path', 'file_type'],
      },
      handler: async (args: any) => {
        try {
          const fileBuffer = await readFile(args.file_path);
          const fileName = basename(args.file_path);

          const formData = new FormData();
          formData.append('file', new Blob([fileBuffer]), fileName);
          formData.append('file_type', args.file_type);
          formData.append('workspace_id', client.getWorkspaceId());
          if (args.description) {
            formData.append('description', args.description);
          }

          const data = await client.apiFetch('/api/files/upload', {
            method: 'POST',
            body: formData,
          });

          return {
            content: [{
              type: 'text',
              text: `File uploaded successfully: ${fileName}\nFile ID: ${data.file_id}\nURL: ${data.url}`,
            }],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{
              type: 'text',
              text: `Error uploading file: ${errorMessage}`,
            }],
            isError: true,
          };
        }
      },
    },

    list_uploaded_files: {
      description: 'List all uploaded files in the current workspace',
      inputSchema: {
        type: 'object',
        properties: {
          file_type: {
            type: 'string',
            enum: ['invoice', 'contract', 'bank_statement', 'attachment', 'other'],
            description: 'Filter by file type',
          },
          limit: {
            type: 'number',
            description: 'Number of files to return (default: 50)',
          },
        },
      },
      handler: async (args: any) => {
        const params = new URLSearchParams();
        params.append('workspace_id', client.getWorkspaceId());
        if (args.file_type) params.append('file_type', args.file_type);
        if (args.limit) params.append('limit', String(args.limit));

        const data = await client.apiFetch(`/api/files?${params.toString()}`);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(data, null, 2),
          }],
        };
      },
    },

    delete_file: {
      description: 'Delete an uploaded file by ID',
      inputSchema: {
        type: 'object',
        properties: {
          file_id: {
            type: 'string',
            description: 'File ID (UUID)',
          },
        },
        required: ['file_id'],
      },
      handler: async (args: any) => {
        const data = await client.apiFetch(`/api/files/${args.file_id}`, {
          method: 'DELETE',
        });
        return {
          content: [{
            type: 'text',
            text: `File deleted successfully: ${args.file_id}`,
          }],
        };
      },
    },

    parse_excel_to_journal_entries: {
      description: 'Parse an Excel/CSV file and convert to journal entries',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Local Excel/CSV file path',
          },
          sheet_name: {
            type: 'string',
            description: 'Excel sheet name (optional, default: first sheet)',
          },
          auto_post: {
            type: 'boolean',
            description: 'Automatically post entries after import (default: false)',
          },
        },
        required: ['file_path'],
      },
      handler: async (args: any) => {
        try {
          const fileBuffer = await readFile(args.file_path);
          const fileName = basename(args.file_path);

          const formData = new FormData();
          formData.append('file', new Blob([fileBuffer]), fileName);
          formData.append('workspace_id', client.getWorkspaceId());
          if (args.sheet_name) {
            formData.append('sheet_name', args.sheet_name);
          }
          if (args.auto_post !== undefined) {
            formData.append('auto_post', String(args.auto_post));
          }

          const data = await client.apiFetch('/api/journal-entries/import', {
            method: 'POST',
            body: formData,
          });

          return {
            content: [{
              type: 'text',
              text: `Import successful!\nTotal entries: ${data.total}\nSuccessfully imported: ${data.success}\nFailed: ${data.failed}\n\nDetails:\n${JSON.stringify(data.details, null, 2)}`,
            }],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          return {
            content: [{
              type: 'text',
              text: `Error importing file: ${errorMessage}`,
            }],
            isError: true,
          };
        }
      },
    },
  };
}
