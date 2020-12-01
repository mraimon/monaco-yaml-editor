import { parse as parseYAML } from '../parser/yamlParser07.js';
import { matchOffsetToDocument } from '../utils/arrUtils.js';
import { findDefinition as JSONFindDefinition } from '../../../../../vscode-json-languageservice/lib/esm/services/jsonDefinition.js';
export function findDefinition(document, position) {
    const doc = parseYAML(document.getText());
    const offset = document.offsetAt(position);
    const currentDoc = matchOffsetToDocument(offset, doc);
    if (currentDoc === null) {
        return Promise.resolve([]);
    }
    const currentDocIndex = doc.documents.indexOf(currentDoc);
    currentDoc.currentDocIndex = currentDocIndex;
    return JSONFindDefinition(document, position, currentDoc);
}
