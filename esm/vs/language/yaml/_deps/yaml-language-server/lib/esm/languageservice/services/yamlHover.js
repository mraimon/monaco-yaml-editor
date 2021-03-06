/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { matchOffsetToDocument } from '../utils/arrUtils.js';
import { parse as parseYAML } from '../parser/yamlParser07.js';
import { JSONHover } from '../../../../../vscode-json-languageservice/lib/esm/services/jsonHover.js';
export class YAMLHover {
    constructor(schemaService, promiseConstructor) {
        this.promise = promiseConstructor || Promise;
        this.shouldHover = true;
        this.jsonHover = new JSONHover(schemaService, [], Promise);
    }
    configure(languageSettings) {
        if (languageSettings) {
            this.shouldHover = languageSettings.hover;
        }
    }
    doHover(document, position) {
        if (!this.shouldHover || !document) {
            return this.promise.resolve(undefined);
        }
        const doc = parseYAML(document.getText());
        const offset = document.offsetAt(position);
        const currentDoc = matchOffsetToDocument(offset, doc);
        if (currentDoc === null) {
            return this.promise.resolve(undefined);
        }
        const currentDocIndex = doc.documents.indexOf(currentDoc);
        currentDoc.currentDocIndex = currentDocIndex;
        return this.jsonHover.doHover(document, position, currentDoc);
    }
}
