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
const codegen = require('./codegen-utils'); // CodeWriter helper

// ============================================================================
// Odoo Code Generator Class (with all uml. replaced by type.)
// ============================================================================
class OdooCodeGenerator {
    /**
     * @constructor
     *
     * @param {type.Model} baseModel
     * @param {string} basePath generated files and directories to be placed
     */
    constructor(baseModel, basePath) {
        /** @member {type.Model} */
        this.baseModel = baseModel;
        /** @member {string} */
        this.basePath = basePath;
    }

    /**
     * Return Indent String based on options
     * @param {Object} options
     * @return {string}
     */
    getIndentString(options) {
        if (options.useTab) {
            return '\t';
        } else {
            let indent = [];
            for (let i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(' ');
            }
            return indent.join('');
        }
    }

    /**
     * Collect inheritances (super classes or interfaces) of a given element
     * @param {type.Class} elem
     * @return {Array.<type.Class>}
     */
    getInherits(elem) {
        const inherits = elem.getRelationships().filter(rel => 
            rel.source === elem && (rel instanceof type.Generalization || rel instanceof type.InterfaceRealization)
        );
        return inherits.map(gen => gen.target);
    }

    /**
     * Write Doc
     * @param {codegen.CodeWriter} codeWriter
     * @param {string} text
     * @param {Object} options
     */
    writeDoc(codeWriter, text, options) {
        if (options.docString && text.trim().length > 0) {
            const lines = text.trim().split('\n');
            if (lines.length > 1) {
                codeWriter.writeLine('"""');
                lines.forEach(line => codeWriter.writeLine(line));
                codeWriter.writeLine('"""');
            } else {
                codeWriter.writeLine('"""' + lines[0] + '"""');
            }
        }
    }

    /**
     * Write Variable
     * @param {codegen.CodeWriter} codeWriter
     * @param {type.Property} elem
     * @param {Object} options
     * @param {boolean} isClassVar
     * @param {type.Property} inverse_field
     * @param {boolean} stateExist
     */
    writeVariable(codeWriter, elem, options, isClassVar, inverse_field, stateExist) {
        const addonName = options.addonName;

        if (elem.name && elem.name.length > 0) {
            let line;
            const nameOrInherit = elem.name && ["_name", "_inherit"].includes(elem.name);

            if (nameOrInherit) {
                if (elem.name == "_inherit") {
                    line = elem.name + ' = "' + elem.defaultValue + '"';
                } else {
                    // _name is handled elsewhere
                    return;
                }
            }
            // relational fields
            else if (elem.multiplicity && ['0..*', '1..*', '*', '1'].includes(elem.multiplicity.trim())) {
                line = elem.name;
                if (elem.multiplicity == '0..*') {
                    line += ' = fields.Many2one(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", ';
                } else if (elem.multiplicity == '1') {
                    line += ' = fields.One2many(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", ';
                    line += ' inverse_name="' + inverse_field.name + '", ';
                } else if (elem.multiplicity == '*') {
                    line += ' = fields.Many2many(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", ';
                }
            }
            // attribute = fields.type( 
            else if (elem.type == 'Selection') {
                if (elem.name !== 'state') {
                    line = elem.name + ' = fields.Selection(selection=[' + elem.defaultValue + '], ';
                } else {
                    line = elem.name + ' = fields.Selection(selection=STATES, ';
                    line += " readonly=True, default=STATES[0][0], ";
                }
            } else {
                line = elem.name + ' = fields.' + elem.type + '(';
            }

            // add more attributes
            if (elem.name === 'name') {
                line += ' required=True,';
                if (stateExist) {
                    line += ' default="New", readonly=True, ';
                } else if (elem.defaultValue) {
                    line += ' default="' + elem.defaultValue + '", ';
                }
            }

            // add string 
            if (!nameOrInherit) {
                line += ' string="' + this.sentenceCase(elem.name, options) + '", ';

                // add readonly if there's state field 
                if (stateExist) {
                    if (elem.name !== 'name' && elem.name !== 'state') {
                        line += ' readonly=True, states={"draft" : [("readonly",False)]}, ';
                    }
                }
                // add help
                line += ' help="' + elem.documentation + '"';
                line += ')';
            }
            codeWriter.writeLine(line);
        }
    }

    /**
     * Write Action Method
     * @param {codegen.CodeWriter} codeWriter
     * @param {string} className
     * @param {string} objectName
     * @param {Object} options
     * @param {boolean} withSequence
     */
    writeCreateMethod(codeWriter, className, objectName, options, withSequence) {
        const odooVersion = options.odooVersion;
        codeWriter.writeLine();

        codeWriter.writeLine('@api.model');
        codeWriter.writeLine('def create(self, vals):');
        codeWriter.indent();
        if (withSequence) {
            codeWriter.writeLine('if not vals.get("name", False) or vals["name"] == "New":');
            codeWriter.indent();
            codeWriter.writeLine('vals["name"] = self.env["ir.sequence"].next_by_code("' + objectName + '") or "Error Number!!!"');
            codeWriter.outdent();
        }
        codeWriter.writeLine('return super(' + className + ', self).create(vals)');
        codeWriter.outdent();
    }

    /**
     * Write Action Methods (confirm, done, draft, unlink)
     * @param {codegen.CodeWriter} codeWriter
     * @param {string} className
     * @param {string} objectName
     * @param {Object} options
     */
    writeActionMethod(codeWriter, className, objectName, options) {
        const odooVersion = options.odooVersion;

        codeWriter.writeLine();
        codeWriter.writeLine('def action_confirm(self):');
        codeWriter.indent();
        codeWriter.writeLine('self.state = STATES[1][0]');
        codeWriter.outdent();

        codeWriter.writeLine();
        codeWriter.writeLine('def action_done(self):');
        codeWriter.indent();
        codeWriter.writeLine('self.state = STATES[2][0]');
        codeWriter.outdent();

        codeWriter.writeLine();
        codeWriter.writeLine('def action_draft(self):');
        codeWriter.indent();
        codeWriter.writeLine('self.state = STATES[0][0]');
        codeWriter.outdent();

        codeWriter.writeLine();
        if (odooVersion < 13)
            codeWriter.writeLine('@api.multi');
        codeWriter.writeLine('def unlink(self):');
        codeWriter.indent();
        codeWriter.writeLine('for me_id in self :');
        codeWriter.indent();
        codeWriter.writeLine('if me_id.state != STATES[0][0]:');
        codeWriter.indent();
        codeWriter.writeLine('raise UserError("Cannot delete non draft record!")');
        codeWriter.outdent();
        codeWriter.outdent();
        codeWriter.writeLine('return super(' + className + ', self).unlink()');
        codeWriter.outdent();
    }

