/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Copyright (c) Adam Voss. All rights reserved.
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as ls from './_deps/vscode-languageserver-types/main.js';
import * as yamlService from './_deps/yaml-language-server/lib/esm/languageservice/yamlLanguageService.js';
let defaultSchemaRequestService;
if (typeof fetch !== 'undefined') {
    defaultSchemaRequestService = function (url) {
        return fetch(url).then(response => response.text());
    };
}
export class YAMLWorker {
    constructor(ctx, createData) {
        const prefix = createData.prefix || '';
        const service = (url) => defaultSchemaRequestService(`${prefix}${url}`);
        this._ctx = ctx;
        this._languageSettings = createData.languageSettings;
        this._languageId = createData.languageId;
        this._languageService = yamlService.getLanguageService(createData.enableSchemaRequest && service, null, []);
        this._isKubernetes = createData.isKubernetes || false;
        this._languageService.configure(Object.assign(Object.assign({}, this._languageSettings), { hover: true, isKubernetes: this._isKubernetes }));
    }
    doValidation(uri) {
        const document = this._getTextDocument(uri);
        if (document) {
            return this._languageService.doValidation(document, this._isKubernetes);
        }
        return Promise.resolve([]);
    }
    doComplete(uri, position) {
        const document = this._getTextDocument(uri);
        return this._languageService.doComplete(document, position, this._isKubernetes);
    }
    doResolve(item) {
        return this._languageService.doResolve(item);
    }
    doHover(uri, position) {
        const document = this._getTextDocument(uri);
        return this._languageService.doHover(document, position);
    }
    format(uri, range, options) {
        const document = this._getTextDocument(uri);
        const textEdits = this._languageService.doFormat(document, options);
        return Promise.resolve(textEdits);
    }
    resetSchema(uri) {
        return Promise.resolve(this._languageService.resetSchema(uri));
    }
    findDocumentSymbols(uri) {
        const document = this._getTextDocument(uri);
        const symbols = this._languageService.findDocumentSymbols2(document);
        return Promise.resolve(symbols);
    }
    _getTextDocument(uri) {
        const models = this._ctx.getMirrorModels();
        for (const model of models) {
            if (model.uri.toString() === uri) {
                return ls.TextDocument.create(uri, this._languageId, model.version, model.getValue());
            }
        }
        return null;
    }
}
export function create(ctx, createData) {
    return new YAMLWorker(ctx, createData);
}
