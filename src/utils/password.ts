/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Regras de senha do lado do cliente.
 *
 * O Supabase Auth é a autoridade final (inclusive quando a proteção
 * contra senhas vazadas está ativa). Estas regras apenas evitam que o
 * usuário escolha senhas óbvias antes de enviar ao servidor.
 */

export const MIN_PASSWORD_LENGTH = 8;

const COMMON_PASSWORDS = new Set([
  '123456',
  '1234567',
  '12345678',
  '123456789',
  '1234567890',
  '111111',
  '11111111',
  '000000',
  '00000000',
  '123123',
  '121212',
  '654321',
  'abc123',
  'abc12345',
  'qwerty',
  'qwerty123',
  'qwertyuiop',
  'senha',
  'senha123',
  'senha1234',
  'password',
  'password1',
  'password123',
  'admin',
  'admin123',
  'letmein',
  'iloveyou',
  'welcome',
  'welcome1',
  'monkey',
  'dragon',
  'espaco',
  'espaco123',
  'recuperacao',
  'saude123',
  'mudar123',
  '1q2w3e4r',
  'zaq12wsx',
  'asdfghjk',
  'brasil123',
  'familia',
]);

/**
 * Retorna uma mensagem de erro quando a senha não é aceitável,
 * ou `null` quando está tudo certo.
 */
export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Essa senha é muito comum e fácil de descobrir. Escolha outra.';
  }

  // Sequências repetidas como "11111111" ou "aaaaaaaa".
  if (/^(.)\1+$/.test(password)) {
    return 'Evite senhas com o mesmo caractere repetido.';
  }

  if (/^[0-9]+$/.test(password)) {
    return 'Use letras e números, não apenas dígitos.';
  }

  return null;
}
