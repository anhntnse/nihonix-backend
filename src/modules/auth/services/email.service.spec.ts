import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('Verification SMTP handoff', () => {
  let service: EmailService;
  let sendMail: jest.Mock;
  let logs: jest.SpyInstance;
  let errors: jest.SpyInstance;
  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({ accepted: ['learner@example.test'], rejected: [], messageId: 'test-id' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    const values: Record<string, unknown> = { 'email.host': 'smtp.example.test', 'email.port': 587, 'email.secure': false,
      'email.user': 'sender@example.test', 'email.password': 'private-test-password', 'email.fromEmail': 'sender@example.test' };
    service = new EmailService({ get: (key: string) => values[key] } as ConfigService);
    logs = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    errors = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());
  it('submits OTP through the existing transporter and records provider acceptance', async () => {
    await service.sendEmailVerificationCode('learner@example.test', '123456', 'request-test');
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'sender@example.test', to: 'learner@example.test', text: expect.stringContaining('123456'),
    }));
    expect(logs.mock.calls.flat().join(' ')).toContain('smtp.verification_accepted');
    expect(logs.mock.calls.flat().join(' ')).not.toMatch(/123456|private-test-password|learner@example.test/);
  });
  it('rejects a submission with no accepted recipient', async () => {
    sendMail.mockResolvedValue({ accepted: [], rejected: ['learner@example.test'] });
    await expect(service.sendEmailVerificationCode('learner@example.test', '123456')).rejects.toMatchObject({ code: 'ERECIPIENT' });
  });
  it('preserves SMTP error codes and logs no raw provider message, OTP or credentials', async () => {
    const error = Object.assign(new Error('private-test-password 123456'), { code: 'EAUTH', responseCode: 535 });
    sendMail.mockRejectedValue(error);
    await expect(service.sendEmailVerificationCode('learner@example.test', '123456', 'request-test')).rejects.toBe(error);
    const output = errors.mock.calls.flat().join(' ');
    expect(output).toContain('EAUTH');
    expect(output).toContain('535');
    expect(output).not.toMatch(/123456|private-test-password|learner@example.test/);
  });
});
