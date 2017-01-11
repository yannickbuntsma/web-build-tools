// NOTE: THIS SOURCE FILE IS FOR DEBUGGING PURPOSES ONLY.
//       IT IS INVOKED BY THE "Run.cmd" AND "Debug.cmd" BATCH FILES.

import * as ts from 'typescript';
import Analyzer from './Analyzer';
import ApiFileGenerator from './generators/ApiFileGenerator';
import TypeDocGenerator from './generators/TypeDocGenerator';
import ApiJsonGenerator from './generators/ApiJsonGenerator';
import { IDocItem } from './IDocItem';
import { IApiDefinitionReference } from './IApiDefinitionReference';
import DocItemLoader from './DocItemLoader';
import TestFileComparer from './TestFileComparer';
import JsonFile from './JsonFile';
import ApiStructuredType from './definitions/ApiStructuredType';
import ApiDocumentation from './definitions/ApiDocumentation';

const analyzer: Analyzer = new Analyzer();

/**
 * Dummy class wrapping ApiDocumentation to test its protected methods
 */
let myDocumentedClass: ApiStructuredType;
class TestApiDocumentation extends ApiDocumentation {
  constructor() {
    super(myDocumentedClass, analyzer.docItemLoader, (msg: string) => { return; });
  }

  public tokenizeDocs(docs: string): string[] {
    return this._tokenizeDocs(docs);
  }

  public parseDocsBlock(tokens: string[], startingIndex: number, tagName?: string): string {
    return this._parseDocsBlock(tokens, startingIndex, tagName);
  }

  public parseDocsInline(token: string): string {
    return this._parseDocsInline(token);
  }

  public parseApiReferenceExpression(apiDefinitionRef: string): IApiDefinitionReference {
    return this._parseApiReferenceExpression(apiDefinitionRef);
  }
}

analyzer.analyze({
  compilerOptions: {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    jsx: ts.JsxEmit.React,
    rootDir: '../../spfx-core/sp-loader'
  },
  entryPointFile: '../../spfx-core/sp-loader/src/index.ts', // local/bundles/platform-exports.ts',
  otherFiles: ['../../spfx-core/sp-loader/typings/tsd.d.ts']
});

const apiFileGenerator: ApiFileGenerator = new ApiFileGenerator();
apiFileGenerator.writeApiFile('./lib/DebugRun.api.ts', analyzer);

const typeDocGenerator: TypeDocGenerator = new TypeDocGenerator();
typeDocGenerator.writeApiFile('./lib/DebugRun.typedoc.ts', analyzer);

const apiJsonGenerator: ApiJsonGenerator = new ApiJsonGenerator();
apiJsonGenerator.writeJsonFile('./lib/DebugRun.json', analyzer);

/**
 * Debugging inheritdoc expression parser. 
 * Analyzer on example2 is needed for testing the parser.
 */
analyzer.analyze({
  compilerOptions: {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    experimentalDecorators: true,
    jsx: ts.JsxEmit.React,
    rootDir: './testInputs/example2'
  },
  entryPointFile: './testInputs/example2/index.ts', // local/bundles/platform-exports.ts',
  otherFiles: []
});

myDocumentedClass = analyzer.package.getSortedMemberItems()
  .filter(apiItem => apiItem.name === 'MyDocumentedClass')[0] as ApiStructuredType;
const apiDoc: TestApiDocumentation = new TestApiDocumentation();

/**
 * Put test cases here
 */
let apiReferenceExpr: string = '@microsoft/sp-core-library:Guid.equals';
let actual: IApiDefinitionReference;
actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);

apiReferenceExpr = '@microsoft/sp-core-library:Guid';
actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);

apiReferenceExpr = 'sp-core-library:Guid';
actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);

apiReferenceExpr = 'Guid.equals';
actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);

apiReferenceExpr = 'Guid';
actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);

// Should report error
apiReferenceExpr = 'sp-core-library:Guid:equals';
try {
  actual = apiDoc.parseApiReferenceExpression(apiReferenceExpr);
} catch (error) {
  console.log(error);
}

/**
 * Debugging DocItemLoader
 */
const apiDefinitionRef: IApiDefinitionReference = {
  scopeName: '@microsoft',
  packageName: 'sp-core-library',
  exportName: 'DisplayMode',
  memberName: ''
};

const docItemLoader: DocItemLoader = new DocItemLoader('./testInputs/example2');
/* tslint:disable:no-unused-variable */
const apiDocItemNotInCache: IDocItem = docItemLoader.getItem(apiDefinitionRef);
JsonFile.saveJsonFile('./lib/inheritedDoc-output.json', JSON.stringify(apiDocItemNotInCache));
TestFileComparer.assertFileMatchesExpected('./lib/inheritedDoc-output.json', './testInputs/inheritedDoc-output.json');
/* tslint:disable:no-unused-variable */
const apiDocItemInCache: IDocItem = docItemLoader.getItem(apiDefinitionRef);