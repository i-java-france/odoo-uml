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
 * Version 1.10 (adapted for StarUML v7 & Odoo 19)
 */

const fs = require('fs');
const path = require('path');
const { uml, app } = require('staruml');   // StarUML v7 API
const codegen = require('./codegen-utils'); // CodeWriter helper

// ============================================================================
// Odoo Code Generator Class (unchanged logic, adapted to v7)
// ============================================================================
class OdooCodeGenerator {
    // ... (insert the entire class definition from the first part of your code)
    // Make sure all internal references use uml.Class, uml.Property etc.
    // I've already provided the full adapted class in the previous message.
    // For brevity, I'll include a placeholder here – you must copy the class
    // from the previous answer into this file.
}

// ============================================================================
// Command Handlers
// ============================================================================

/**
 * Retrieve generator options from StarUML preferences.
 */
function getGenOptions() {
    return {
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
    };
}

/**
 * Main generation command handler.
 * @param {uml.Element} base - selected model element (usually a Package)
 * @param {string} path - output directory
 * @param {Object} options - generation options
 */
async function handleGenerate(base, path, options) {
    options = options || getGenOptions();

    // If no base element provided, ask the user to pick a package
    if (!base) {
        try {
            const result = await app.elementPickerDialog.showDialog(
                'Select a base model (package) to generate code from',
                null,
                uml.Package   // use uml.Package, not type.UMLPackage
            );
            if (result.buttonId === 'ok') {
                base = result.returnValue;
            } else {
                return; // user cancelled
            }
        } catch (err) {
            console.error('Element picker error:', err);
            app.toast.error('Failed to select element.');
            return;
        }
    }

    // If no output path provided, ask for a folder
    if (!path) {
        const files = app.dialogs.showOpenDialog(
            'Select output folder for generated module',
            null,
            null,
            { properties: ['openDirectory'] }
        );
        if (files && files.length > 0) {
            path = files[0];
        } else {
            return; // user cancelled
        }
    }

    // Run the generator
    try {
        // The generator expects a uml.Model as baseModel.
        // If base is a Package, use its model or the package itself.
        const generator = new OdooCodeGenerator(base, path);
        await generator.generate(base, path, options); // note: generate is async
        app.toast.info('Odoo module generated successfully.');
    } catch (err) {
        console.error('Generation error:', err);
        app.toast.error('Generation failed. Check console for details.');
    }
}

/**
 * Open the preferences dialog for the generator.
 */
function handleConfigure() {
    app.commands.execute('application:preferences', 'odoo_lite');
}

// ============================================================================
// Extension Initialization
// ============================================================================
function init() {
    // Register commands
    app.commands.register('odoo_lite:generate', handleGenerate);
    app.commands.register('odoo_lite:configure', handleConfigure);

    // Optionally add menu items (if you want them to appear in the menu)
    // You can also let the user bind these commands to menus via package.json.
}

// Export the init function (required by StarUML)
exports.init = init;