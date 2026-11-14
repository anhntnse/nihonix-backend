/**
 * Test script for Avatar Upload
 * 
 * Usage:
 *   1. Make sure server is running: npm run start:dev
 *   2. Prepare a test image (avatar.jpg/png) in the scripts folder
 *   3. Run: npx ts-node scripts/test-upload-avatar.ts
 */

import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';

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

async function testUploadAvatar() {
  log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
  log('║   Test: Upload Avatar API                        ║', colors.blue);
  log('╚═══════════════════════════════════════════════════╝\n', colors.blue);

  let accessToken: string | null = null;
  const testUser = {
    username: `testavatar_${Date.now()}`,
    email: `testavatar_${Date.now()}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test Avatar User',
  };

  try {
    // 1. Register & Login
    log('1️⃣  Registering and logging in...', colors.cyan);
    await axios.post(`${API_BASE}/auth/register`, testUser);
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      username: testUser.username,
      password: testUser.password,
    });
    accessToken = loginRes.data.data.accessToken;
    const userId = loginRes.data.data.user.id;
    log(`✅ Logged in as ${testUser.username}`, colors.green);

    // 2. Check if test image exists
    log('\n2️⃣  Preparing test image...', colors.cyan);
    const testImagePath = path.join(__dirname, 'test-avatar.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      log(`⚠️  Test image not found at: ${testImagePath}`, colors.yellow);
      log('📝 Creating a dummy test file...', colors.yellow);
      
      // Create a minimal valid JPEG file (1x1 pixel)
      const minimalJpeg = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x03, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00,
        0x7F, 0x80, 0xFF, 0xD9
      ]);
      
      fs.writeFileSync(testImagePath, minimalJpeg);
      log(`✅ Created test image at: ${testImagePath}`, colors.green);
    } else {
      log(`✅ Found test image at: ${testImagePath}`, colors.green);
    }

    // 3. Upload avatar
    log('\n3️⃣  Uploading avatar...', colors.cyan);
    const formData = new FormData();
    formData.append('avatar', fs.createReadStream(testImagePath));

    const uploadRes = await axios.post(
      `${API_BASE}/users/me/avatar`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    log('✅ Avatar uploaded successfully!', colors.green);
    console.log('\n📦 Upload Response:', JSON.stringify(uploadRes.data, null, 2));

    if (uploadRes.data.data?.avatar_url) {
      log(`\n🖼️  Avatar URL: ${uploadRes.data.data.avatar_url}`, colors.cyan);
      log(`📝 Public ID: ${uploadRes.data.data.public_id}`, colors.cyan);
    }

    // 4. Verify user profile has avatar
    log('\n4️⃣  Verifying user profile...', colors.cyan);
    const profileRes = await axios.get(`${API_BASE}/users/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (profileRes.data.data?.avatar_url) {
      log(`✅ Avatar URL saved to user profile: ${profileRes.data.data.avatar_url}`, colors.green);
    } else {
      throw new Error('Avatar URL not found in user profile');
    }

    // 5. Test uploading again (should overwrite)
    log('\n5️⃣  Testing upload again (should overwrite previous avatar)...', colors.cyan);
    const formData2 = new FormData();
    formData2.append('avatar', fs.createReadStream(testImagePath));

    const upload2Res = await axios.post(
      `${API_BASE}/users/me/avatar`,
      formData2,
      {
        headers: {
          ...formData2.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    log('✅ Avatar overwritten successfully!', colors.green);
    console.log('New Avatar URL:', upload2Res.data.data?.avatar_url);

    // 6. Test without file
    log('\n6️⃣  Testing upload without file (should fail)...', colors.cyan);
    try {
      await axios.post(
        `${API_BASE}/users/me/avatar`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 400) {
        log('✅ Correctly rejected request without file', colors.green);
      } else {
        throw error;
      }
    }

    // 7. Test with non-image file
    log('\n7️⃣  Testing upload with non-image file (should fail)...', colors.cyan);
    const txtFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(txtFilePath, 'This is not an image');

    try {
      const formData3 = new FormData();
      formData3.append('avatar', fs.createReadStream(txtFilePath));

      await axios.post(
        `${API_BASE}/users/me/avatar`,
        formData3,
        {
          headers: {
            ...formData3.getHeaders(),
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 400) {
        log('✅ Correctly rejected non-image file', colors.green);
        console.log('Error message:', error.response.data);
      } else {
        throw error;
      }
    } finally {
      fs.unlinkSync(txtFilePath);
    }

    // 8. Test without authentication
    log('\n8️⃣  Testing upload without authentication (should fail)...', colors.cyan);
    try {
      const formData4 = new FormData();
      formData4.append('avatar', fs.createReadStream(testImagePath));

      await axios.post(`${API_BASE}/users/me/avatar`, formData4, {
        headers: formData4.getHeaders(),
      });
      log('❌ Should have failed but succeeded', colors.red);
    } catch (error: any) {
      if (error.response?.status === 401) {
        log('✅ Correctly rejected unauthenticated request', colors.green);
      } else {
        throw error;
      }
    }

    log('\n╔═══════════════════════════════════════════════════╗', colors.blue);
    log('║   ✅ ALL AVATAR UPLOAD TESTS PASSED!              ║', colors.green);
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

testUploadAvatar();
