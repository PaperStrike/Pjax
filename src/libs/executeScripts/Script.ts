/**
 * Follow
 * https://html.spec.whatwg.org/multipage/scripting.html#prepare-a-script
 * excluding steps concerning obsoleted attributes.
 */

/**
 * Regex for JavaScript MIME type strings.
 * @see [JavaScript MIME type | MIME Sniffing Standard]{@link https://mimesniff.spec.whatwg.org/#javascript-mime-type}
 */
export const MIMETypeRegex = /^((application|text)\/(x-)?(ecma|java)script|text\/(javascript1\.[0-5]|(j|live)script))$/;

export default class Script {
  declare target: HTMLScriptElement;

  declare type?: 'classic' | 'module';

  external = false;

  blocking = false;

  evaluable = false;

  constructor(scriptEle: HTMLScriptElement) {
    this.target = scriptEle;

    // Process empty.
    if (!scriptEle.hasAttribute('src') && !scriptEle.text) return;

    // Process type.
    const typeString = scriptEle.type ? scriptEle.type.trim().toLowerCase() : 'text/javascript';
    if (MIMETypeRegex.test(typeString)) {
      this.type = 'classic';
    } else if (typeString === 'module') {
      this.type = 'module';
    } else {
      return;
    }

    // Process no module.
    if (scriptEle.noModule && this.type === 'classic') {
      return;
    }

    // Process external.
    if (scriptEle.hasAttribute('src')) {
      const src = scriptEle.getAttribute('src');

      // An empty src attribute not results in external status
      // and the script is not executable.
      if (!src) return;

      this.external = true;

      try {
        // eslint-disable-next-line no-new
        new URL(src, document.URL);
      } catch {
        return;
      }
    }

    // Process blocking.
    this.blocking = true;
    if (this.type !== 'classic') {
      this.blocking = false;
    } else if (this.external) {
      if (scriptEle.hasAttribute('async')) {
        this.blocking = false;
      } else if (scriptEle.hasAttribute('defer')) {
        this.blocking = false;
      }
    }

    this.evaluable = true;
  }

  eval(): Promise<void> {
    return new Promise((resolve, reject) => {
      const oldEle = this.target;
      const newEle = document.createElement('script');

      newEle.addEventListener('error', reject);

      // Clone attributes and inner text.
      oldEle.getAttributeNames().forEach((name) => {
        newEle.setAttribute(name, oldEle.getAttribute(name) || '');
      });
      newEle.text = oldEle.text;

      if (this.external) {
        // Reset async of external scripts to force synchronous loading.
        // Needed since it defaults to true on dynamically injected scripts.
        if (!newEle.hasAttribute('async')) newEle.async = false;

        // Defer a dynamically inserted script is meaningless
        // and may cause the script not to be executed in some environments.
        newEle.defer = false;
      }

      // Execute.
      if (document.contains(oldEle)) {
        oldEle.replaceWith(newEle);
      } else {
        // Execute in <head> if it's not in current document.
        document.head.append(newEle);
        if (this.external) {
          newEle.addEventListener('load', () => newEle.remove());
        } else {
          newEle.remove();
        }
      }

      if (this.external) {
        newEle.addEventListener('load', () => resolve());
      } else {
        resolve();
      }
    });
  }
}
