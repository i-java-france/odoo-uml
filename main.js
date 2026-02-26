/*
/*
 * Copyright (c) 2019 vitraining.com. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const codeGenerator = require('./code-generator')

// MIGRATED v3→v7: Using const and arrow functions for modern JS
const getGenOptions = () => {
    return {
        // MIGRATED v3→v7: app.preferences API remains mostly same but using modern syntax
        installPath: app.preferences.get('odoo_lite.gen.installPath'),
        useTab: app.preferences.get('odoo_lite.gen.useTab'),
        indentSpaces: app.preferences.get('odoo_lite.gen.indentSpaces'),
        docString: app.preferences.get('odoo_lite.gen.docString'),
        addonName: app.preferences.get('odoo_lite.gen.addonName'),
        appName: app.preferences.get('odoo_lite.gen.appName'),
        iconName: app.preferences.get('odoo_lite.gen.iconName'),
        odooVersion: app.preferences.get('odoo_lite.gen.odooVersion'),
        depends: app.preferences.get('odoo_lite.gen.depends'),
        en_language: app.preferences.get('odoo_lite.gen.en_language')
    }
}

/**
 * Command Handler for Python Code Generation
 *
 * @param {Element} base
 * @param {string} path
 * @param {Object} options
 */
// MIGRATED v3→v7: Refactored to async function to handle Promises better
async function _handleGenerate(base, path, options) {
    // If options is not passed, get from preference
    options = options || getGenOptions()

    // If base is not assigned, popup ElementPicker
    if (!base) {
        // MIGRATED v3→v7: app.elementPickerDialog.showDialog returns a Promise
        try {
            const { buttonId, returnValue } = await app.elementPickerDialog.showDialog('Select a base model to generate codes', null, type.UMLPackage)
            if (buttonId === 'ok') {
                base = returnValue
                // If path is not assigned, popup Open Dialog to select a folder
                if (!path) {
                    // MIGRATED v3→v7: app.dialogs.showOpenDialog is synchronous in v7
                    const files = app.dialogs.showOpenDialog('Select a folder where generated codes to be located', null, null, { properties: ['openDirectory'] })
                    if (files && files.length > 0) {
                        path = files[0]
                        await codeGenerator.generate(base, path, options)
                    }
                } else {
                    await codeGenerator.generate(base, path, options)
                }
            }
        } catch (err) {
            console.error('Migration Error in _handleGenerate:', err)
        }
    } else {
        // If path is not assigned, popup Open Dialog to select a folder
        if (!path) {
            const files = app.dialogs.showOpenDialog('Select a folder where generated codes to be located', null, null, { properties: ['openDirectory'] })
            if (files && files.length > 0) {
                path = files[0]
                await codeGenerator.generate(base, path, options)
            }
        } else {
            await codeGenerator.generate(base, path, options)
        }
    }
}

/**
 * Popup PreferenceDialog with Odoo Preference Schema
 */
function _handleConfigure() {
    // MIGRATED v3→v7: app.commands.execute remains same
    app.commands.execute('application:preferences', 'odoo_lite')
}

function init() {
    // MIGRATED v3→v7: app.commands.register remains same
    app.commands.register('odoo_lite:generate', _handleGenerate)
    app.commands.register('odoo_lite:configure', _handleConfigure)
}

exports.init = init