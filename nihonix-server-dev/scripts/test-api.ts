/**
 * Simple API Test Script
 * 
 * Usage: 
 *   1. Make sure server is running: npm run start:dev
 *   2. Run this script: npx ts-node scripts/test-api.ts
 * 
 * Or add to package.json:
 *   "test:api": "ts-node scripts/test-api.ts"
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
};

interface TestResult {
  name: string;
  success: boolean;
  status?: number;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name: string) {
  log(`\n🧪 Testing: ${name}`, colors.cyan);
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
      console.log(JSON.stringify(result.data, null, 2).substring(0, 200) + '...');
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

async function runTests() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Nihonix API Test Script                          ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);
  log(`Testing API at: ${API_BASE}\n`, colors.yellow);

  let accessToken: string | null = null;
  let userId: number | null = null;
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test User',
  };

  // Health Checks
  await test('GET / - Health Check', async () => {
    const response = await axios.get(`${BASE_URL}/`);
    if (!response.data.message) throw new Error('Missing message');
    return response;
  });

  await test('GET /health - Health Status', async () => {
    return axios.get(`${BASE_URL}/health`);
  });

  // Authentication
  await test('POST /api/auth/register - Register User', async () => {
    const response = await axios.post(`${API_BASE}/auth/register`, testUser);
    if (response.data?.data?.user) {
      userId = response.data.data.user.id;
      // Verify full user data in register response
      if (!('level_code' in response.data.data.user)) {
        throw new Error('Register response missing level_code field');
      }
      if (!('language' in response.data.data.user)) {
        throw new Error('Register response missing language field');
      }
    }
    return response;
  });

  await test('POST /api/auth/login - Login', async () => {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });
    if (response.data?.data?.accessToken) {
      accessToken = response.data.data.accessToken;
    }
    // Verify full user data in login response
    if (response.data?.data?.user) {
      if (!('level_code' in response.data.data.user)) {
        throw new Error('Login response missing level_code field');
      }
      if (!('language' in response.data.data.user)) {
        throw new Error('Login response missing language field');
      }
      if (!('avatar_url' in response.data.data.user)) {
        throw new Error('Login response missing avatar_url field');
      }
    }
    return response;
  });

  if (!accessToken) {
    log('\n⚠️  No access token obtained. Skipping authenticated tests.', colors.yellow);
    printSummary();
    return;
  }

  // Users (with level_code)
  await test('GET /api/users - Get All Users (with level)', async () => {
    const response = await axios.get(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (Array.isArray(response.data?.data)) {
      const user = response.data.data[0];
      if (user && !('level_code' in user)) {
        throw new Error('User missing level_code field');
      }
    }
    return response;
  });

  if (userId) {
    await test('GET /api/users/:id - Get User by ID (with level)', async () => {
      const response = await axios.get(`${API_BASE}/users/${userId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.data?.data?.level_code && response.data?.data?.level_code !== null) {
        throw new Error('User missing level_code field');
      }
      return response;
    });

    await test('PUT /api/users/:id - Update User Level', async () => {
      const response = await axios.put(
        `${API_BASE}/users/${userId}`,
        { level_code: 'N5' },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (response.data?.data?.level_code !== 'N5') {
        throw new Error('Level not updated correctly');
      }
      return response;
    });

    await test('PUT /api/users/:id - Update User Profile', async () => {
      return axios.put(
        `${API_BASE}/users/${userId}`,
        {
          full_name: 'Updated Test User',
          language: 'vi',
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
    });
  }

  // Topics
  await test('GET /api/topics - Get All Topics (with ETags)', async () => {
    const response = await axios.get(`${API_BASE}/topics`);
    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      const topic = response.data.data[0];
      if (!topic.etag) {
        throw new Error('Topic missing etag');
      }
    }
    return response;
  });

  await test('GET /api/topics?levelCode=N5 - Get Topics by Level', async () => {
    const response = await axios.get(`${API_BASE}/topics?levelCode=N5`);
    if (Array.isArray(response.data?.data) && response.data.data.length > 0) {
      const topic = response.data.data[0];
      if (topic.level_code !== 'N5') {
        throw new Error('Filtered topic has wrong level_code');
      }
    }
    return response;
  });

  // Entity Sync
  await test('POST /api/entity-sync/check - Check Sync (Topics)', async () => {
    const response = await axios.post(`${API_BASE}/entity-sync/check`, {
      entityKind: 'topic',
      levelCode: 'N5',
    });
    if (!response.data?.data?.changed || !Array.isArray(response.data.data.changed)) {
      throw new Error('Invalid sync response structure');
    }
    return response;
  });

  // Get a topic slug for single entity test
  let topicSlug: string | null = null;
  try {
    const topicsRes = await axios.get(`${API_BASE}/topics?levelCode=N5`);
    if (Array.isArray(topicsRes.data?.data) && topicsRes.data.data.length > 0) {
      topicSlug = topicsRes.data.data[0].slug;
    }
  } catch (e) {
    // Ignore
  }

  if (topicSlug) {
    await test(`GET /api/entity-sync/topic/:slug - Get Single Topic with ETag`, async () => {
      const response = await axios.get(`${API_BASE}/entity-sync/topic/${topicSlug}`);
      if (!response.headers.etag) {
        throw new Error('Missing ETag header');
      }
      return response;
    });

    await test(`GET /api/entity-sync/topic/:slug - 304 Not Modified`, async () => {
      // First request to get ETag
      const firstResponse = await axios.get(`${API_BASE}/entity-sync/topic/${topicSlug}`);
      const etag = firstResponse.headers.etag;

      if (!etag) {
        throw new Error('No ETag from first request');
      }

      // Second request with If-None-Match
      try {
        const response = await axios.get(`${API_BASE}/entity-sync/topic/${topicSlug}`, {
          headers: { 'If-None-Match': etag },
          validateStatus: (status) => status === 304 || status === 200,
        });
        if (response.status === 304) {
          return { status: 304, data: 'Not Modified' };
        }
        throw new Error('Expected 304 but got ' + response.status);
      } catch (error: any) {
        if (error.response?.status === 304) {
          return { status: 304, data: 'Not Modified' };
        }
        throw error;
      }
    });
  }

  // AI Health
  await test('GET /api/ai/health - AI Health Check', async () => {
    const response = await axios.get(`${API_BASE}/ai/health`);
    if (!response.data?.data?.status) {
      throw new Error('Invalid AI health response');
    }
    return response;
  });

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
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Fatal Error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

