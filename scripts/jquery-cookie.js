/**
 * @typedef {{
 *  expires?: Date | number;
 *  path?: string;
 *  domain?: string;
 *  secure?: boolean;
 * }} Options
 */

const pluses = /\+/g;
/**
 * @param  {string} s
 * @returns {string}
 */
function encode(s) {
  return encodeURIComponent(s);
}

/**
 * @param {string} s
 * @returns {string}
 */
function decode(s) {
  return decodeURIComponent(s);
}

/**
 * @template {{}} T
 * @param  {T} value
 * @returns {string}
 */
function stringifyCookieValue(value) {
  return encode(JSON.stringify(value));
}

/**
 * @template T
 * @param {string} s
 * @returns {T}
 */
function parseCookieValue(s) {
  if (s.indexOf('"') === 0) {
    // This is a quoted cookie as according to RFC2068, unescape...
    s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }

  // Replace server-side written pluses with spaces.
  // If we can't decode the cookie, ignore it, it's unusable.
  // If we can't parse the cookie, ignore it, it's unusable.
  s = decodeURIComponent(s.replace(pluses, ' '));
  return JSON.parse(s);
}

/**
 * @template T
 * @param {string} key
 * @returns {T | undefined}
 */
function read(key) {
  // Read

  /** @type {T | undefined} */
  let result = undefined;

  // To prevent the for loop in the first place assign an empty array
  // in case there are no cookies at all. Also prevents odd result when
  // calling $.cookie().
  const cookies = document.cookie ? document.cookie.split('; ') : [];

  for (let i = 0, l = cookies.length; i < l; i++) {
    const parts = cookies[i].split('=');
    const name = decode(/** @type string */ (parts.shift()));
    const cookie = parts.join('=');

    if (key && key === name) {
      result = parseCookieValue(cookie);
      break;
    }

    // Prevent storing a cookie that we couldn't decode.
    if (!key) {
      const readCookie = parseCookieValue(cookie);
      if (readCookie != null) {
        if (result == null) {
          result = /** @type T */ ({});
        }
        result[/** @type {keyof T} */ (name)] = readCookie;
      }
    }
  }

  return result;
}

/**
 * @template T
 * @param {string} key
 * @param {T} value
 * @param {Options} options
 * @returns {void}
 */
function write(key, value, options) {
  if (typeof options.expires === 'number') {
    const days = options.expires,
      t = (options.expires = new Date());
    t.setTime(+t + days * 864e5);
  }

  document.cookie = [
    encode(key),
    '=',
    stringifyCookieValue(value),
    options.expires ? `; expires=${options.expires.toUTCString()}` : '', // use expires attribute, max-age is not supported by IE
    options.path ? `; path=${options.path}` : '',
    options.domain ? `; domain=${options.domain}` : '',
    options.secure ? '; secure' : '',
  ].join('');
}

export default {
  read,
  write,
};
