import 'dotenv/config';

export default {
  expo: {
    name: 'secureNotes',
    slug: 'secure-notes',
    android: {
      package: 'com.secureNotes.com',
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: '37e35760-f575-4426-aca2-61db8a5e1cb1',
      },
    },
  },
};
