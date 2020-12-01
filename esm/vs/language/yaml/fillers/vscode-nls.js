/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
function format(message, args) {
    let result;
    if (args.length === 0) {
        result = message;
    }
    else {
        result = message.replace(/\{(\d+)\}/g, (match, rest) => {
            const index = rest[0];
            return typeof args[index] !== 'undefined' ? args[index] : match;
        });
    }
    return result;
}
function localize(key, message, ...args) {
    return format(message, args);
}
export function loadMessageBundle(file) {
    return localize;
}
export function config(opt) {
    return loadMessageBundle;
}
