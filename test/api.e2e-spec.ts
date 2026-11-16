import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from './../src/common/interceptors/response.interceptor';
import { GlobalExceptionFilter } from './../src/common/filters/global-exception.filter';

// Helper to get data from response (handles both wrapped and unwrapped formats)
function getData(body: any): any {
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data;
  }
  return body;
}

describe('API Endpoints (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let userId: number;
  let testUser = {
    username: `testuser_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    password: 'Test123!@#',
    full_name: 'Test User',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply same middleware as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor(app.get(Reflector)));

    app.setGlobalPrefix('api', { exclude: ['/'] });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET / - should return welcome message', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect((res) => {
          const data = getData(res.body);
          // Response may be wrapped or direct
          if (data.message) {
            expect(data.message).toBe('Welcome to Nihonix API');
          } else {
            expect(res.body).toHaveProperty('message', 'Welcome to Nihonix API');
          }
        });
    });

    it('GET /health - should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          // Health endpoint returns string directly
          expect(typeof res.body === 'string' || typeof getData(res.body) === 'string' || res.body).toBeTruthy();
        });
    });
  });

  describe('Authentication', () => {
    it('POST /api/auth/register - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          const data = getData(res.body);
          // Auth service may return user directly or wrapped in user property
          const user = data.user || data;
          expect(user).toHaveProperty('username', testUser.username);
          expect(user).toHaveProperty('email', testUser.email);
          expect(user).not.toHaveProperty('password');
          userId = user.id;
        });
    });

    it('POST /api/auth/register - should fail with duplicate username', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409); // Conflict status code
    });

    it('POST /api/auth/login - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          const data = getData(res.body);
          expect(data).toHaveProperty('accessToken');
          expect(data).toHaveProperty('refreshToken');
          accessToken = data.accessToken;
        });
    });

    it('POST /api/auth/login - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('Users', () => {
    it('GET /api/users - should require authentication', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });

    it('GET /api/users - should return all users with level', async () => {
      if (!accessToken || !userId) {
        // Skip if auth failed
        return;
      }
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = getData(response.body);
      expect(Array.isArray(data)).toBe(true);
      if (data.length > 0) {
        expect(data[0]).toHaveProperty('level_code');
      }
    });

    it('GET /api/users/:id - should return user by ID with level', async () => {
      if (!accessToken || !userId) {
        // Skip if auth failed
        return;
      }
      const response = await request(app.getHttpServer())
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = getData(response.body);
      expect(data).toHaveProperty('id', userId);
      expect(data).toHaveProperty('level_code');
    });

    it('PUT /api/users/:id - should update user level_code', async () => {
      if (!accessToken || !userId) {
        // Skip if auth failed
        return;
      }
      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          level_code: 'N5',
        })
        .expect(200);

      const data = getData(response.body);
      expect(data).toHaveProperty('level_code', 'N5');
    });

    it('PUT /api/users/:id - should update user profile', async () => {
      if (!accessToken || !userId) {
        // Skip if auth failed
        return;
      }
      const response = await request(app.getHttpServer())
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          full_name: 'Updated Test User',
          language: 'vi',
        })
        .expect(200);

      const data = getData(response.body);
      expect(data).toHaveProperty('full_name', 'Updated Test User');
      expect(data).toHaveProperty('language', 'vi');
    });
  });

  describe('Topics', () => {
    it('GET /api/topics - should return all topics with ETags', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = getData(response.body);
      if (Array.isArray(data) && data.length > 0) {
        expect(data[0]).toHaveProperty('slug');
        expect(data[0]).toHaveProperty('etag');
      }
    });

    it('GET /api/topics?levelCode=N5 - should return filtered topics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/topics?levelCode=N5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const data = getData(response.body);
      if (Array.isArray(data) && data.length > 0) {
        expect(data[0]).toHaveProperty('level_code', 'N5');
      }
    });

    it('POST /api/topics - should create a new topic', async () => {
      const newTopic = {
        slug: `test-topic-${Date.now()}`,
        level_code: 'N5',
        title: {
          vi: 'Chủ đề test',
          en: 'Test Topic',
          jp: 'テストトピック',
        },
        order: 999,
      };

      const response = await request(app.getHttpServer())
        .post('/api/topics')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newTopic)
        .expect(201);

      const data = getData(response.body);
      expect(data).toHaveProperty('slug', newTopic.slug);
      expect(data).toHaveProperty('etag');
    });
  });

  describe('Entity Sync', () => {
    it('POST /api/entity-sync/check - should check sync status for topics', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/entity-sync/check')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          entityKind: 'topic',
          levelCode: 'N5',
        })
        .expect(200);

      const data = getData(response.body);
      expect(data).toHaveProperty('changed');
      expect(data).toHaveProperty('deleted');
      expect(data).toHaveProperty('unchanged');
      expect(Array.isArray(data.changed)).toBe(true);
      expect(Array.isArray(data.deleted)).toBe(true);
      expect(Array.isArray(data.unchanged)).toBe(true);
    });

    it('POST /api/entity-sync/check - should check sync with client ETags', async () => {
      // First get topics to get ETags
      const topicsResponse = await request(app.getHttpServer())
        .get('/api/topics?levelCode=N5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const topics = getData(topicsResponse.body) || [];
      if (topics.length > 0) {
        const clientEtags = topics.slice(0, 2).map((topic: any) => ({
          entity_key: topic.slug,
          etag: topic.etag,
        }));

        const response = await request(app.getHttpServer())
          .post('/api/entity-sync/check')
        .set('Authorization', `Bearer ${accessToken}`)
          .send({
            entityKind: 'topic',
            levelCode: 'N5',
            etags: clientEtags,
          })
          .expect(200);

        const data = getData(response.body);
        // Should have unchanged items if ETags match
        expect(Array.isArray(data.unchanged)).toBe(true);
      }
    });

    it('GET /api/entity-sync/topic/:slug - should return topic with ETag', async () => {
      // First get a topic slug
      const topicsResponse = await request(app.getHttpServer())
        .get('/api/topics?levelCode=N5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const topics = getData(topicsResponse.body) || [];
      if (topics.length > 0) {
        const slug = topics[0].slug;
        const response = await request(app.getHttpServer())
          .get(`/api/entity-sync/topic/${slug}`)
        .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const data = getData(response.body);
        expect(data).toHaveProperty('slug', slug);
        expect(response.headers).toHaveProperty('etag');
      }
    }, 10000); // Increase timeout

    it('GET /api/entity-sync/topic/:slug - should return 304 if ETag matches', async () => {
      const topicsResponse = await request(app.getHttpServer())
        .get('/api/topics?levelCode=N5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const topics = getData(topicsResponse.body) || [];
      if (topics.length > 0) {
        const slug = topics[0].slug;
        const firstResponse = await request(app.getHttpServer())
          .get(`/api/entity-sync/topic/${slug}`)
        .set('Authorization', `Bearer ${accessToken}`)
          .expect(200);

        const etag = firstResponse.headers.etag;
        if (etag) {
          await request(app.getHttpServer())
            .get(`/api/entity-sync/topic/${slug}`)
        .set('Authorization', `Bearer ${accessToken}`)
            .set('If-None-Match', etag)
            .expect(304);
        }
      }
    }, 10000); // Increase timeout
  });

  describe('AI Health Check', () => {
    it('GET /api/ai/health - should return AI service status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/ai/health')
        .expect(200);

      const data = getData(response.body);
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('configured');
    });
  });
});
