import ts from 'typescript';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createRequire} from 'node:module';
const realRequire=createRequire(import.meta.url);
export function loadModule(path,mocks={},cache=new Map()){
 const filename=resolve(path);if(cache.has(filename))return cache.get(filename).exports;
 const module={exports:{}};cache.set(filename,module);
 const code=ts.transpileModule(readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const require=name=>{if(name in mocks)return mocks[name];if(name.startsWith('.')||name.startsWith('@/')){let target=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(filename),name);if(target.endsWith('.json'))return JSON.parse(readFileSync(target,'utf8'));if(!existsSync(target))target+='.ts';return loadModule(target,mocks,cache);}return realRequire(name);};
 new Function('require','module','exports',code)(require,module,module.exports);return module.exports;
}
