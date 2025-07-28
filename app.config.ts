import 'dotenv/config';

export default {
  expo: {
    name: 'secureNotes',
    slug: 'secure-notes',
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
