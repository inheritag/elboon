import { describe, expect, it } from 'vitest';
import { parseSupportMessage } from './support';

describe('parseSupportMessage', () => {
  it('keeps a reply address and the message', () => {
    expect(parseSupportMessage('  ada@elboon.test ', '  Where is my order? ')).toEqual({
      email: 'ada@elboon.test',
      message: 'Where is my order?'
    });
  });

  it('refuses a blank message or an address we cannot reply to', () => {
    expect(parseSupportMessage('ada', 'Hello there')).toEqual({ error: 'Enter an email we can reply to.' });
    expect(parseSupportMessage('ada@elboon.test', ' ')).toEqual({ error: 'Write a message.' });
    expect(parseSupportMessage('ada@elboon.test', 'x'.repeat(4001))).toEqual({ error: 'That message is too long.' });
  });
});