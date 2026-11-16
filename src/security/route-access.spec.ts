import 'reflect-metadata';
import {Controller, Post, RequestMethod} from '@nestjs/common';
import {GUARDS_METADATA, METHOD_METADATA, MODULE_METADATA, PATH_METADATA} from '@nestjs/common/constants';
import {MetadataScanner} from '@nestjs/core';
import {AppModule} from '../app.module';
import {JwtAuthGuard} from '../modules/auth/guards/jwt-auth.guard';
import {RolesGuard} from '../common/guards/roles.guard';
import {ROLES_KEY} from '../common/decorators/roles.decorator';

type Route = {key: string; guards: unknown[]; roles: string[]};
// D02 accepted by the user: authenticated-only catalog per BR-001.
// Every exception is an exact route: a new controller does not inherit a public prefix.
const publicRoutes = new Set([
  'GET /', 'GET /health', 'GET /app/config', 'GET /ai/health',
  ...['register','login','refresh','forgot-password','verify-reset-code','reset-password',
    'resend-code','verify-email','request-email-verification'].map(p => 'POST /auth/' + p),
  // D02 accepted: catalog and entity-sync now require a valid login.
]);
const adminRoutes = new Set([
  'GET /users', 'POST /topics', 'POST /topics/seed', 'POST /vocabulary-sets',
  'POST /vocabulary-items/generate', 'POST /grammar-patterns/generate',
]);

async function controllersFrom(root: unknown, seen = new Set<unknown>()): Promise<Set<any>> {
  const entry: any = await root;
  if (!entry || seen.has(entry)) return new Set();
  seen.add(entry);
  if (entry.forwardRef) return controllersFrom(entry.forwardRef(), seen);
  const type = entry.module ?? entry;
  const controllers = new Set<any>([
    ...(Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, type) ?? []), ...(entry.controllers ?? []),
  ]);
  const imports = [...(Reflect.getMetadata(MODULE_METADATA.IMPORTS, type) ?? []), ...(entry.imports ?? [])];
  for (const child of imports) for (const controller of await controllersFrom(child, seen)) controllers.add(controller);
  return controllers;
}
function routesFrom(controllers: Iterable<any>): Route[] {
  const routes: Route[] = [];
  for (const controller of controllers) {
    const prefixes = [Reflect.getMetadata(PATH_METADATA, controller) ?? ''].flat();
    for (const name of new MetadataScanner().getAllMethodNames(controller.prototype)) {
      const method = controller.prototype[name];
      const verb = Reflect.getMetadata(METHOD_METADATA, method);
      if (verb === undefined) continue;
      const paths = [Reflect.getMetadata(PATH_METADATA, method) ?? ''].flat();
      for (const prefix of prefixes) for (const path of paths) {
        routes.push({
          key: RequestMethod[verb] + ' /' + [prefix, path].join('/').split('/').filter(Boolean).join('/'),
          guards: [...(Reflect.getMetadata(GUARDS_METADATA, controller) ?? []), ...(Reflect.getMetadata(GUARDS_METADATA, method) ?? [])],
          roles: Reflect.getMetadata(ROLES_KEY, method) ?? Reflect.getMetadata(ROLES_KEY, controller) ?? [],
        });
      }
    }
  }
  return routes.sort((a,b) => a.key.localeCompare(b.key));
}
function violations(routes: Route[]): string[] {
  return routes.flatMap(route => {
    if (!publicRoutes.has(route.key) && !route.guards.includes(JwtAuthGuard)) return [route.key + ': JWT guard missing'];
    if (adminRoutes.has(route.key) && (!route.guards.includes(RolesGuard) || route.roles.length !== 1 || route.roles[0] !== 'admin'))
      return [route.key + ': Admin guard/role missing'];
    return [];
  });
}

describe('registered route exposure policy', () => {
  it('checks every controller imported by the real application without starting providers or a database', async () => {
    const controllers = await controllersFrom(AppModule);
    const routes = routesFrom(controllers);
    expect(controllers.size).toBeGreaterThanOrEqual(20);
    expect(routes.length).toBeGreaterThan(60);
    expect(violations(routes)).toEqual([]);
    expect(routes.filter(r => !r.guards.includes(JwtAuthGuard)).map(r => r.key).sort())
      .toEqual([...publicRoutes].sort());
    expect(routes.filter(r => r.guards.includes(RolesGuard)).map(r => r.key).sort())
      .toEqual([...adminRoutes].sort());
    console.log('Route exposure inventory (' + routes.length + '):\n' +
      routes.map(r => r.key + ' | ' + (r.guards.includes(JwtAuthGuard) ? (r.roles.includes('admin') ? 'admin' : 'authenticated/owner') : 'public')).join('\n'));
  });

  it('rejects an accidentally public route in a newly added controller', () => {
    @Controller('unreviewed')
    class Probe { @Post() create() { return {}; } }
    expect(violations(routesFrom([Probe]))).toEqual(['POST /unreviewed: JWT guard missing']);
  });

  it('rejects widening an Admin-only route to ordinary users', () => {
    expect(violations([{key:'POST /topics',guards:[JwtAuthGuard,RolesGuard],roles:['admin','user']}]))
      .toEqual(['POST /topics: Admin guard/role missing']);
  });

  it('rejects an admin route that loses its role guard', () => {
    expect(violations([{key:'POST /topics',guards:[JwtAuthGuard],roles:['admin']}]))
      .toEqual(['POST /topics: Admin guard/role missing']);
  });
});
