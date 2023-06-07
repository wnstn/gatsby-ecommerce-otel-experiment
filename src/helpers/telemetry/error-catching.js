import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { trace, context } from '@opentelemetry/api';

export class ErrorCatching extends InstrumentationBase {


  errorHandler(e) {
    console.error('hello look i caught an error', e);
  }

  catchErrors() {
    document.onerror = this.errorHandler.bind(this);
  }


  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    console.log('error tracking is live');
  }
}