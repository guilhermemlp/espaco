/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Tema claro/escuro.
 *
 * A preferência "de verdade" vive nas preferências do usuário (local ou
 * nuvem). Como as da nuvem só chegam depois de uma chamada assíncrona,
 * espelhamos a última escolha no localStorage para que o script inline do
 * index.html aplique a classe `.dark` antes do primeiro paint — sem flash.
 *
 * Importante: a string da chave também aparece em index.html. Se mudar aqui,
 * mude lá.
 */
export const THEME_MIRROR_KEY = 'espaco.theme';

/** Cor da barra do navegador (mobile) por tema. */
export const THEME_COLORS = {
  light: '#faf8f4',
  dark: '#141210',
} as const;
