import { Hono } from 'hono';
export function createUploadRoutes() {
    const router = new Hono();
    router.post('/upload', async (c) => {
        try {
            const formData = await c.req.formData();
            const file = formData.get('file');
            const workspaceId = formData.get('workspace_id');
            if (!file || !(file instanceof File)) {
                c.status(400);
                return c.json({ error: 'No file provided' });
            }
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'image/png',
                'image/jpeg',
                'image/webp',
            ];
            if (!allowedTypes.includes(file.type)) {
                c.status(400);
                return c.json({
                    error: `File type "${file.type}" not allowed. Supported: PDF, Excel, PNG, JPEG, WEBP`,
                });
            }
            // Validate file size (10MB max)
            const MAX_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                c.status(400);
                return c.json({ error: 'File too large. Maximum size: 10MB' });
            }
            // Forward file to SSOS API
            const apiUrl = process.env.API_URL || 'https://api.finlaw.cloud';
            const token = process.env.SSOS_API_KEY || '';
            const uploadForm = new FormData();
            uploadForm.append('file', file);
            if (workspaceId)
                uploadForm.append('workspace_id', workspaceId);
            const response = await fetch(`${apiUrl}/api/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: uploadForm,
            });
            if (!response.ok) {
                const errText = await response.text();
                c.status(502);
                return c.json({ error: `Upload failed: ${errText}` });
            }
            const data = await response.json();
            return c.json({
                success: true,
                file_id: data.data?.id || data.file_id,
                url: data.data?.url || data.url,
                filename: file.name,
                size: file.size,
            });
        }
        catch (error) {
            console.error('Upload error:', error);
            c.status(500);
            return c.json({
                error: error instanceof Error ? error.message : 'Upload failed',
            });
        }
    });
    return router;
}
