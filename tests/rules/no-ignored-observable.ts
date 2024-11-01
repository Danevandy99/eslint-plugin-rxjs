import { stripIndent } from "common-tags";
import { fromFixture } from "eslint-etc";
import rule = require("../../src/rules/no-ignored-observable");
import { ruleTester } from "../utils";

ruleTester({ types: true }).run("no-ignored-observable", rule, {
  valid: [
    stripIndent`
      // not ignored
      import { Observable, of } from "rxjs";

      function functionSource() {
        return of(42);
      }

      function sink(source: Observable<number>) {
      }

      const a = functionSource();
      sink(functionSource());
    `,
    stripIndent`
      // not ignored arrow
      import { Observable, of } from "rxjs";

      const arrowSource = () => of(42);

      function sink(source: Observable<number>) {
      }

      const a = arrowSource();
      sink(arrowSource());
    `,
  ],
  invalid: [
    fromFixture(
      stripIndent`
        // ignored
        import { Observable, of } from "rxjs";

        function functionSource() {
          return of(42);
        }

        functionSource();
        ~~~~~~~~~~~~~~~~ [forbidden]
      `
    ),
    fromFixture(
      stripIndent`
        // ignored arrow
        import { Observable, of } from "rxjs";

        const arrowSource = () => of(42);

        arrowSource();
        ~~~~~~~~~~~~~ [forbidden]
      `
    ),
  ],
});