    /**
     * Write Enum
     * @param {codegen.CodeWriter} codeWriter
     * @param {type.Enumeration} elem
     * @param {Object} options
     */
    writeEnum(codeWriter, elem, options) {
        codeWriter.writeLine('from enum import Enum');
        codeWriter.writeLine();

        codeWriter.writeLine('class ' + elem.name + '(Enum):');
        codeWriter.indent();
        this.writeDoc(codeWriter, elem.documentation, options);

        if (!elem.ownedLiterals || elem.ownedLiterals.length === 0) {
            codeWriter.writeLine('pass');
        } else {
            let i = 1;
            elem.ownedLiterals.forEach(literal => {
                codeWriter.writeLine(literal.name + ' = ' + i++);
            });
        }
        codeWriter.outdent();
        codeWriter.writeLine();
    }

    writeInit(codeWriter, ownedElements, options) {
        const addonName = options.addonName;
        ownedElements.forEach(child => {
            if (child instanceof type.Class) {
                codeWriter.writeLine('from . import ' + child.name);
            }
        });
    }

    writeModelAccess(fullPath, ownedElements, folderName, options) {
        const self = this;
        const codeWriter = new codegen.CodeWriter('\t');
        const appName = options.appName;
        const appNameLower = appName.toLowerCase();
        const userGroup = folderName + '.group_' + appNameLower + '_user';
        const managerGroup = folderName + '.group_' + appNameLower + '_manager';

        codeWriter.writeLine('"id","name","model_id:id","group_id:id","perm_read","perm_write","perm_create","perm_unlink"');

        ownedElements.forEach(elem => {
            if (elem instanceof type.Class) {
                const is_inherit = self.checkInherit(elem);
                if (!is_inherit) {
                    const model_name_underscore = this.getModelName(elem, options, '_');
                    const model_name_dot = this.getModelName(elem, options, '.');
                    codeWriter.writeLine('access_user_' + model_name_underscore + ',access_user_' + model_name_underscore + ',model_' + model_name_underscore + ',' + userGroup + ',1,0,0,0');
                    codeWriter.writeLine('access_manager_' + model_name_underscore + ',access_manager_' + model_name_underscore + ',model_' + model_name_underscore + ',' + managerGroup + ',1,1,1,1');
                    codeWriter.writeLine('access_admin_' + model_name_underscore + ',access_admin_' + model_name_underscore + ',model_' + model_name_underscore + ',base.group_system,1,1,1,1');
                }
            }
        });
        fs.writeFileSync(fullPath + '/security/ir.model.access.csv', codeWriter.getData());
    }

    writeGroupsXML(fullPath, options) {
        const appName = options.appName;
        const appNameLower = appName.toLowerCase();

        const xmlWriter = new codegen.CodeWriter('\t');
        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();
        xmlWriter.writeLine('<data>');
        xmlWriter.indent();

        xmlWriter.writeLine('<record model="ir.module.category" id="module_category_' + appNameLower + '">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">' + appName + '</field>');
        xmlWriter.writeLine('<field name="description">' + appName + ' Groups</field>');
        xmlWriter.writeLine('<field name="sequence">10</field>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record>');

        xmlWriter.writeLine('<record id="group_' + appNameLower + '_user" model="res.groups">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">User</field>');
        xmlWriter.writeLine('<field name="category_id" ref="module_category_' + appNameLower + '"/>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record>');

        xmlWriter.writeLine('<record id="group_' + appNameLower + '_manager" model="res.groups">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">Manager</field>');
        xmlWriter.writeLine('<field name="category_id" ref="module_category_' + appNameLower + '"/>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record>');

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');

        fs.writeFileSync(fullPath + '/security/groups.xml', xmlWriter.getData());
    }

    writeManifest(codeWriter, ownedElements, options, folderName, inheritedModule) {
        const self = this;
        const addonName = folderName;
        const appName = options.appName;
        const depends = options.depends;

        codeWriter.writeLine('#-*- coding: utf-8 -*-');
        codeWriter.writeLine();

        codeWriter.writeLine('{');
        codeWriter.indent();
        codeWriter.writeLine('"name": "' + appName + (inheritedModule ? " Inherited" : "") + '",');
        codeWriter.writeLine('"version": "1.0", ');
        codeWriter.writeLine('"depends": [');
        codeWriter.indent();
        codeWriter.writeLine(depends + ",");
        if (inheritedModule) {
            codeWriter.writeLine("'" + folderName + "'");
        }
        codeWriter.outdent();
        codeWriter.writeLine('],');
        codeWriter.writeLine('"author": "Akhmad D. Sembiring [vitraining.com]",');
        codeWriter.writeLine('"category": "Utility",');
        codeWriter.writeLine('"website": "http://vitraining.com",');
        codeWriter.writeLine('"images": ["static/description/images/main_screenshot.jpg"],');
        codeWriter.writeLine('"price": "10",');
        codeWriter.writeLine('"license": "OPL-1",');
        codeWriter.writeLine('"currency": "USD",');
        codeWriter.writeLine('"summary": "This is the ' + appName + ' module generated by StarUML Odoo Generator Pro Version",');
        codeWriter.writeLine('"description": """');
        codeWriter.outdent();
        codeWriter.writeLine();
        codeWriter.writeLine('Information');
        codeWriter.writeLine('======================================================================');
        codeWriter.writeLine();
        codeWriter.writeLine('* created menus');
        codeWriter.writeLine('* created objects');
        codeWriter.writeLine('* created views');
        codeWriter.writeLine('* logics');
        codeWriter.writeLine();
        codeWriter.writeLine('""",');
        codeWriter.indent();
        codeWriter.writeLine('"data": [');
        codeWriter.indent();

        if (!inheritedModule) {
            codeWriter.writeLine('"security/groups.xml",');
            codeWriter.writeLine('"security/ir.model.access.csv",');
            codeWriter.writeLine('"view/menu.xml",');

            ownedElements.forEach(child => {
                if (child instanceof type.Class) {
                    const is_inherit = self.checkInherit(child);
                    if (!is_inherit) {
                        codeWriter.writeLine('"view/' + child.name + '.xml",');
                    } else {
                        codeWriter.writeLine('"view/' + child.name + '.xml", #inherited');
                    }

                    // sequence 
                    const state_field_exist = child.ownedElements.some(attr => attr instanceof type.Property && attr.name === 'state');
                    if (state_field_exist)
                        codeWriter.writeLine('"data/sequence_' + child.name + '.xml",');
                }
            });

            ownedElements.forEach(child => {
                if (child instanceof type.Class) {
                    codeWriter.writeLine('"report/' + child.name + '.xml",');
                }
            });
        } else {
            // inherited module
            ownedElements.forEach(child => {
                if (child instanceof type.Class) {
                    codeWriter.writeLine('# "view/' + child.name + '.xml",');

                    const state_field_exist = child.ownedElements.some(attr => attr instanceof type.Property && attr.name === 'state');
                    if (state_field_exist)
                        codeWriter.writeLine('# "data/sequence_' + child.name + '.xml",');
                }
            });
        }

        codeWriter.outdent();
        codeWriter.writeLine('],');
        codeWriter.writeLine('"installable": True,');
        codeWriter.writeLine('"auto_install": False,');
        codeWriter.writeLine('"application": True,');
        codeWriter.outdent();
        codeWriter.writeLine('}');
    }

