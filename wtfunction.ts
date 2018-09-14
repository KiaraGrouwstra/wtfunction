import * as ts from 'typescript';
import * as R from 'ramda';
declare var console: Console;

function strToNode(str: string) {
    return ts.createSourceFile(/*fileName*/ 'bar.ts', /*sourceText*/ str, /*languageVersion*/ ts.ScriptTarget.ESNext);
}
const unknownExpr: ts.Expression = <ts.Expression>strToNode("null! as {}");

const filePath = './index.ts';
const qualifiedFilePath = '/ramda/index.d.ts';
const compilerOptions = {};
const program = ts.createProgram([filePath], compilerOptions);
const checker = program.getTypeChecker();
const sourceFiles = program.getSourceFiles();
// console.log("sourceFiles", sourceFiles);
// console.log("sourceFiles:fileName", JSON.stringify(sourceFiles.map(sourceFile => sourceFile.fileName)));
const sourceFile = sourceFiles.find(sourceFile => sourceFile.fileName.includes(qualifiedFilePath));
// console.log("sourceFile", sourceFile);
const sourceSymbol = checker.getSymbolAtLocation(sourceFile);
// console.log("sourceSymbol", sourceSymbol);
const exportSymbols = checker.getExportsOfModule(sourceSymbol);
// console.log("exportSymbols", exportSymbols);

const argStrings = ['1', `['a', 'b', 'c']`];
// console.log("argStrings", argStrings);
const argNodes: ts.Expression[] = argStrings.map((parString: string) => {
    const parSource: ts.SourceFile = strToNode(parString);
    const parNode: ts.Expression = <any>parSource; // ...
    // const parType: ts.Type = checker.getTypeOfNode(parNode);
    return parNode;
});
// console.log("argNodes", argNodes);

exportSymbols.filter((symbol: ts.Symbol) => {
    // const fnName: string = checker.getFullyQualifiedName(symbol);
    const fnName: string = checker.symbolToString(symbol);
    // console.log("fnName", fnName);
    // const fnName: string = checker.getNameOfSymbol(symbol);
    // const location: ts.Node = ;
    const declaration = symbol.declarations![0];
    const sourceFile = declaration.getSourceFile();
    const { fileName } = sourceFile;
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(declaration.getStart());
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signatures: ts.Signature[] = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
    // console.log("signatures", signatures);

    const parCount = Math.max(...signatures.map((signature: ts.Signature) => signature.minArgumentCount)); // .parameters.length
    // console.log("parCount", parCount);
    if (signatures.length && parCount > 0) {
        // console.log(parCount, fnName);
        // console.log(signatures.length, fnName);
        // console.log("type", type);
        // console.log("typeString", typeString);
        // console.log("apparent", apparent);
        // console.log("apparentTypeString", apparentTypeString);
        // console.log("signatures[0]", signatures[0]);

        const documentation = ts.displayPartsToString(symbol.getDocumentationComment());
        const typeString = checker.typeToString(type);
        // const apparent = checker.getApparentType(type);
        // const apparentTypeString = checker.typeToString(type);
        // const signature = ;
        // const typeArgumentNodes: ReadonlyArray<ts.TypeNode> = ;
        // const matches: boolean = checker.checkTypeArguments(signature, typeArgumentNodes, /*typeArgumentTypes*/ [], /*reportErrors*/ false); // not exposed

        // const signatures: ts.Signature[] = checker.getSignaturesOfSymbol(symbol); // not exposed
        const fnSource: ts.SourceFile = strToNode(fnName);
        // console.log("fnSource", fnSource);
        // ^ probably need to ensure this function is imported here?
        const expression: ts.Expression = <any>fnSource;
        // console.log("expression", expression);
        // const fnType = checker.getTypeOfNode(expression);
        // console.log("fnType", checker.typeToString(fnType));
        // let indices: number[] = [...Array(argNodes.length).keys()];
        let indices: number[] = Array.apply(null, {length: argNodes.length}).map(Function.call, Number)
        // let indices: number[] = argNodes.map(x => undefined);
        let types: ts.Type[] = [];
        let functionAllowsParams: boolean = false;

        checkParams: while (true) {
            if (fnName === 'prop') {
                console.log(signatures.length, fnName, indices);
            }
            functionAllowsParams = !!checkPermutation(expression, indices, fnName) || !!functionAllowsParams;
            // increment the next index to try the next permutation
            for (let i = indices.length - 1; i >= 0; i--) {
                if (indices[i] < indices[i+1] - 1) {
                    // can increment without overflow
                    indices[i] = indices[i] + 1;
                    continue checkParams;
                }
                else {
                    // hit last param or next arg, overflow
                    let num = indices[i-1];
                    for (let j = i-1; j < parCount; j++) {
                        indices[j] = ++num;
                    }
                    continue;
                }
            }
            // all options tried, full overflow throughout for-loop, done
            break;
        }
        // console.log("functionAllowsParams", functionAllowsParams);
        return functionAllowsParams;
    }

    function checkPermutation(expression, indices: number[], fnName: string): object | undefined {
        // const myArgs: ts.Expression[] = indices.map((idx: number) => argNodes[idx]);
        const myArgs: ts.Expression[] = indices.reduce(
            (arr: ts.Expression[], idx: number) => {
                arr[idx] = argNodes[idx];
                return arr;
            },
            argNodes.map(x => unknownExpr) // checker.unknownType
        );
        // const myArgTypes = myArgs.map((n: ts.Expression) => checker.getTypeOfNode(n)); // getTypeOfExpression
        // const myArgTypeStrings = myArgTypes.map((tp: ts.Type) => checker.typeToString(tp));
        const node = ts.createCall(expression /*: Expression*/, [] /*typeArguments: ReadonlyArray<TypeNode> | undefined*/, myArgs /*: ReadonlyArray<Expression>*/);
        // const sig: ts.Signature = checker.resolveCall(node /*: CallLikeExpression*/, signatures /*: Signature[]*/, /*candidatesOutArray*/ []); // not exposed
        const sig: ts.Signature = checker.getResolvedSignature(node);
        // ^ UNDEFINED!
        if (fnName === 'prop') {
            console.log("myArgs", myArgs);
            console.log("node", node);
            console.log("sig", sig);
        }
        if (sig) {
            const retType: ts.Type = checker.getReturnTypeOfSignature(sig);
            const retString = checker.typeToString(retType);
            const args = argStrings.map((s: string) => eval(s)); // TODO: fix param order, fill missing params
            const retVal = R[fnName](...[args]);
            // const meta = { fnName, documentation, typeString, retString, myArgs };
            console.log("meta1", meta);
            return meta;
        }
        return undefined;
    }
})
.forEach((meta: object) => {
    console.log("meta2", meta);
});
