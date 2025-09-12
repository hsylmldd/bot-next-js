const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageBucket() {
  try {
    console.log('Setting up Supabase Storage bucket...');
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }
    
    const bucketExists = buckets.some(bucket => bucket.id === 'evidence-photos');
    
    if (bucketExists) {
      console.log('✅ Bucket "evidence-photos" already exists');
    } else {
      // Create bucket
      const { data, error } = await supabase.storage.createBucket('evidence-photos', {
        public: true,
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      
      console.log('✅ Bucket "evidence-photos" created successfully');
    }
    
    // Test upload with image mime type
    const testFile = Buffer.from('fake-image-data');
    const fileName = `test-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('evidence-photos')
      .upload(fileName, testFile, {
        contentType: 'image/jpeg'
      });
    
    if (uploadError) {
      console.error('Error testing upload:', uploadError);
      return;
    }
    
    console.log('✅ Test upload successful');
    
    // Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('evidence-photos')
      .remove([fileName]);
    
    if (deleteError) {
      console.error('Error cleaning up test file:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
    console.log('\n🎉 Storage setup completed successfully!');
    console.log('Bucket "evidence-photos" is ready for photo uploads.');
    
  } catch (error) {
    console.error('Storage setup failed:', error);
  }
}

async function checkStoragePolicies() {
  try {
    console.log('Checking storage policies...');
    
    // This would require direct database access to check policies
    // For now, we'll just confirm the bucket is accessible
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking buckets:', error);
      return;
    }
    
    const bucket = buckets.find(b => b.id === 'evidence-photos');
    if (bucket) {
      console.log('✅ Bucket found:', bucket);
      console.log('✅ Public access:', bucket.public ? 'Enabled' : 'Disabled');
    } else {
      console.log('❌ Bucket not found');
    }
    
  } catch (error) {
    console.error('Error checking storage policies:', error);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupStorageBucket();
    break;
  case 'check':
    checkStoragePolicies();
    break;
  default:
    console.log('Usage: node scripts/setup-storage.js [setup|check]');
    console.log('  setup - Create storage bucket and test upload');
    console.log('  check - Check bucket status and policies');
}