    /**
     * Write Class per model 
     * @param {codegen.CodeWriter} codeWriter
     * @param {type.Class} elem
     * @param {Object} options
     */
    writeClass(codeWriter, elem, options) {
        const self = this;
        const addonName = options.addonName;
        const odooVersion = options.odooVersion;
        let stateExist = false;
        const className = elem.name;
        let objectName = '';

        // check if state exists
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name === 'state') {
                stateExist = true;
                codeWriter.writeLine('STATES = [' + attr.defaultValue + ']');
            }
        });

        // Import
        codeWriter.writeLine('from odoo import models, fields, api, _');
        codeWriter.writeLine('from odoo.exceptions import UserError, Warning');
        codeWriter.writeLine();

        // Class
        codeWriter.writeLine('class ' + className + '(models.Model):');
        codeWriter.indent();

        // Docstring
        this.writeDoc(codeWriter, elem.documentation, options);
        codeWriter.writeLine();

        objectName = this.getModelName(elem, options, '.');
        codeWriter.writeLine('_name = "' + objectName + '"');
        codeWriter.writeLine('_description = "' + objectName + '"');
        codeWriter.writeLine();

        // write fields (attributes)
        attributes.forEach(attr => {
            self.writeVariable(codeWriter, attr, options, true, false, stateExist);
        });
        codeWriter.writeLine();

        // Methods (operations)
        const operations = elem.ownedElements.filter(owned => owned instanceof type.Operation);
        if (operations.length > 0) {
            operations.forEach(op => {
                self.writeMethod(codeWriter, op, options);
            });
        }

        if (stateExist) {
            const withSequence = true;
            self.writeCreateMethod(codeWriter, className, objectName, options, withSequence);
            self.writeActionMethod(codeWriter, className, objectName, options);
        }

        codeWriter.writeLine();

        // from associations: Many2one, One2many, Many2many
        const associations = elem.getRelationships().filter(rel => rel instanceof type.Association);
        for (let i = 0, len = associations.length; i < len; i++) {
            const asso = associations[i];
            if (asso.end1.reference === elem) {
                // end1 = this class => Many2one
                if (asso.end1.name && asso.end1.name.length > 0) {
                    self.writeVariable(codeWriter, asso.end1, options, true, asso.end2, stateExist);
                }
            }
            if (asso.end2.reference === elem) {
                // end2 = this class => One2many
                if (asso.end2.name && asso.end2.name.length > 0) {
                    self.writeVariable(codeWriter, asso.end2, options, true, asso.end1, stateExist);
                }
            }
        }

        codeWriter.outdent();
        codeWriter.writeLine();
    }

    /**
     * Write Method
     * @param {codegen.CodeWriter} codeWriter
     * @param {type.Operation} elem
     * @param {Object} options
     */
    writeMethod(codeWriter, elem, options) {
        codeWriter.writeLine();

        if (elem.name.length > 0) {
            // name
            let line = 'def ' + elem.name;

            // params
            const params = elem.getNonReturnParameters();
            const paramStr = params.map(p => p.name).join(', ');

            if (elem.isStatic) {
                codeWriter.writeLine('@classmethod');
                codeWriter.writeLine(line + '(cls, ' + paramStr + '):');
            } else {
                codeWriter.writeLine(line + '(self, ' + paramStr + '):');
            }
            codeWriter.indent();
            this.writeDoc(codeWriter, elem.documentation, options);
            codeWriter.writeLine('pass');
            codeWriter.outdent();
            codeWriter.writeLine();
        }
    }

    /**
     * Write Inherited Class
     * @param {codegen.CodeWriter} codeWriter
     * @param {type.Class} elem
     * @param {Object} options
     */
    writeInheritedClass(codeWriter, elem, options) {
        const self = this;
        const addonName = options.addonName;
        let state_field_exist = false;

        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name === 'state') {
                state_field_exist = true;
                codeWriter.writeLine('STATES = [' + attr.defaultValue + ']');
            }
        });

        // Import
        codeWriter.writeLine('from odoo import models, fields, api, _');
        codeWriter.writeLine('from odoo.exceptions import UserError, Warning');
        codeWriter.writeLine();

        // Class
        const className = elem.name;
        codeWriter.writeLine('class ' + elem.name + '(models.Model):');
        codeWriter.indent();
        const objectName = this.getModelName(elem, options, '.');
        codeWriter.writeLine('_name = "' + objectName + '"');
        codeWriter.writeLine('_inherit = "' + objectName + '"');
        codeWriter.writeLine();

        if (state_field_exist) {
            const withSequence = false;
            self.writeCreateMethod(codeWriter, className, objectName, options, withSequence);
            self.writeActionMethod(codeWriter, className, objectName, options);
        }
        const operations = elem.ownedElements.filter(owned => owned instanceof type.Operation);
        if (operations.length > 0) {
            operations.forEach(op => {
                self.writeMethod(codeWriter, op, options);
            });
        }
        codeWriter.outdent();
        codeWriter.writeLine();
    }

    writeXML(xmlWriter, elem, options, folderName, sequence) {
        const self = this;
        const normal_fields = [];
        const o2m_fields = [];
        const m2o_fields = [];
        const m2m_fields = [];
        const addonName = options.addonName;
        const odooVersion = options.odooVersion;
        const model_name_underscore = this.getModelName(elem, options, '_');
        const model_name_dot = this.getModelName(elem, options, '.');
        const model_name_title = this.sentenceCase(elem.name, options);
        let date_field_exist = false;
        let date_field = '';
        let image_field_exist = false;
        let state_field_exist = false;
        const is_inherit = this.checkInherit(elem);
        const elem_name = elem.name;

        // get fields names
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name && attr.name !== '_name' && attr.name !== '_inherit') {
                normal_fields.push(attr);
                if (attr.type === 'Date' || attr.type === 'Datetime') {
                    date_field_exist = true;
                    date_field = attr.name;
                }
                if (attr.name === 'image_small') {
                    image_field_exist = true;
                }
                if (attr.name === 'state') {
                    state_field_exist = true;
                }
            }
        });

        const associations = elem.getRelationships().filter(rel => rel instanceof type.Association);
        for (let i = 0, len = associations.length; i < len; i++) {
            const asso = associations[i];
            if (asso.end1.reference === elem && asso.end1.name) {
                if (asso.end1.multiplicity == '0..*' || asso.end1.multiplicity == '1..*') {
                    m2o_fields.push(asso.end1);
                } else if (asso.end1.multiplicity == '*') {
                    m2m_fields.push(asso.end1);
                }
            }
            if (asso.end2.reference === elem && asso.end2.name) {
                if (asso.end2.multiplicity == '1') {
                    o2m_fields.push(asso.end2);
                } else if (asso.end2.multiplicity == '*') {
                    m2m_fields.push(asso.end2);
                }
            }
        }

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>');
        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();
        xmlWriter.writeLine('<data>');
        xmlWriter.indent();

        if (!is_inherit) {
            // tree view
            xmlWriter.writeLine('<!-- tree view -->');
            xmlWriter.writeLine('<record id="view_' + model_name_underscore + '_tree" model="ir.ui.view">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + model_name_underscore + '_tree</field>');
            xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
            xmlWriter.writeLine('<field name="type">tree</field>');
            xmlWriter.writeLine('<field name="priority" eval="8"/>');
            xmlWriter.writeLine('<field name="arch" type="xml">');
            xmlWriter.indent();
            xmlWriter.writeLine('<tree string="' + model_name_title + '">');
            xmlWriter.indent();
            normal_fields.forEach(field => {
                xmlWriter.writeLine('<field name="' + field.name + '" />');
            });
            m2o_fields.forEach(field => {
                xmlWriter.writeLine('<field name="' + field.name + '" />');
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</tree>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');

            // form view
            xmlWriter.writeLine('<!-- form view -->');
            xmlWriter.writeLine('<record id="view_' + model_name_underscore + '_form" model="ir.ui.view">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + model_name_underscore + '_form</field>');
            xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
            xmlWriter.writeLine('<field name="type">form</field>');
            xmlWriter.writeLine('<field name="priority" eval="8"/>');
            xmlWriter.writeLine('<field name="arch" type="xml">');
            xmlWriter.indent();
            xmlWriter.writeLine('<form string="' + model_name_title + '">');
            xmlWriter.indent();
            xmlWriter.writeLine('<header>');
            xmlWriter.indent();
            if (state_field_exist) {
                xmlWriter.writeLine('<button string="Confirm" type="object" name="action_confirm" states="draft" />');
                xmlWriter.writeLine('<button string="Mark as Done" type="object" name="action_done" states="open" />');
                xmlWriter.writeLine('<button string="Reset to Draft" type="object" name="action_draft" states="open,done" />');
                xmlWriter.writeLine('<field name="state" widget="statusbar" />');
            }
            xmlWriter.outdent();
            xmlWriter.writeLine('</header>');
            xmlWriter.writeLine('<sheet>');
            xmlWriter.indent();
            xmlWriter.writeLine('<div class="oe_button_box" name="button_box">');
            xmlWriter.indent();
            xmlWriter.writeLine('<!--button type="object" name="action_view_detail" class="oe_stat_button" icon="fa-pencil-square-o"-->');
            xmlWriter.indent();
            xmlWriter.writeLine('<!--field name="detail_count" widget="statinfo" string="Detail(s)"/-->');
            xmlWriter.writeLine('<!--field name="detail_ids" invisible="1"/-->');
            xmlWriter.outdent();
            xmlWriter.writeLine('<!--/button-->');
            xmlWriter.outdent();
            xmlWriter.writeLine('</div>');
            xmlWriter.writeLine('<div class="oe_title">');
            xmlWriter.indent();
            xmlWriter.writeLine('<label for="name" class="oe_edit_only" string="' + model_name_title + ' Name"/>');
            xmlWriter.writeLine('<h1><field name="name"/></h1>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</div>');
            xmlWriter.writeLine('<group>');
            xmlWriter.indent();
            xmlWriter.writeLine('<group>');
            xmlWriter.indent();
            normal_fields.forEach(field => {
                if (field.name !== 'name' && field.name !== 'state') {
                    xmlWriter.writeLine('<field name="' + field.name + '" />');
                }
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</group>');

            xmlWriter.writeLine('<group>');
            xmlWriter.indent();
            m2o_fields.forEach(field => {
                xmlWriter.writeLine('<field name="' + field.name + '" />');
            });
            m2m_fields.forEach(field => {
                xmlWriter.writeLine('<field name="' + field.name + '" widget="many2many_tags"/>');
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</group>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</group>');

            xmlWriter.writeLine('<notebook>');
            xmlWriter.indent();
            o2m_fields.forEach(field => {
                xmlWriter.writeLine('<page name="' + field.name + '" string="' + self.sentenceCase(field.name, options) + '">');
                xmlWriter.indent();
                xmlWriter.writeLine('<field name="' + field.name + '"/>');
                xmlWriter.outdent();
                xmlWriter.writeLine('</page>');
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</notebook>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</sheet>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</form>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');
        } // end if not is_inherit

        // action window and menu for all classes except res.users
        if (model_name_underscore != 'res_users') {
            xmlWriter.writeLine('<!-- action window -->');
            xmlWriter.writeLine('<record id="action_' + elem_name + '" model="ir.actions.act_window">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + model_name_title + '</field>');
            xmlWriter.writeLine('<field name="type">ir.actions.act_window</field>');
            xmlWriter.writeLine('<field name="res_model">' + model_name_dot + '</field>');
            if (odooVersion < 12) {
                xmlWriter.writeLine('<field name="view_type">form</field>');
            }
            let line = '<field name="view_mode">tree,form';
            line += '</field>';
            xmlWriter.writeLine(line);
            xmlWriter.writeLine('<field name="context">{"search_default_fieldname":1}</field>');
            xmlWriter.writeLine('<field name="help" type="html">');
            xmlWriter.indent();
            xmlWriter.writeLine('<p class="oe_view_nocontent_create">');
            xmlWriter.writeLine('Click to add a new ' + model_name_title);
            xmlWriter.writeLine('</p><p>');
            xmlWriter.writeLine('Click the Create button to add a new ' + model_name_title);
            xmlWriter.writeLine('</p>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');

            xmlWriter.writeLine();
            const parentMenu = state_field_exist ? folderName + '_sub_menu' : folderName + '_config_menu';
            xmlWriter.writeLine('<menuitem id="menu_' + elem_name + '" name="' + model_name_title + '" parent="' + parentMenu + '" action="action_' + elem_name + '" sequence="' + sequence + '"/>');
        }

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');
    }

    writeInheritedXML(xmlWriter, elem, options, folderName, sequence) {
        const self = this;
        const normal_fields = [];
        const o2m_fields = [];
        const m2o_fields = [];
        const m2m_fields = [];
        const addonName = options.addonName;
        const odooVersion = options.odooVersion;
        const model_name_underscore = this.getModelName(elem, options, '_');
        const model_name_dot = this.getModelName(elem, options, '.');
        const model_name_title = this.sentenceCase(elem.name, options);
        let date_field_exist = false;
        let date_field = '';
        let image_field_exist = false;
        let state_field_exist = false;
        const is_inherit = this.checkInherit(elem);
        const elem_name = elem.name;

        // Determine inherited view references
        let ref_tree = '', ref_form = '', ref_search = '';
        if (is_inherit) {
            if (model_name_dot == 'res.partner') {
                ref_tree = 'base.view_partner_tree';
                ref_form = 'base.view_partner_form';
                ref_search = 'base.view_res_partner_filter';
            } else if (model_name_dot == 'res.users') {
                ref_tree = 'base.view_users_tree';
                ref_form = 'base.view_users_form';
                ref_search = 'base.view_users_search';
            } else if (model_name_dot == 'res.currency') {
                ref_tree = 'base.view_currency_tree';
                ref_form = 'base.view_currency_form';
                ref_search = 'base.view_currency_search';
            } else if (model_name_dot == 'account.account') {
                ref_tree = 'account.view_account_list';
                ref_form = 'account.view_account_form';
                ref_search = 'account.view_account_search';
            } else if (model_name_dot == 'account.journal') {
                ref_tree = 'account.view_account_journal_tree';
                ref_form = 'account.view_account_journal_form';
                ref_search = 'account.view_account_journal_search';
            } else if (model_name_dot == 'hr.employee') {
                ref_tree = 'hr.view_employee_tree';
                ref_form = 'hr.view_employee_form';
                ref_search = 'hr.view_employee_filter';
            }
        } else {
            ref_tree = folderName + '.view_' + model_name_underscore + '_tree';
            ref_form = folderName + '.view_' + model_name_underscore + '_form';
            ref_search = folderName + '.view_' + model_name_underscore + '_search';
        }

        // get fields names
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name && attr.name !== '_name' && attr.name !== '_inherit') {
                normal_fields.push(attr);
                if (attr.type === 'Date' || attr.type === 'Datetime') {
                    date_field_exist = true;
                    date_field = attr.name;
                }
                if (attr.name === 'image_small') {
                    image_field_exist = true;
                }
                if (attr.name === 'state') {
                    state_field_exist = true;
                }
            }
        });

        const associations = elem.getRelationships().filter(rel => rel instanceof type.Association);
        for (let i = 0, len = associations.length; i < len; i++) {
            const asso = associations[i];
            if (asso.end1.reference === elem && asso.end1.name) {
                if (asso.end1.multiplicity == '0..*' || asso.end1.multiplicity == '1..*') {
                    m2o_fields.push(asso.end1);
                } else if (asso.end1.multiplicity == '*') {
                    m2m_fields.push(asso.end1);
                }
            }
            if (asso.end2.reference === elem && asso.end2.name) {
                if (asso.end2.multiplicity == '1') {
                    o2m_fields.push(asso.end2);
                } else if (asso.end2.multiplicity == '*') {
                    m2m_fields.push(asso.end2);
                }
            }
        }

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>');
        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();
        xmlWriter.writeLine('<data>');
        xmlWriter.indent();

        xmlWriter.writeLine('<!-- tree view -->');
        xmlWriter.writeLine('<!--record id="view_' + elem_name + '_tree" model="ir.ui.view">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">' + elem_name + '_tree</field>');
        xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
        xmlWriter.writeLine('<field name="type">tree</field>');
        xmlWriter.writeLine('<field name="inherit_id" ref="' + ref_tree + '"/>');
        xmlWriter.writeLine('<field name="arch" type="xml">');
        xmlWriter.indent();
        xmlWriter.outdent();
        xmlWriter.writeLine('</field>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record-->');

        xmlWriter.writeLine('<!-- form view -->');
        xmlWriter.writeLine('<record id="view_' + elem_name + '_form" model="ir.ui.view">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">' + elem_name + '_form</field>');
        xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
        xmlWriter.writeLine('<field name="type">form</field>');
        xmlWriter.writeLine('<field name="inherit_id" ref="' + ref_form + '"/>');
        xmlWriter.writeLine('<field name="arch" type="xml">');
        xmlWriter.indent();
        xmlWriter.outdent();
        xmlWriter.writeLine('</field>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record>');

        xmlWriter.writeLine('<!-- search -->');
        xmlWriter.writeLine('<!--record id="view_' + elem_name + '_search" model="ir.ui.view">');
        xmlWriter.indent();
        xmlWriter.writeLine('<field name="name">' + elem_name + '</field>');
        xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
        xmlWriter.writeLine('<field name="inherit_id" ref="' + ref_search + '"/>');
        xmlWriter.writeLine('<field name="arch" type="xml">');
        xmlWriter.indent();
        xmlWriter.outdent();
        xmlWriter.writeLine('</field>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</record-->');

        if (model_name_underscore != 'res_users') {
            xmlWriter.writeLine('<!-- action window -->');
            xmlWriter.writeLine('<record id="' + folderName + '.action_' + elem_name + '" model="ir.actions.act_window">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + model_name_title + '</field>');
            xmlWriter.writeLine('<field name="type">ir.actions.act_window</field>');
            xmlWriter.writeLine('<field name="res_model">' + model_name_dot + '</field>');
            if (odooVersion < 12) {
                xmlWriter.writeLine('<field name="view_type">form</field>');
            }
            let line = '<field name="view_mode">tree,form';
            if (!is_inherit) {
                line += ',kanban,pivot';
                if (date_field_exist) line += ',calendar';
                if (m2o_fields.length > 0) line += ',graph';
            }
            line += '</field>';
            xmlWriter.writeLine(line);
            xmlWriter.writeLine('<field name="context">{"search_default_fieldname":1}</field>');
            xmlWriter.writeLine('<field name="domain">[]</field>');
            xmlWriter.writeLine('<field name="help" type="html">');
            xmlWriter.indent();
            xmlWriter.writeLine('<p class="oe_view_nocontent_create">');
            xmlWriter.writeLine('Click to add a new ' + model_name_title);
            xmlWriter.writeLine('</p><p>');
            xmlWriter.writeLine('Click the Create button to add a new ' + model_name_title);
            xmlWriter.writeLine('</p>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');

            xmlWriter.writeLine();
            const parentMenu = state_field_exist ? folderName + '.' + folderName + '_sub_menu' : folderName + '.' + folderName + '_config_menu';
            xmlWriter.writeLine('<menuitem active="1" id="' + folderName + '.menu_' + elem_name + '" name="' + model_name_title + '" parent="' + parentMenu + '" action="' + folderName + '.action_' + elem_name + '" sequence="' + sequence + '"/>');
        }

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');
    }

    writeSequenceXML(basePath, elem, options, isInheritedModule, folderName) {
        let state_field_exist = false;
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name === 'state') {
                state_field_exist = true;
            }
        });

        if (!state_field_exist) return;

        const fullPath = basePath + '/data/sequence_' + elem.name + '.xml';
        const xmlWriter = new codegen.CodeWriter(this.getIndentString(options));
        const model_name_dot = this.getModelName(elem, options, '.');
        const model_name_title = this.sentenceCase(elem.name, options);
        const sequence_name = 'sequence_' + elem.name;

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>');
        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();

        if (isInheritedModule) {
            xmlWriter.writeLine('<data >');
            xmlWriter.indent();
            xmlWriter.writeLine('<function name="write" model="ir.model.data">');
            xmlWriter.indent();
            xmlWriter.writeLine('<function name="search" model="ir.model.data">');
            xmlWriter.indent();
            xmlWriter.writeLine('<value eval="[(\'module\', \'=\', \'' + folderName + '\'), (\'name\', \'=\', \'' + sequence_name + '\')]"/>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</function>');
            xmlWriter.writeLine('<value eval="{\'noupdate\': False}" /> ');
            xmlWriter.outdent();
            xmlWriter.writeLine('</function>');

            xmlWriter.writeLine('<record id="' + folderName + '.' + sequence_name + '" model="ir.sequence">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + sequence_name + '</field>');
            xmlWriter.writeLine('<field name="code">' + model_name_dot + '</field>');
            xmlWriter.writeLine('<field name="prefix">X/%(year)s/%(month)s/</field>');
            xmlWriter.writeLine('<field name="padding">3</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');

            xmlWriter.writeLine('<function name="write" model="ir.model.data">');
            xmlWriter.indent();
            xmlWriter.writeLine('<function name="search" model="ir.model.data">');
            xmlWriter.indent();
            xmlWriter.writeLine('<value eval="[(\'module\', \'=\', \'' + folderName + '\'), (\'name\', \'=\', \'' + sequence_name + '\')]"/>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</function>');
            xmlWriter.writeLine('<value eval="{\'noupdate\': True}" />');
            xmlWriter.outdent();
            xmlWriter.writeLine('</function>');
        } else {
            xmlWriter.writeLine('<data noupdate="1">');
            xmlWriter.indent();
            xmlWriter.writeLine('<record id="' + sequence_name + '" model="ir.sequence">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + sequence_name + '</field>');
            xmlWriter.writeLine('<field name="code">' + model_name_dot + '</field>');
            xmlWriter.writeLine('<field name="prefix">' + model_name_title.slice(0, 3).toUpperCase() + '/%(year)s/%(month)s/</field>');
            xmlWriter.writeLine('<field name="padding">3</field>');
            xmlWriter.writeLine('<field name="number_next_actual">1</field>');
            xmlWriter.writeLine('<field name="number_increment">1</field>');
            xmlWriter.writeLine('<field name="implementation">standard</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');
        }

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');

        fs.writeFileSync(fullPath, xmlWriter.getData());
    }

    writeReport(xmlWriter, elem, options, folderName) {
        const self = this;
        const normal_fields = [];
        const o2m_fields = [];
        const m2o_fields = [];
        const addonName = options.addonName;
        const model_name_underscore = this.getModelName(elem, options, '_');
        const model_name_dot = this.getModelName(elem, options, '.');
        const model_name_title = this.sentenceCase(elem.name, options);
        let date_field_exist = false;
        let date_field = '';
        let image_field_exist = false;
        const odooVersion = options.odooVersion;

        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name && attr.name !== '_name' && attr.name !== '_inherit') {
                normal_fields.push(attr);
                if (attr.type === 'Date' || attr.type === 'Datetime') {
                    date_field_exist = true;
                    date_field = attr.name;
                }
                if (attr.name === 'image_small') {
                    image_field_exist = true;
                }
            }
        });

        const associations = elem.getRelationships().filter(rel => rel instanceof type.Association);
        for (let i = 0, len = associations.length; i < len; i++) {
            const asso = associations[i];
            if (asso.end1.reference === elem && asso.end1.name) {
                m2o_fields.push(asso.end1);
            }
            if (asso.end2.reference === elem && asso.end2.name) {
                o2m_fields.push(asso.end2);
            }
        }

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>');
        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();
        xmlWriter.writeLine('<data>');
        xmlWriter.indent();

        xmlWriter.writeLine('<!-- report qweb view -->');

        if (odooVersion < 13) {
            xmlWriter.writeLine('<report id="report_' + model_name_underscore + '_menu" string="' + this.sentenceCase(addonName, options) + ' - ' + model_name_title + '"');
            xmlWriter.writeLine(' model="' + model_name_dot + '" report_type="qweb-pdf" ');
            xmlWriter.writeLine(' file="' + model_name_dot + '"  name="' + folderName + '.' + model_name_underscore + '_report" />');
            xmlWriter.writeLine();
        } else {
            xmlWriter.writeLine('<record id="action_report_' + model_name_underscore + '" model="ir.actions.report">');
            xmlWriter.indent();
            xmlWriter.writeLine('<field name="name">' + model_name_title + '</field>');
            xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>');
            xmlWriter.writeLine('<field name="report_type">qweb-pdf</field>');
            xmlWriter.writeLine('<field name="report_name">' + folderName + '.' + model_name_underscore + '_report</field>');
            xmlWriter.writeLine('<field name="report_file">' + folderName + '.' + model_name_underscore + '_report</field>');
            xmlWriter.writeLine('<field name="print_report_name">object.name</field>');
            xmlWriter.writeLine('<field name="binding_model_id" ref="' + folderName + '.model_' + model_name_underscore + '"/>');
            xmlWriter.writeLine('<field name="binding_type">report</field>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</record>');
        }

        xmlWriter.writeLine('<!-- document template -->');
        xmlWriter.writeLine('<template id="' + folderName + '.' + model_name_underscore + '_report_document" >');
        xmlWriter.indent();
        xmlWriter.writeLine('<t t-call="web.external_layout">');
        xmlWriter.indent();
        xmlWriter.writeLine('<t t-set="doc" t-value="doc.with_context({\'lang\': lang})"/>');
        xmlWriter.writeLine('<div class="page">');
        xmlWriter.indent();

        xmlWriter.writeLine('<h2>');
        xmlWriter.indent();
        xmlWriter.writeLine(model_name_title + ': <span t-field="doc.name"/>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</h2>');

        xmlWriter.writeLine('<div class="row mt32 mb32">');
        xmlWriter.indent();
        normal_fields.forEach(field => {
            if (field.name !== 'name') {
                xmlWriter.writeLine('<div class="col-auto mw-100 mb-2">');
                xmlWriter.indent();
                xmlWriter.writeLine('<strong>' + self.sentenceCase(field.name, options) + '</strong>');
                if (field.name == 'image_small') {
                    xmlWriter.writeLine('<img alt="" class="m-0" style="width:100px" t-attf-src="data:image/*;base64,{{doc.' + field.name + '}}" />');
                } else if (field.type != 'Binary') {
                    xmlWriter.writeLine('<p class="m-0" t-field="doc.' + field.name + '" />');
                }
                xmlWriter.outdent();
                xmlWriter.writeLine('</div>');
            }
        });
        m2o_fields.forEach(field => {
            xmlWriter.writeLine('<div class="col-auto mw-100 mb-2">');
            xmlWriter.indent();
            xmlWriter.writeLine('<strong>' + self.sentenceCase(field.name, options) + '</strong>');
            xmlWriter.writeLine('<p class="m-0" t-field="doc.' + field.name + '"/>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</div>');
        });
        xmlWriter.outdent();
        xmlWriter.writeLine('</div>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</div>');

        xmlWriter.writeLine('<div class="oe_structure"/>');

        o2m_fields.forEach(field => {
            const end1 = field._parent.end1.reference;
            const comodel_normal_fields = end1.ownedElements.filter(owned => owned instanceof type.Property);
            const comodel_m2o_fields = [];
            const associations2 = end1.getRelationships().filter(rel => rel instanceof type.Association);
            for (let i = 0, len = associations2.length; i < len; i++) {
                const asso = associations2[i];
                if (asso.end1.reference === end1 && asso.end1.name) {
                    comodel_m2o_fields.push(asso.end1);
                }
            }

            xmlWriter.writeLine('<h2>' + self.sentenceCase(field.name, options) + '</h2>');
            xmlWriter.writeLine('<table class="table table-sm o_main_table" name="' + field.name + '_table">');
            xmlWriter.indent();
            xmlWriter.writeLine('<thead>');
            xmlWriter.indent();
            xmlWriter.writeLine('<tr>');
            xmlWriter.indent();
            comodel_normal_fields.forEach(f => {
                xmlWriter.writeLine('<td>' + self.sentenceCase(f.name, options) + '</td>');
            });
            comodel_m2o_fields.forEach(f => {
                xmlWriter.writeLine('<td>' + self.sentenceCase(f.name, options) + '</td>');
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</tr>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</thead>');
            xmlWriter.writeLine('<tbody class="' + field.name + '_tbody">');
            xmlWriter.indent();
            xmlWriter.writeLine('<tr t-foreach="doc.' + field.name + '" t-as="line">');
            xmlWriter.indent();
            comodel_normal_fields.forEach(f => {
                xmlWriter.writeLine('<td><span t-field="line.' + f.name + '" /></td>');
            });
            comodel_m2o_fields.forEach(f => {
                xmlWriter.writeLine('<td><span t-field="line.' + f.name + '" /></td>');
            });
            xmlWriter.outdent();
            xmlWriter.writeLine('</tr> <!-- foreach-->');
            xmlWriter.outdent();
            xmlWriter.writeLine('</tbody>');
            xmlWriter.outdent();
            xmlWriter.writeLine('</table>');
            xmlWriter.writeLine('<div class="oe_structure"/>');
        });

        xmlWriter.outdent();
        xmlWriter.writeLine('</t>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</template>');

        xmlWriter.writeLine();
        xmlWriter.writeLine('<!-- main template -->');
        xmlWriter.writeLine('<template id="' + folderName + '.' + model_name_underscore + '_report">');
        xmlWriter.indent();
        xmlWriter.writeLine('<t t-call="web.html_container">');
        xmlWriter.indent();
        xmlWriter.writeLine('<t t-foreach="docs" t-as="doc">');
        xmlWriter.indent();
        xmlWriter.writeLine('<t t-set="lang" t-value="doc.create_uid.lang"/>');
        xmlWriter.writeLine('<t t-call="' + folderName + '.' + model_name_underscore + '_report_document" />');
        xmlWriter.outdent();
        xmlWriter.writeLine('</t>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</t>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</template>');
        xmlWriter.writeLine();

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');
    }

    writeTopMenuXML(xmlWriter, options, folderName) {
        const addonName = folderName;
        const appName = options.appName;
        let line = '';

        xmlWriter.writeLine('<odoo>');
        xmlWriter.indent();
        xmlWriter.writeLine('<data>');
        xmlWriter.indent();

        line = '<menuitem id="' + addonName + '_top_menu" ';
        line += 'name="' + appName + '" ';
        line += 'sequence="20" ';
        line += 'web_icon="' + addonName + ',static/description/icon.png" ';
        line += '/>';
        xmlWriter.writeLine(line);

        line = '<menuitem id="' + addonName + '_sub_menu" ';
        line += 'name="Operations" ';
        line += 'sequence="40" ';
        line += 'parent="' + addonName + '_top_menu" ';
        line += '/>';
        xmlWriter.writeLine(line);

        line = '<menuitem id="' + addonName + '_config_menu" ';
        line += 'name="Configurations" ';
        line += 'sequence="50" ';
        line += 'parent="' + addonName + '_top_menu" ';
        line += '/>';
        xmlWriter.writeLine(line);

        xmlWriter.outdent();
        xmlWriter.writeLine('</data>');
        xmlWriter.outdent();
        xmlWriter.writeLine('</odoo>');
    }

    /**
     * Generate codes from a given element
     * @param {type.Element} elem
     * @param {string} basePath
     * @param {Object} options
     * @param {string} folderName
     * @param {boolean} inheritedModule
     * @param {number} sequence
     * @returns {Promise}
     */
    generate(elem, basePath, options, folderName, inheritedModule, sequence) {
        let fullPath, codeWriter, xmlWriter;

        // Package (a directory with __init__.py)
        if (elem instanceof type.Package) {
            fullPath = path.join(basePath, elem.name);
            fs.mkdirSync(fullPath);
            const file = path.join(fullPath, '__init__.py');
            fs.writeFileSync(file, '');
            elem.ownedElements.forEach(child => {
                this.generate(child, fullPath, options, folderName, inheritedModule, sequence);
            });
        } else if (elem instanceof type.Class || elem instanceof type.Interface) {
            // generate py
            fullPath = basePath + '/model/' + elem.name + '.py';
            codeWriter = new codegen.CodeWriter(this.getIndentString(options));
            codeWriter.writeLine('#-*- coding: utf-8 -*-');
            codeWriter.writeLine();

            this.writeClass(codeWriter, elem, options);
            fs.writeFileSync(fullPath, codeWriter.getData());

            // generate view XML
            fullPath = basePath + '/view/' + elem.name + '.xml';
            xmlWriter = new codegen.CodeWriter(this.getIndentString(options));
            this.writeXML(xmlWriter, elem, options, folderName, sequence);
            fs.writeFileSync(fullPath, xmlWriter.getData());

            // generate report XML
            fullPath = basePath + '/report/' + elem.name + '.xml';
            xmlWriter = new codegen.CodeWriter(this.getIndentString(options));
            this.writeReport(xmlWriter, elem, options, folderName);
            fs.writeFileSync(fullPath, xmlWriter.getData());

            // generate sequence XML
            this.writeSequenceXML(basePath, elem, options, false, folderName);
        } else if (elem instanceof type.Enumeration) {
            fullPath = basePath + '/' + elem.name + '.py';
            codeWriter = new codegen.CodeWriter(this.getIndentString(options));
            codeWriter.writeLine('#-*- coding: utf-8 -*-');
            codeWriter.writeLine();
            this.writeEnum(codeWriter, elem, options);
            fs.writeFileSync(fullPath, codeWriter.getData());
        } else {
            // Nothing generated
        }
        return Promise.resolve();
    }

    lowerFirst(string) {
        return string.replace(/^[A-Z]/, m => m.toLowerCase());
    }

    kebabCase(string) {
        return this.lowerFirst(string).replace(/([A-Z])/g, (m, g) => '-' + g.toLowerCase()).replace(/[\s\-_]+/g, '-');
    }

    capitalise(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    sentenceCase(string, options) {
        const english = options.en_language;
        let res = this.capitalise(this.kebabCase(string).replace(/(-)/g, ' '));
        if (english)
            return res.replace(/ ids/g, 's').replace(/ id/g, '');
        else
            return res.replace(/ ids/g, '').replace(/ id/g, '');
    }

    getModelName(elem, options, separator) {
        let _name_value = '';
        let has_name = false;
        const addonName = options.addonName;
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        attributes.forEach(attr => {
            if (attr.name == "_name") {
                has_name = true;
                _name_value = attr.defaultValue;
                if (separator == '_') {
                    const res = _name_value.split(".");
                    _name_value = res[0] + separator + res[1];
                }
            }
        });

        if (!has_name) {
            if (!separator) {
                separator = '.';
            }
            _name_value = addonName + separator + elem.name;
        }
        return _name_value;
    }

    checkInherit(elem) {
        let is_inherit = false;
        const attributes = elem.ownedElements.filter(owned => owned instanceof type.Property);
        for (let attr of attributes) {
            if (attr.name === '_name' || attr.name === '_inherit') {
                is_inherit = true;
                break;
            }
        }
        return is_inherit;
    }
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
 * @param {type.Element} base - selected model element (usually a Package)
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
                type.Package   // Use global type.Package
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
        const generator = new OdooCodeGenerator(base, path);
        // The generator's generate method returns a Promise; await it.
        await generator.generate(base, path, options);
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
}

// Export the init function (required by StarUML)
exports.init = init;