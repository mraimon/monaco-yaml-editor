/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as ls from './_deps/vscode-languageserver-types/main.js';
var Range = monaco.Range;
// --- diagnostics --- ---
export class DiagnosticsAdapter {
    constructor(_languageId, _worker, defaults) {
        this._languageId = _languageId;
        this._worker = _worker;
        this._disposables = [];
        this._listener = Object.create(null);
        const onModelAdd = (model) => {
            const modeId = model.getModeId();
            if (modeId !== this._languageId) {
                return;
            }
            let handle;
            this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
                clearTimeout(handle);
                handle = setTimeout(() => this._doValidate(model.uri, modeId), 500);
            });
            this._doValidate(model.uri, modeId);
        };
        const onModelRemoved = (model) => {
            monaco.editor.setModelMarkers(model, this._languageId, []);
            const uriStr = model.uri.toString();
            const listener = this._listener[uriStr];
            if (listener) {
                listener.dispose();
                delete this._listener[uriStr];
            }
        };
        this._disposables.push(monaco.editor.onDidCreateModel(onModelAdd));
        this._disposables.push(monaco.editor.onWillDisposeModel(model => {
            onModelRemoved(model);
            this._resetSchema(model.uri);
        }));
        this._disposables.push(monaco.editor.onDidChangeModelLanguage(event => {
            onModelRemoved(event.model);
            onModelAdd(event.model);
            this._resetSchema(event.model.uri);
        }));
        this._disposables.push(defaults.onDidChange(_ => {
            monaco.editor.getModels().forEach(model => {
                if (model.getModeId() === this._languageId) {
                    onModelRemoved(model);
                    onModelAdd(model);
                }
            });
        }));
        this._disposables.push({
            dispose: () => {
                monaco.editor.getModels().forEach(onModelRemoved);
                for (const key in this._listener) {
                    this._listener[key].dispose();
                }
            },
        });
        monaco.editor.getModels().forEach(onModelAdd);
    }
    dispose() {
        this._disposables.forEach(d => d && d.dispose());
        this._disposables = [];
    }
    _resetSchema(resource) {
        this._worker().then(worker => {
            worker.resetSchema(resource.toString());
        });
    }
    _doValidate(resource, languageId) {
        this._worker(resource)
            .then(worker => {
            return worker.doValidation(resource.toString()).then(diagnostics => {
                const markers = diagnostics.map(d => toDiagnostics(resource, d));
                const model = monaco.editor.getModel(resource);
                if (model.getModeId() === languageId) {
                    monaco.editor.setModelMarkers(model, languageId, markers);
                }
            });
        })
            .then(undefined, err => {
            console.error(err);
        });
    }
}
function toSeverity(lsSeverity) {
    switch (lsSeverity) {
        case ls.DiagnosticSeverity.Error:
            return monaco.MarkerSeverity.Error;
        case ls.DiagnosticSeverity.Warning:
            return monaco.MarkerSeverity.Warning;
        case ls.DiagnosticSeverity.Information:
            return monaco.MarkerSeverity.Info;
        case ls.DiagnosticSeverity.Hint:
            return monaco.MarkerSeverity.Hint;
        default:
            return monaco.MarkerSeverity.Info;
    }
}
function toDiagnostics(resource, diag) {
    const code = typeof diag.code === 'number' ? String(diag.code) : diag.code;
    return {
        severity: toSeverity(diag.severity),
        startLineNumber: diag.range.start.line + 1,
        startColumn: diag.range.start.character + 1,
        endLineNumber: diag.range.end.line + 1,
        endColumn: diag.range.end.character + 1,
        message: diag.message,
        code,
        source: diag.source,
    };
}
// --- completion ------
function fromPosition(position) {
    if (!position) {
        return void 0;
    }
    return { character: position.column - 1, line: position.lineNumber - 1 };
}
function fromRange(range) {
    if (!range) {
        return void 0;
    }
    return {
        start: {
            line: range.startLineNumber - 1,
            character: range.startColumn - 1,
        },
        end: { line: range.endLineNumber - 1, character: range.endColumn - 1 },
    };
}
function toRange(range) {
    if (!range) {
        return void 0;
    }
    return new Range(range.start.line + 1, range.start.character + 1, range.end.line + 1, range.end.character + 1);
}
function toCompletionItemKind(kind) {
    const mItemKind = monaco.languages.CompletionItemKind;
    switch (kind) {
        case ls.CompletionItemKind.Text:
            return mItemKind.Text;
        case ls.CompletionItemKind.Method:
            return mItemKind.Method;
        case ls.CompletionItemKind.Function:
            return mItemKind.Function;
        case ls.CompletionItemKind.Constructor:
            return mItemKind.Constructor;
        case ls.CompletionItemKind.Field:
            return mItemKind.Field;
        case ls.CompletionItemKind.Variable:
            return mItemKind.Variable;
        case ls.CompletionItemKind.Class:
            return mItemKind.Class;
        case ls.CompletionItemKind.Interface:
            return mItemKind.Interface;
        case ls.CompletionItemKind.Module:
            return mItemKind.Module;
        case ls.CompletionItemKind.Property:
            return mItemKind.Property;
        case ls.CompletionItemKind.Unit:
            return mItemKind.Unit;
        case ls.CompletionItemKind.Value:
            return mItemKind.Value;
        case ls.CompletionItemKind.Enum:
            return mItemKind.Enum;
        case ls.CompletionItemKind.Keyword:
            return mItemKind.Keyword;
        case ls.CompletionItemKind.Snippet:
            return mItemKind.Snippet;
        case ls.CompletionItemKind.Color:
            return mItemKind.Color;
        case ls.CompletionItemKind.File:
            return mItemKind.File;
        case ls.CompletionItemKind.Reference:
            return mItemKind.Reference;
    }
    return mItemKind.Property;
}
function fromCompletionItemKind(kind) {
    const mItemKind = monaco.languages.CompletionItemKind;
    switch (kind) {
        case mItemKind.Text:
            return ls.CompletionItemKind.Text;
        case mItemKind.Method:
            return ls.CompletionItemKind.Method;
        case mItemKind.Function:
            return ls.CompletionItemKind.Function;
        case mItemKind.Constructor:
            return ls.CompletionItemKind.Constructor;
        case mItemKind.Field:
            return ls.CompletionItemKind.Field;
        case mItemKind.Variable:
            return ls.CompletionItemKind.Variable;
        case mItemKind.Class:
            return ls.CompletionItemKind.Class;
        case mItemKind.Interface:
            return ls.CompletionItemKind.Interface;
        case mItemKind.Module:
            return ls.CompletionItemKind.Module;
        case mItemKind.Property:
            return ls.CompletionItemKind.Property;
        case mItemKind.Unit:
            return ls.CompletionItemKind.Unit;
        case mItemKind.Value:
            return ls.CompletionItemKind.Value;
        case mItemKind.Enum:
            return ls.CompletionItemKind.Enum;
        case mItemKind.Keyword:
            return ls.CompletionItemKind.Keyword;
        case mItemKind.Snippet:
            return ls.CompletionItemKind.Snippet;
        case mItemKind.Color:
            return ls.CompletionItemKind.Color;
        case mItemKind.File:
            return ls.CompletionItemKind.File;
        case mItemKind.Reference:
            return ls.CompletionItemKind.Reference;
    }
    return ls.CompletionItemKind.Property;
}
function toTextEdit(textEdit) {
    if (!textEdit) {
        return void 0;
    }
    return {
        range: toRange(textEdit.range),
        text: textEdit.newText,
    };
}
export class CompletionAdapter {
    constructor(_worker) {
        this._worker = _worker;
    }
    get triggerCharacters() {
        return [' ', ':'];
    }
    provideCompletionItems(model, position, context, token) {
        const resource = model.uri;
        return this._worker(resource)
            .then(worker => {
            return worker.doComplete(resource.toString(), fromPosition(position));
        })
            .then(info => {
            if (!info) {
                return;
            }
            const wordInfo = model.getWordUntilPosition(position);
            const wordRange = new Range(position.lineNumber, wordInfo.startColumn, position.lineNumber, wordInfo.endColumn);
            const items = info.items.map(entry => {
                const item = {
                    label: entry.label,
                    insertText: entry.insertText || entry.label,
                    sortText: entry.sortText,
                    filterText: entry.filterText,
                    documentation: entry.documentation,
                    detail: entry.detail,
                    kind: toCompletionItemKind(entry.kind),
                    range: wordRange,
                };
                if (entry.textEdit) {
                    item.range = toRange(entry.textEdit.range);
                    item.insertText = entry.textEdit.newText;
                }
                if (entry.additionalTextEdits) {
                    item.additionalTextEdits = entry.additionalTextEdits.map(toTextEdit);
                }
                if (entry.insertTextFormat === ls.InsertTextFormat.Snippet) {
                    item.insertTextRules =
                        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
                }
                return item;
            });
            return {
                isIncomplete: info.isIncomplete,
                suggestions: items,
            };
        });
    }
}
function isMarkupContent(thing) {
    return (thing &&
        typeof thing === 'object' &&
        typeof thing.kind === 'string');
}
function toMarkdownString(entry) {
    if (typeof entry === 'string') {
        return {
            value: entry,
        };
    }
    if (isMarkupContent(entry)) {
        if (entry.kind === 'plaintext') {
            return {
                value: entry.value.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&'),
            };
        }
        return {
            value: entry.value,
        };
    }
    return { value: '```' + entry.language + '\n' + entry.value + '\n```\n' };
}
function toMarkedStringArray(contents) {
    if (!contents) {
        return void 0;
    }
    if (Array.isArray(contents)) {
        return contents.map(toMarkdownString);
    }
    return [toMarkdownString(contents)];
}
// --- hover ------
export class HoverAdapter {
    constructor(_worker) {
        this._worker = _worker;
    }
    provideHover(model, position, token) {
        const resource = model.uri;
        return this._worker(resource)
            .then(worker => {
            return worker.doHover(resource.toString(), fromPosition(position));
        })
            .then(info => {
            if (!info) {
                return;
            }
            return {
                range: toRange(info.range),
                contents: toMarkedStringArray(info.contents),
            };
        });
    }
}
// --- document symbols ------
function toSymbolKind(kind) {
    const mKind = monaco.languages.SymbolKind;
    switch (kind) {
        case ls.SymbolKind.File:
            return mKind.Array;
        case ls.SymbolKind.Module:
            return mKind.Module;
        case ls.SymbolKind.Namespace:
            return mKind.Namespace;
        case ls.SymbolKind.Package:
            return mKind.Package;
        case ls.SymbolKind.Class:
            return mKind.Class;
        case ls.SymbolKind.Method:
            return mKind.Method;
        case ls.SymbolKind.Property:
            return mKind.Property;
        case ls.SymbolKind.Field:
            return mKind.Field;
        case ls.SymbolKind.Constructor:
            return mKind.Constructor;
        case ls.SymbolKind.Enum:
            return mKind.Enum;
        case ls.SymbolKind.Interface:
            return mKind.Interface;
        case ls.SymbolKind.Function:
            return mKind.Function;
        case ls.SymbolKind.Variable:
            return mKind.Variable;
        case ls.SymbolKind.Constant:
            return mKind.Constant;
        case ls.SymbolKind.String:
            return mKind.String;
        case ls.SymbolKind.Number:
            return mKind.Number;
        case ls.SymbolKind.Boolean:
            return mKind.Boolean;
        case ls.SymbolKind.Array:
            return mKind.Array;
    }
    return mKind.Function;
}
export class DocumentSymbolAdapter {
    constructor(_worker) {
        this._worker = _worker;
    }
    provideDocumentSymbols(model, token) {
        const resource = model.uri;
        return this._worker(resource)
            .then(worker => worker.findDocumentSymbols(resource.toString()))
            .then(items => {
            if (!items) {
                return;
            }
            return items.map(item => toDocumentSymbol(item));
        });
    }
}
function toDocumentSymbol(item) {
    return {
        detail: '',
        range: toRange(item.range),
        name: item.name,
        kind: toSymbolKind(item.kind),
        selectionRange: toRange(item.selectionRange),
        children: item.children.map(child => toDocumentSymbol(child)),
        tags: [],
    };
}
function fromFormattingOptions(options) {
    return Object.assign({ tabSize: options.tabSize, insertSpaces: options.insertSpaces }, options);
}
export class DocumentFormattingEditProvider {
    constructor(_worker) {
        this._worker = _worker;
    }
    provideDocumentFormattingEdits(model, options, token) {
        const resource = model.uri;
        return this._worker(resource).then(worker => {
            return worker
                .format(resource.toString(), null, fromFormattingOptions(options))
                .then(edits => {
                if (!edits || edits.length === 0) {
                    return;
                }
                return edits.map(toTextEdit);
            });
        });
    }
}
export class DocumentRangeFormattingEditProvider {
    constructor(_worker) {
        this._worker = _worker;
    }
    provideDocumentRangeFormattingEdits(model, range, options, token) {
        const resource = model.uri;
        return this._worker(resource).then(worker => {
            return worker
                .format(resource.toString(), fromRange(range), fromFormattingOptions(options))
                .then(edits => {
                if (!edits || edits.length === 0) {
                    return;
                }
                return edits.map(toTextEdit);
            });
        });
    }
}
