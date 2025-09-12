const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  try {
    console.log('Testing photo upload to Supabase Storage...');
    
    // Create a test image buffer
    const testImage = Buffer.from('fake-image-data');
    const fileName = `test-evidence-${Date.now()}.jpg`;
    
    // Upload to storage
    const { data, error } = await supabase.storage
      .from('evidence-photos')
      .upload(fileName, testImage, {
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('Upload failed:', error);
      return;
    }
    
    console.log('✅ Upload successful:', data);
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('evidence-photos')
      .getPublicUrl(data.path);
    
    console.log('✅ Public URL:', urlData.publicUrl);
    
    // Clean up
    const { error: deleteError } = await supabase.storage
      .from('evidence-photos')
      .remove([fileName]);
    
    if (deleteError) {
      console.error('Cleanup failed:', deleteError);
    } else {
      console.log('✅ Test file cleaned up');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testUpload();
