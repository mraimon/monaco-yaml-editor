import '../../editor/editor.api.js';
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { setupMode } from './yamlMode.js';
var Emitter = monaco.Emitter;
// --- YAML configuration and defaults ---------
export class LanguageServiceDefaultsImpl {
    constructor(languageId, diagnosticsOptions) {
        this._onDidChange = new Emitter();
        this._languageId = languageId;
        this.setDiagnosticsOptions(diagnosticsOptions);
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    get languageId() {
        return this._languageId;
    }
    get diagnosticsOptions() {
        return this._diagnosticsOptions;
    }
    setDiagnosticsOptions(options) {
        this._diagnosticsOptions = options || Object.create(null);
        this._onDidChange.fire(this);
    }
}
const diagnosticDefault = {
    validate: true,
    schemas: [],
    enableSchemaRequest: false,
};
const yamlDefaults = new LanguageServiceDefaultsImpl('yaml', diagnosticDefault);
// Export API
function createAPI() {
    return {
        yamlDefaults,
    };
}
monaco.languages.yaml = createAPI();
// --- Registration to monaco editor ---
monaco.languages.register({
    id: 'yaml',
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml'],
});
monaco.languages.onLanguage('yaml', () => {
    setupMode(yamlDefaults);
});
