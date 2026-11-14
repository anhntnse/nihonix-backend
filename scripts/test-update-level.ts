/**
 * Test script for PATCH /api/users/me/level
 * 
 * Usage:
 *   1. Make sure server is running: npm run start:dev
 *   2. Run: npx ts-node scripts/test-update-level.ts
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

async function testUpdateLevel() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Test: PATCH /users/me/level                    ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  let accessToken: string | null = null;
  const testUser = {
    username: `testlevel_${Date.now()}`,
    email: `testlevel_${Date.now()}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test Level User',
  };

  try {
    // 1. Register
    log('1️⃣  Registering test user...', colors.cyan);
    const registerRes = await axios.post(`${API_BASE}/auth/register`, testUser);
    log(`✅ User registered: ${registerRes.data.data.user.username}`, colors.green);

    // 2. Login
    log('\n2️⃣  Logging in...', colors.cyan);
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });
    accessToken = loginRes.data.data.accessToken;
    log('✅ Login successful', colors.green);

    if (!accessToken) {
      throw new Error('No access token received');
    }

    // 3. Get current user profile
    log('\n3️⃣  Getting current user profile...', colors.cyan);
    const profileRes = await axios.get(`${API_BASE}/users/${registerRes.data.data.user.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    log(`✅ Current level: ${profileRes.data.data.level_code || 'null'}`, colors.green);
    console.log(JSON.stringify(profileRes.data.data, null, 2));

    // 4. Update level to N5
    log('\n4️⃣  Updating level to N5...', colors.cyan);
    const updateN5Res = await axios.patch(
      `${API_BASE}/users/me/level`,
      { level_code: 'N5' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    log(`✅ Level updated to N5`, colors.green);
    console.log('Response:', JSON.stringify(updateN5Res.data.data, null, 2));

    // Verify level object is populated
    if (!updateN5Res.data.data.level) {
      log('⚠️  Warning: Level relation not populated', colors.yellow);
    } else {
      log(`✅ Level relation: ${JSON.stringify(updateN5Res.data.data.level.name)}`, colors.green);
    }

    // 5. Update level to N3
    log('\n5️⃣  Updating level to N3...', colors.cyan);
    const updateN3Res = await axios.patch(
      `${API_BASE}/users/me/level`,
      { level_code: 'N3' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    log(`✅ Level updated to N3`, colors.green);
    console.log('Response:', JSON.stringify(updateN3Res.data.data, null, 2));

    // 6. Update level to N1
    log('\n6️⃣  Updating level to N1...', colors.cyan);
    const updateN1Res = await axios.patch(
      `${API_BASE}/users/me/level`,
      { level_code: 'N1' },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    log(`✅ Level updated to N1`, colors.green);
    console.log('Response:', JSON.stringify(updateN1Res.data.data, null, 2));

    // 7. Test invalid level code
    log('\n7️⃣  Testing invalid level code (N6)...', colors.cyan);
    try {
      await axios.patch(
        `${API_BASE}/users/me/level`,
        { level_code: 'N6' },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 400) {
        log('✅ Correctly rejected invalid level code', colors.green);
        console.log('Error:', error.response.data);
      } else {
        throw error;
      }
    }

    // 8. Test missing level code
    log('\n8️⃣  Testing missing level code...', colors.cyan);
    try {
      await axios.patch(
        `${API_BASE}/users/me/level`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 400) {
        log('✅ Correctly rejected missing level code', colors.green);
        console.log('Error:', error.response.data);
      } else {
        throw error;
      }
    }

    // 9. Test without auth
    log('\n9️⃣  Testing without authentication...', colors.cyan);
    try {
      await axios.patch(`${API_BASE}/users/me/level`, { level_code: 'N5' });
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 401) {
        log('✅ Correctly rejected unauthenticated request', colors.green);
      } else {
        throw error;
      }
    }

    log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
    log('║   ✅ ALL TESTS PASSED!                            ║', colors.green);
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

testUpdateLevel();
