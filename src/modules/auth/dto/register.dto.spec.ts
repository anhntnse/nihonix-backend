import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  const account = {
    username: 'selftest',
    email: 'selftest@example.com',
    password: 'password123',
  };

  it('accepts registration without the optional full name', async () => {
    const errors = await validate(plainToInstance(RegisterDto, account));
    expect(errors).toEqual([]);
  });

  it('rejects a non-string full name', async () => {
    const errors = await validate(plainToInstance(RegisterDto, { ...account, full_name: 123 }));
    expect(errors.some((error) => error.property === 'full_name')).toBe(true);
  });
});
