const fs = require('fs');

const code = fs.readFileSync('src/app/(dashboard)/site-content/page.tsx', 'utf8');
const ts = require('typescript');

function transform(sourceFile, context) {
  return function (rootNode) {
    function visit(node) {
      if (ts.isJsxAttribute(node) && node.name.text === 'onChangeMN') {
        // We found an onChangeMN
        // Let's modify the body of the arrow function
        if (node.initializer && ts.isJsxExpression(node.initializer) && node.initializer.expression && ts.isArrowFunction(node.initializer.expression)) {
          const arrowFunc = node.initializer.expression;
          if (ts.isBlock(arrowFunc.body)) {
            // Filter out statements that call set*EN or update variables ending in EN
            const newStatements = arrowFunc.body.statements.filter(stmt => {
              let shouldKeep = true;
              
              // Check for expression statements like setHomeEN(...)
              if (ts.isExpressionStatement(stmt) && ts.isCallExpression(stmt.expression)) {
                if (ts.isIdentifier(stmt.expression.expression)) {
                  const name = stmt.expression.expression.text;
                  if (name.startsWith('set') && name.endsWith('EN')) {
                    shouldKeep = false;
                  }
                }
              }
              
              // Check for variable declarations like const featuresEN = ...
              if (ts.isVariableStatement(stmt)) {
                const name = stmt.declarationList.declarations[0].name.text;
                if (name && name.endsWith('EN')) {
                  shouldKeep = false;
                }
              }
              
              // Check for assignments like featuresEN[i] = ...
              if (ts.isExpressionStatement(stmt) && ts.isBinaryExpression(stmt.expression)) {
                let left = stmt.expression.left;
                if (ts.isPropertyAccessExpression(left) || ts.isElementAccessExpression(left)) {
                  while(left.expression) left = left.expression;
                  if (ts.isIdentifier(left) && left.text.endsWith('EN')) {
                    shouldKeep = false;
                  }
                }
              }
              
              // Check for if (!featuresEN[i])
              if (ts.isIfStatement(stmt)) {
                 // rough check
                 shouldKeep = false;
              }

              return shouldKeep;
            });
            
            // Reconstruct arrow function
            return ts.factory.updateJsxAttribute(
              node,
              node.name,
              ts.factory.createJsxExpression(undefined, ts.factory.updateArrowFunction(
                arrowFunc,
                arrowFunc.modifiers,
                arrowFunc.typeParameters,
                arrowFunc.parameters,
                arrowFunc.type,
                arrowFunc.equalsGreaterThanToken,
                ts.factory.updateBlock(arrowFunc.body, newStatements)
              ))
            );
          }
        }
      }
      return ts.visitEachChild(node, visit, context);
    }
    return ts.visitNode(rootNode, visit);
  };
}

const sourceFile = ts.createSourceFile('page.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

const result = ts.transform(sourceFile, [transform]);
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const modifiedCode = printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], sourceFile);

fs.writeFileSync('src/app/(dashboard)/site-content/page.tsx', modifiedCode);
console.log("Done");
