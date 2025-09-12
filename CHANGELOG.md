# Changelog

## [1.1.0] - 2024-01-XX

### Changed
- **BREAKING**: Migrated from Google Drive to Supabase Storage for photo storage
- Removed Google Drive API dependency (`googleapis`)
- Updated file storage to use Supabase Storage bucket 'evidence-photos'
- Simplified environment configuration (removed Google Drive credentials)

### Added
- New storage bucket setup script (`scripts/setup-storage.js`)
- Photo upload testing script (`scripts/test-upload.js`)
- Supabase Storage policies for evidence photos
- Public access configuration for photo storage

### Removed
- Google Drive API integration
- Google Cloud Console setup requirements
- Complex OAuth2 flow for file storage
- Google Drive environment variables

### Updated
- `lib/fileStorage.ts` - New Supabase Storage implementation
- `supabase-schema.sql` - Added storage bucket and policies
- `package.json` - Removed googleapis dependency
- `env.example` - Simplified configuration
- Documentation updated to reflect Supabase Storage usage

### Benefits
- ✅ No need for Google Cloud Console setup
- ✅ Simpler configuration (only Supabase credentials needed)
- ✅ Integrated with existing Supabase project
- ✅ Better performance and reliability
- ✅ Easier deployment and maintenance

### Migration Notes
- Existing Google Drive photos will need to be migrated manually
- New photos will be stored in Supabase Storage
- Storage bucket 'evidence-photos' will be created automatically
- No changes needed to existing database schema
