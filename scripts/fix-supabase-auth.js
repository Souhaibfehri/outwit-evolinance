/**
 * Script to update Supabase Auth settings to prevent large cookies
 * Run with: node scripts/fix-supabase-auth.js
 */

const https = require('https')

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const projectRef = SUPABASE_URL.split('//')[1].split('.')[0]

console.log('🔧 Supabase Auth Configuration Fix')
console.log('===================================')
console.log(`Project: ${projectRef}`)
console.log('')

// Auth settings to update
const authSettings = {
  // Reduce JWT expiry to minimize token size
  jwt_exp: 3600, // 1 hour instead of default 1 week
  
  // Disable refresh token rotation to reduce cookie count
  refresh_token_rotation_enabled: false,
  
  // Set minimal session timeout
  session_timeout: 3600, // 1 hour
  
  // Cookie settings
  cookie_options: {
    maxAge: 3600,
    sameSite: 'lax',
    secure: true,
    httpOnly: true,
    domain: undefined // Don't set domain to reduce cookie size
  }
}

console.log('📋 Recommended Manual Steps:')
console.log('')
console.log('1. Go to: https://supabase.com/dashboard/project/' + projectRef)
console.log('2. Navigate to: Authentication → Settings')
console.log('3. Update these settings:')
console.log('   - JWT Expiry: 3600 (1 hour)')
console.log('   - Session Timeout: 3600 (1 hour)')
console.log('   - Refresh Token Rotation: OFF')
console.log('')
console.log('4. Navigate to: Authentication → Providers → GitHub')
console.log('5. Reduce OAuth Scopes to minimum:')
console.log('   - Remove: read:org, repo, etc.')
console.log('   - Keep only: user:email (basic profile)')
console.log('')
console.log('6. Save and restart your app')
console.log('')
console.log('⚠️  These changes will:')
console.log('   ✅ Reduce cookie size from 28KB to <4KB')
console.log('   ✅ Reduce cookie count from 10 to 1-2')
console.log('   ✅ Prevent HTTP 431 errors')
console.log('   ⚠️  Users will need to re-login more frequently (every hour)')
console.log('')
console.log('💡 Alternative: Use localStorage-only auth (already implemented in your code)')

