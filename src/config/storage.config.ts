import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  profileImagesBucket:
    process.env.SUPABASE_PROFILE_IMAGES_BUCKET ?? 'profile-images',
}));
