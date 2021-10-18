const capitalize = <T extends string>(str: T) => (
  `${str.charAt(0).toUpperCase()}${str.slice(1)}` as Capitalize<T>
);

type FormContentAttributeNames = 'action' | 'enctype' | 'method' | 'target';

/**
 * A submit button must be a <button> or an <input type="submit">.
 * HTML Standard didn't state this directly, but we can still tell this by reading
 * through the elements and functions that can trigger a submission in the standard.
 *
 * There is also a proposal WIP to make every element a possible submitter button.
 * We type it for type checks. May need changes when the proposal get implemented.
 *
 * @see [Concept submit button | HTML Standard]{@link https://html.spec.whatwg.org/multipage/forms.html#concept-submit-button}
 * @see [Form-associated custom elements: being a submit button · Issue #814 · WICG/webcomponents]{@link https://github.com/WICG/webcomponents/issues/814}
 */
export type SubmitButton = HTMLButtonElement | HTMLInputElement;

export default class Submission {
  declare form: HTMLFormElement;

  declare submitButton: SubmitButton | null;

  /**
   * Parse the basic facilities that will be frequently used in the submission.
   * @see [Form submission algorithm | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-algorithm}
   */
  constructor(form: HTMLFormElement, submitter: SubmitButton | null) {
    this.form = form;
    this.submitButton = submitter;
  }

  /**
   * Parse submission related content attributes.
   * @see [Form submission attributes | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#form-submission-attributes}
   */
  getAttribute(name: FormContentAttributeNames): string {
    const { submitButton, form } = this;

    /**
     * Some attributes from the submit button override the form's one.
     * Before reading the IDL value, do a hasAttribute check since the IDL may return
     * a value (usually the default) even when the related content attribute is not present.
     */
    if (submitButton && submitButton.hasAttribute(`form${name}`)) {
      const overrideValue = submitButton[`form${capitalize(name)}`];
      if (overrideValue) return overrideValue;
    }
    return form[name];
  }

  /**
   * Construct the entry list and return in FormData format.
   * Manually append submitter entry before we can directly specify the submitter button.
   * The manual way has the limitation that the submitter entry always comes last.
   * @see [Constructing the entry list | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-form-data-set}
   * @see [FormData: Add ability to specify submitter in addition to &lt;form&gt; · whatwg/xhr]{@link https://github.com/whatwg/xhr/issues/262}
   */
  getEntryList(): FormData {
    const { form, submitButton } = this;
    const formData = new FormData(form);
    if (submitButton && !submitButton.disabled && submitButton.name) {
      formData.append(submitButton.name, submitButton.value);
    }
    return formData;
  }

  /**
   * The application/x-www-form-urlencoded and text/plain encoding algorithms
   * take a list of name-value pairs, where the values must be strings,
   * rather than an entry list where the value can be a File.
   * @see [Converting an entry list to a list of name-value pairs | HTML Standard]{@link https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#converting-an-entry-list-to-a-list-of-name-value-pairs}
   */
  private getNameValuePairs(): [string, string][] {
    return Array.from(
      this.getEntryList(),
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
    const actionURL = new URL(action, document.baseURI);

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
            body = this.getEntryList();
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
