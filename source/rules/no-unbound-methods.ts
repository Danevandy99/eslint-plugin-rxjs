/**
 * @license Use of this source code is governed by an MIT-style license that
 * can be found in the LICENSE file at https://github.com/cartant/eslint-plugin-rxjs
 */

import { Rule } from "eslint";
import * as es from "estree";
import {
  getParent,
  isCallExpression,
  isMemberExpression,
  typecheck,
} from "../utils";

const rule: Rule.RuleModule = {
  meta: {
    docs: {
      category: "RxJS",
      description: "Forbids the passing of unbound methods.",
      recommended: false,
    },
    fixable: null,
    messages: {
      forbidden: "Unbound methods are forbidden.",
    },
    schema: [],
  },
  create: (context) => {
    const { couldBeObservable, couldBeSubscription, getTSType } = typecheck(
      context
    );
    const nodeMap = new WeakMap<es.Node, void>();

    function mapArguments(node: es.CallExpression | es.NewExpression) {
      node.arguments.filter(isMemberExpression).forEach((arg) => {
        const argType = getTSType(arg);
        if (argType.getCallSignatures().length > 0) {
          nodeMap.set(arg);
        }
      });
    }

    function isObservableOrSubscription(
      node: es.CallExpression,
      action: (node: es.CallExpression) => void
    ) {
      if (!isMemberExpression(node.callee)) {
        return;
      }

      if (
        couldBeObservable(node.callee.object) ||
        couldBeSubscription(node.callee.object)
      ) {
        action(node);
      }
    }

    return {
      "CallExpression[callee.property.name='pipe']": (
        node: es.CallExpression
      ) => {
        isObservableOrSubscription(node, ({ arguments: args }) => {
          args.filter(isCallExpression).forEach(mapArguments);
        });
      },
      "CallExpression[callee.property.name=/^(add|subscribe)$/]": (
        node: es.CallExpression
      ) => {
        isObservableOrSubscription(node, mapArguments);
      },
      "NewExpression[callee.name='Subscription']": mapArguments,
      ThisExpression: (node: es.ThisExpression) => {
        let parent = getParent(node);
        while (parent) {
          if (nodeMap.has(parent)) {
            context.report({
              messageId: "forbidden",
              node: parent,
            });
            return;
          }
          parent = getParent(parent);
        }
      },
    };
  },
};

export = rule;
