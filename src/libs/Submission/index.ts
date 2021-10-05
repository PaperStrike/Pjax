const capitalize = <T extends string>(str: T) => (
  `${str.charAt(0).toUpperCase()}${str.slice(1)}` as Capitalize<T>
);

type FormContentAttributeNames = 'action' | 'enctype' | 'method' | 'target';

class Submission {
  declare form: HTMLFormElement;

  /**
   * The "submitter button" must be a <button>, an <input>, or null.
   * The HTML Standard didn't state this directly, but we can still tell this by reading
   * through the elements and functions that can trigger a submission in the standard.
   * @see [Concept submit button | HTML Standard]{@link https://html.spec.whatwg.org/multipage/forms.html#concept-submit-button}
   */
  declare submitterButton: HTMLButtonElement | HTMLInputElement | null;

  /**
   * Parse the basic facilities that will be frequently used in the submission.
   * @see [Form submission algorithm | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm}
   */
  constructor(form: HTMLFormElement, submitter: HTMLElement | null) {
    this.form = form;

    this.submitterButton = submitter === form
      ? null
      : submitter as HTMLButtonElement | HTMLInputElement | null;
  }

  /**
   * Parse submission related content attributes.
   * @see [Form submission attributes | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-attributes}
   */
  getAttribute(name: FormContentAttributeNames): string {
    const { submitterButton, form } = this;
    if (submitterButton && submitterButton.hasAttribute(`form${name}`)) {
      const overrideValue = submitterButton[`form${capitalize(name)}`];
      if (overrideValue) return overrideValue;
    }
    return form[name];
  }

  /**
   * The application/x-www-form-urlencoded and text/plain encoding algorithms
   * take a list of name-value pairs, where the values must be strings,
   * rather than an entry list where the value can be a File.
   * @see [Converting an entry list to a list of name-value pairs | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs}
   */
  private getNameValuePairs(): [string, string][] {
    return Array.from(
      new FormData(this.form),
      ([key, value]) => (
        [key, value instanceof File ? value.name : value]
      ),
    );
  }

  /**
   * URLSearchParams is a native API that
   * uses the application/x-www-form-urlencoded format and encoding algorithm.
   * @see [URLSearchParams class | URL Standard]{@link https://url.spec.whatwg.org/#interface-urlsearchparams}
   */
  private getURLSearchParams(): URLSearchParams {
    return new URLSearchParams(this.getNameValuePairs());
  }

  /**
   * text/plain encoding algorithm for plain text form data.
   * @see [text/plain encoding algorithm | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#text/plain-encoding-algorithm}
   */
  private getTextPlain(): string {
    return this.getNameValuePairs()
      .reduce(
        (str, [key, value]) => `${str}${key}=${value}\r\n`,
        '',
      );
  }

  /**
   * Get the request to be sent by this submission.
   * @see [Form submission algorithm | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm}
   */
  getRequestInfo(): RequestInfo | null {
    const action = this.getAttribute('action');
    const actionURL = new URL(action, document.URL);

    // Only 'http' and 'https' schemes are supported.
    if (!/^https?:$/.test(actionURL.protocol)) return null;

    switch (this.getAttribute('method')) {
      /**
       * Mutate action URL.
       * @see [Mutate action URL | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#submit-mutate-action}
       */
      case 'get': {
        actionURL.search = this.getURLSearchParams().toString();

        return actionURL.href;
      }

      /**
       * Submit as entity body.
       * @see [Submit as entity body | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#submit-body}
       */
      case 'post': {
        let body: BodyInit;

        switch (this.getAttribute('enctype')) {
          case 'application/x-www-form-urlencoded':
            body = this.getURLSearchParams();
            break;
          case 'multipart/form-data':
            body = new FormData(this.form);
            break;
          case 'text/plain':
            body = this.getTextPlain();
            break;
          default:
            return null;
        }

        return new Request(action, {
          method: 'POST',
          body,
        });
      }

      /**
       * Method with no request to send ('dialog' method) or unsupported.
       */
      default:
        return null;
    }
  }
}

export default Submission;
