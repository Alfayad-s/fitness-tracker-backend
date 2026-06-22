import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { extname } from 'path';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): SupabaseClient {
    if (this.client) {
      return this.client;
    }

    const url = this.configService.get<string>('storage.supabaseUrl');
    const key = this.configService.get<string>('storage.supabaseServiceRoleKey');

    if (!url || !key) {
      throw new BadRequestException('File storage is not configured');
    }

    this.client = createClient(url, key);
    return this.client;
  }

  validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('Profile image file is required');
    }

    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, and GIF images are allowed',
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('Profile image must be 5MB or smaller');
    }
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    this.validateImageFile(file);

    const bucket = this.configService.getOrThrow<string>(
      'storage.profileImagesBucket',
    );
    const extension = extname(file.originalname) || '.jpg';
    const path = `${userId}/${randomUUID()}${extension}`;

    const { error } = await this.getClient()
      .storage.from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Profile image upload failed: ${error.message}`);
      throw new BadRequestException('Failed to upload profile image');
    }

    const { data } = this.getClient().storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
