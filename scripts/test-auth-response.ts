/**
 * Test script for Auth response (Login & Register)
 * Verify full user data is returned
 * 
 * Usage:
 *   1. Make sure server is running: npm run start:dev
 *   2. Run: npx ts-node scripts/test-auth-response.ts
 */

import axios from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3010';
const API_BASE = `${BASE_URL}/api`;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testAuthResponse() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Test: Auth Response (Login & Register)         ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  const testUser = {
    username: `testauth_${Date.now()}`,
    email: `testauth_${Date.now()}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test Auth User',
  };

  try {
    // 1. Test Register Response
    log('1️⃣  Testing Register Response...', colors.cyan);
    const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser);
    
    log('✅ Register successful', colors.green);
    log('\n📦 Register Response Structure:', colors.yellow);
    console.log(JSON.stringify(registerRes.data, null, 2));

    // Verify register response fields
    const registerUser = registerRes.data.data.user;
    const requiredFields = [
      'id', 'username', 'email', 'full_name', 
      'avatar_url', 'language', 'status', 'role',
      'level_code', 'level', 'created_at'
    ];

    log('\n🔍 Verifying Register Response Fields:', colors.cyan);
    let allFieldsPresent = true;
    for (const field of requiredFields) {
      if (field in registerUser) {
        log(`  ✅ ${field}: ${JSON.stringify(registerUser[field])}`, colors.green);
      } else {
        log(`  ❌ Missing field: ${field}`, colors.red);
        allFieldsPresent = false;
      }
    }

    if (!allFieldsPresent) {
      throw new Error('Register response missing required fields');
    }

    // 2. Test Login Response
    log('\n2️⃣  Testing Login Response...', colors.cyan);
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });

    log('✅ Login successful', colors.green);
    log('\n📦 Login Response Structure:', colors.yellow);
    console.log(JSON.stringify(loginRes.data, null, 2));

    // Verify login response fields
    const loginUser = loginRes.data.data.user;
    const loginData = loginRes.data.data;

    log('\n🔍 Verifying Login Response Fields:', colors.cyan);
    
    // Check user fields
    allFieldsPresent = true;
    for (const field of requiredFields) {
      if (field in loginUser) {
        log(`  ✅ user.${field}: ${JSON.stringify(loginUser[field])}`, colors.green);
      } else {
        log(`  ❌ Missing field: user.${field}`, colors.red);
        allFieldsPresent = false;
      }
    }

    // Check tokens
    if (loginData.accessToken) {
      log(`  ✅ accessToken: ${loginData.accessToken.substring(0, 30)}...`, colors.green);
    } else {
      log(`  ❌ Missing accessToken`, colors.red);
      allFieldsPresent = false;
    }

    if (loginData.refreshToken) {
      log(`  ✅ refreshToken: ${loginData.refreshToken.substring(0, 30)}...`, colors.green);
    } else {
      log(`  ❌ Missing refreshToken`, colors.red);
      allFieldsPresent = false;
    }

    if (!allFieldsPresent) {
      throw new Error('Login response missing required fields');
    }

    // 3. Verify level object structure if level is set
    if (loginUser.level) {
      log('\n🔍 Verifying Level Object Structure:', colors.cyan);
      const levelFields = ['code', 'name', 'updated_at'];
      for (const field of levelFields) {
        if (field in loginUser.level) {
          log(`  ✅ level.${field}: ${JSON.stringify(loginUser.level[field])}`, colors.green);
        } else {
          log(`  ❌ Missing field: level.${field}`, colors.red);
        }
      }

      if (loginUser.level.name) {
        log('\n🔍 Verifying Level Name i18n:', colors.cyan);
        const langFields = ['vi', 'en', 'jp'];
        for (const lang of langFields) {
          if (lang in loginUser.level.name) {
            log(`  ✅ level.name.${lang}: ${loginUser.level.name[lang]}`, colors.green);
          } else {
            log(`  ❌ Missing: level.name.${lang}`, colors.red);
          }
        }
      }
    } else {
      log('\n⚠️  Level is null (user has not set level yet)', colors.yellow);
    }

    // 4. Test with user that has level
    log('\n3️⃣  Testing with user that has level set...', colors.cyan);
    const userWithLevelCreds = {
      username: `testlevel_${Date.now()}`,
      email: `testlevel_${Date.now()}@example.com`,
      password: 'Test123!@#',
      full_name: 'Test Level User',
    };

    await axios.post(`${API_BASE}/auth/register`, userWithLevelCreds);
    
    // Login to get token
    const loginForTokenRes = await axios.post(`${API_BASE}/auth/login`, {
      username: userWithLevelCreds.username,
      password: userWithLevelCreds.password,
    });
    const accessToken = loginForTokenRes.data.data.accessToken;
    const userIdWithLevel = loginForTokenRes.data.data.user.id;

    // Set level via PUT (old endpoint)
    await axios.put(
      `${API_BASE}/users/${userIdWithLevel}`,
      { level_code: 'N5' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );

    // Login again to see level populated
    const loginWithLevelRes = await axios.post(`${API_BASE}/auth/login`, {
      username: userWithLevelCreds.username,
      password: userWithLevelCreds.password,
    });

    log('✅ Login with level successful', colors.green);
    const userWithLevel = loginWithLevelRes.data.data.user;

    if (userWithLevel.level && userWithLevel.level.code === 'N5') {
      log(`✅ Level properly populated: ${JSON.stringify(userWithLevel.level)}`, colors.green);
    } else {
      throw new Error('Level not properly populated after setting');
    }

    log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
    log('║   ✅ ALL AUTH RESPONSE TESTS PASSED!              ║', colors.green);
    log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  } catch (error: any) {
    log('\n❌ Test Failed!', colors.red);
    if (error.response) {
      log(`Status: ${error.response.status}`, colors.yellow);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, colors.yellow);
    } else {
      log(`Error: ${error.message}`, colors.yellow);
      console.error(error);
    }
    process.exit(1);
  }
}

testAuthResponse();
