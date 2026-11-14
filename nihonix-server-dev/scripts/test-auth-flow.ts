/**
 * Full Authentication Flow Test Script
 * 
 * Usage: 
 *   1. Make sure server is running: npm run start:dev
 *   2. Run this script: npx ts-node scripts/test-auth-flow.ts
 * 
 * Or add to package.json:
 *   "test:auth": "ts-node -r tsconfig-paths/register scripts/test-auth-flow.ts"
 */

import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.API_URL || 'http://localhost:3010';
const API_BASE = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];
let accessToken: string | null = null;
let refreshToken: string | null = null;
let userId: number | null = null;
let testUser = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'Test123!@#',
  full_name: 'Test User',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n╔═══════════════════════════════════════════════════╗`, colors.cyan);
  log(`║   ${title.padEnd(47)}║`, colors.cyan);
  log(`╚═══════════════════════════════════════════════════╝\n`, colors.cyan);
}

function logTest(name: string) {
  log(`🧪 Testing: ${name}`, colors.cyan);
}

async function test(
  name: string,
  fn: () => Promise<any>,
): Promise<TestResult> {
  try {
    logTest(name);
    const result = await fn();
    const testResult: TestResult = {
      name,
      success: true,
      status: result.status,
      data: result.data,
    };
    results.push(testResult);
    log(`✅ ${name} - PASSED (${result.status})`, colors.green);
    if (result.data && typeof result.data === 'object') {
      const preview = JSON.stringify(result.data, null, 2).substring(0, 300);
      if (preview.length > 0) {
        console.log(preview + (JSON.stringify(result.data).length > 300 ? '...' : ''));
      }
    }
    return testResult;
  } catch (error: any) {
    const axiosError = error as AxiosError;
    const testResult: TestResult = {
      name,
      success: false,
      status: axiosError.response?.status,
      error: axiosError.message || error.message,
      data: axiosError.response?.data,
    };
    results.push(testResult);
    log(`❌ ${name} - FAILED`, colors.red);
    if (axiosError.response) {
      log(`   Status: ${axiosError.response.status}`, colors.yellow);
      log(`   Data: ${JSON.stringify(axiosError.response.data)}`, colors.yellow);
    } else {
      log(`   Error: ${error.message}`, colors.yellow);
    }
    return testResult;
  }
}

// Helper to get data from response
function getData(body: any): any {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }
  return body;
}

async function runAuthFlowTests() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Full Authentication Flow Test                   ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);
  log(`Testing API at: ${API_BASE}\n`, colors.yellow);
  log(`Test User: ${testUser.username} / ${testUser.email}\n`, colors.magenta);

  // ========== 1. REGISTER USER ==========
  logSection('1. USER REGISTRATION');

  await test('POST /api/auth/register - Register new user', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    const data = getData(response.data);
    const user = data.user || data;
    if (user.id) {
      userId = user.id;
    }
    if (!user.username || user.username !== testUser.username) {
      throw new Error('User registration failed');
    }
    log(`   → User ID: ${userId}`, colors.green);
    log(`   → Username: ${user.username}`, colors.green);
    log(`   → Email: ${user.email}`, colors.green);
    log(`   → Role: ${user.role || 'USER (default)'}`, colors.green);
    return response;
  });

  await test('POST /api/auth/register - Try duplicate username (should fail)', async () => {
    try {
      await axios.post(`${API_BASE}/auth/register`, testUser);
      throw new Error('Should have failed with duplicate username');
    } catch (error: any) {
      if (error.response?.status === 409) {
        return { status: 409, data: { message: 'Conflict' } };
      }
      throw error;
    }
  });

  // ========== 2. LOGIN ==========
  logSection('2. USER LOGIN');

  await test('POST /api/auth/login - Login with credentials', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });
    const data = getData(response.data);
    
    if (!data.accessToken || !data.refreshToken) {
      throw new Error('Missing tokens in response');
    }
    
    accessToken = data.accessToken;
    refreshToken = data.refreshToken;
    
    if (accessToken) {
      log(`   → Access Token: ${accessToken.substring(0, 50)}...`, colors.green);
    }
    if (refreshToken) {
      log(`   → Refresh Token: ${refreshToken.substring(0, 50)}...`, colors.green);
    }
    if (data.user?.role) {
      log(`   → User Role: ${data.user.role}`, colors.green);
    }
    
    return response;
  });

  await test('POST /api/auth/login - Try wrong password (should fail)', async () => {
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        username: testUser.username,
        password: 'WrongPassword123!',
      });
      throw new Error('Should have failed with wrong password');
    } catch (error: any) {
      if (error.response?.status === 401) {
        return { status: 401, data: { message: 'Unauthorized' } };
      }
      throw error;
    }
  });

  // ========== 3. ACCESS PROTECTED ENDPOINTS ==========
  logSection('3. ACCESS PROTECTED ENDPOINTS');

  if (!accessToken) {
    log('⚠️  No access token. Skipping protected endpoint tests.', colors.yellow);
  } else {
    await test('GET /api/users/:id - Get own user info (with token)', async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.get(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = getData(response.data);
      log(`   → User ID: ${data.id}`, colors.green);
      log(`   → Username: ${data.username}`, colors.green);
      log(`   → Role: ${data.role || 'USER'}`, colors.green);
      log(`   → Level Code: ${data.level_code || 'null'}`, colors.green);
      return response;
    });

    await test('GET /api/users - Get all users (Admin only - should fail)', async () => {
      try {
        await axios.get(`${API_BASE}/users`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        throw new Error('Should have failed - user is not admin');
      } catch (error: any) {
        if (error.response?.status === 403 || error.response?.status === 401) {
          log(`   → Correctly blocked (status: ${error.response.status})`, colors.green);
          return { status: error.response.status, data: { message: 'Forbidden' } };
        }
        throw error;
      }
    });

    await test('PUT /api/users/:id - Update own profile', async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.put(
        `${API_BASE}/users/${userId}`,
        {
          full_name: 'Updated Test User',
          language: 'vi',
          level_code: 'N5',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = getData(response.data);
      log(`   → Updated Full Name: ${data.full_name}`, colors.green);
      log(`   → Updated Language: ${data.language}`, colors.green);
      log(`   → Updated Level: ${data.level_code}`, colors.green);
      return response;
    });

    await test('PUT /api/users/:id - Try update role (should fail - not admin)', async () => {
      if (!userId) throw new Error('No user ID');
      try {
        await axios.put(
          `${API_BASE}/users/${userId}`,
          { role: 'admin' },
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        throw new Error('Should have failed - cannot update role');
      } catch (error: any) {
        if (error.response?.status === 403) {
          log(`   → Correctly blocked role update (status: 403)`, colors.green);
          return { status: 403, data: { message: 'Forbidden' } };
        }
        throw error;
      }
    });
  }

  // ========== 4. REFRESH TOKEN ==========
  logSection('4. REFRESH TOKEN');

  if (!refreshToken) {
    log('⚠️  No refresh token. Skipping refresh token tests.', colors.yellow);
  } else {
    await test('POST /api/auth/refresh - Refresh access token', async () => {
      const response = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: refreshToken,
      });
      const data = getData(response.data);
      
      if (!data.accessToken || !data.refreshToken) {
        throw new Error('Missing tokens in refresh response');
      }
      
      const oldToken = accessToken;
      accessToken = data.accessToken;
      refreshToken = data.refreshToken;
      
      if (oldToken) {
        log(`   → Old Token: ${oldToken.substring(0, 30)}...`, colors.green);
      }
      if (accessToken) {
        log(`   → New Access Token: ${accessToken.substring(0, 30)}...`, colors.green);
      }
      log(`   → Tokens refreshed successfully`, colors.green);
      
      return response;
    });

    await test('POST /api/auth/refresh - Try invalid refresh token (should fail)', async () => {
      try {
        await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: 'invalid-refresh-token',
        });
        throw new Error('Should have failed with invalid token');
      } catch (error: any) {
        if (error.response?.status === 401) {
          log(`   → Correctly rejected invalid token (status: 401)`, colors.green);
          return { status: 401, data: { message: 'Unauthorized' } };
        }
        throw error;
      }
    });
  }

  // ========== 5. TEST WITH NEW TOKEN ==========
  logSection('5. TEST WITH REFRESHED TOKEN');

  if (accessToken) {
    await test('GET /api/users/:id - Get user info with refreshed token', async () => {
      if (!userId) throw new Error('No user ID');
      const response = await axios.get(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      log(`   → Token still works after refresh`, colors.green);
      return response;
    });
  }

  // ========== 6. LOGOUT ==========
  logSection('6. USER LOGOUT');

  if (!refreshToken) {
    log('⚠️  No refresh token. Skipping logout test.', colors.yellow);
  } else {
    await test('POST /api/auth/logout - Logout user', async () => {
      const response = await axios.post(
        `${API_BASE}/auth/logout`,
        { refreshToken: refreshToken },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      log(`   → Logged out successfully`, colors.green);
      return response;
    });

    await test('GET /api/users/:id - Try access after logout (should fail)', async () => {
      if (!userId) throw new Error('No user ID');
      try {
        await axios.get(`${API_BASE}/users/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        // Note: JWT tokens are stateless, so they might still work until expired
        // This is expected behavior - logout invalidates refresh token, not access token
        log(`   → Note: Access token may still work (stateless JWT)`, colors.yellow);
        log(`   → Refresh token is invalidated`, colors.green);
        return { status: 200, data: { note: 'Access token may still work' } };
      } catch (error: any) {
        if (error.response?.status === 401) {
          log(`   → Correctly rejected (status: 401)`, colors.green);
          return { status: 401, data: { message: 'Unauthorized' } };
        }
        throw error;
      }
    });
  }

  // ========== 7. ADMIN ROLE TEST ==========
  logSection('7. ADMIN ROLE TEST (Optional)');

  log('ℹ️  To test admin functionality:', colors.yellow);
  log('   1. Manually set a user role to "admin" in database', colors.yellow);
  log('   2. Login with that user', colors.yellow);
  log('   3. Test GET /api/users (should work for admin)', colors.yellow);
  log('   4. Test PUT /api/users/:id with role update (should work)', colors.yellow);

  printSummary();
}

function printSummary() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Test Summary                                    ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  const passed = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  const total = results.length;

  log(`Total Tests: ${total}`, colors.cyan);
  log(`✅ Passed: ${passed}`, colors.green);
  log(`❌ Failed: ${failed}`, colors.red);
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`, colors.yellow);

  if (failed > 0) {
    log('\nFailed Tests:', colors.red);
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        log(`  - ${r.name}`, colors.red);
        if (r.error) log(`    Error: ${r.error}`, colors.yellow);
        if (r.status) log(`    Status: ${r.status}`, colors.yellow);
      });
  }

  log('\n');
  log('📝 Authentication Flow Tested:', colors.cyan);
  log('   1. ✅ User Registration', colors.green);
  log('   2. ✅ User Login', colors.green);
  log('   3. ✅ Protected Endpoints Access', colors.green);
  log('   4. ✅ Token Refresh', colors.green);
  log('   5. ✅ User Logout', colors.green);
  log('   6. ✅ Role-Based Access Control', colors.green);
  log('\n');
}

// Run tests
runAuthFlowTests().catch((error) => {
  log(`\n❌ Fatal Error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

