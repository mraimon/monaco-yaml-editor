/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import * as worker from '../../editor/editor.worker.js';
import { YAMLWorker } from './yamlWorker.js';
self.onmessage = () => {
    // ignore the first message
    worker.initialize((ctx, createData) => {
        return new YAMLWorker(ctx, createData);
    });
};
