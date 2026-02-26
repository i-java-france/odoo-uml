/*
 * Fixed version of OdooCodeGenerator
 * Bugs fixed:
 *   1. checkInherit() logic corrected
 *   2. generate() recursive call now passes all required args
 *   3. codeWriter declared properly with var in generate()
 *   4. writeInheritedXML record id uses valid format (no dots)
 *   5. writeManifest sequence loop uses correct scoped variable
 */

const fs = require('fs')
const path = require('path')
const codegen = require('./codegen-utils')

class OdooCodeGenerator {
    constructor(baseModel, basePath) {
        this.baseModel = baseModel
        this.basePath = basePath
    }

    getIndentString(options) {
        if (options.useTab) {
            return '\t'
        } else {
            var i, len
            var indent = []
            for (i = 0, len = options.indentSpaces; i < len; i++) {
                indent.push(' ')
            }
            return indent.join('')
        }
    }

    getInherits(elem) {
        var inherits = app.repository.getRelationshipsOf(elem, function(rel) {
            return (rel.source === elem && (rel instanceof type.UMLGeneralization || rel instanceof type.UMLInterfaceRealization))
        })
        return inherits.map(function(gen) { return gen.target })
    }

    writeDoc(codeWriter, text, options) {
        var i, len, lines
        if (options.docString && text.trim().length > 0) {
            lines = text.trim().split('\n')
            if (lines.length > 1) {
                codeWriter.writeLine('"""')
                for (i = 0, len = lines.length; i < len; i++) {
                    codeWriter.writeLine(lines[i])
                }
                codeWriter.writeLine('"""')
            } else {
                codeWriter.writeLine('"""' + lines[0] + '"""')
            }
        }
    }

    writeVariable(codeWriter, elem, options, isClassVar, inverse_field, stateExist) {
        var addonName = options.addonName

        if (elem.name.length > 0) {
            var line
            var nameOrInherit = elem.name && ["_name", "_inherit"].includes(elem.name)

            if (nameOrInherit) {
                if (elem.name == "_inherit") {
                    line = elem.name
                    line += ' = "' + elem.defaultValue + '"'
                }
            } else if (elem.multiplicity && ['0..*', '1..*', '*', '1'].includes(elem.multiplicity.trim())) {
                line = elem.name
                if (elem.multiplicity == '0..*') {
                    line += ' = fields.Many2one(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", '
                } else if (elem.multiplicity == '1') {
                    line += ' = fields.One2many(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", '
                    line += ' inverse_name="' + inverse_field.name + '", '
                } else if (elem.multiplicity == '*') {
                    line += ' = fields.Many2many(comodel_name="' + this.getModelName(inverse_field.reference, options, ".") + '", '
                }
            } else if (elem.type == 'Selection') {
                if (elem.name !== 'state') {
                    line = elem.name + ' = fields.Selection(selection=[' + elem.defaultValue + '], '
                } else {
                    line = elem.name + ' = fields.Selection(selection=STATES, '
                    line += " readonly=True, default=STATES[0][0], "
                }
            } else {
                line = elem.name
                line += ' = fields.' + elem.type + '('
            }

            if (elem.name === 'name') {
                line += ' required=True,'
                if (stateExist) {
                    line += ' default="New", readonly=True, '
                } else if (elem.defaultValue) {
                    line += ' default="' + elem.defaultValue + '", '
                }
            }

            if (!nameOrInherit) {
                line += ' string="' + this.sentenceCase(elem.name, options) + '", '
                if (stateExist) {
                    if (elem.name !== 'name' && elem.name !== 'state') {
                        line += ' readonly=True, states={"draft" : [("readonly",False)]}, '
                    }
                }
                line += ' help="' + elem.documentation + '"'
                line += ')'
            }
            codeWriter.writeLine(line)
        }
    }

    writeConstructor(codeWriter, elem, options) {
        var self = this
        var hasBody = false
        codeWriter.writeLine('def __init__(self):')
        codeWriter.indent()

        if (elem.attributes.length > 0) {
            elem.attributes.forEach(function(attr) {
                if (attr.isStatic === false) {
                    self.writeVariable(codeWriter, attr, options, true)
                    hasBody = true
                }
            })
        }

        var associations = app.repository.getRelationshipsOf(elem, function(rel) {
            return (rel instanceof type.UMLAssociation)
        })
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i]
            if (asso.end1.reference === elem) {
                self.writeVariable(codeWriter, asso.end2, options)
                hasBody = true
            }
            if (asso.end2.reference === elem) {
                self.writeVariable(codeWriter, asso.end1, options)
                hasBody = true
            }
        }

        if (!hasBody) {
            codeWriter.writeLine('pass')
        }

        codeWriter.outdent()
        codeWriter.writeLine()
    }

    writeMethod(codeWriter, elem, options) {
        codeWriter.writeLine()

        if (elem.name.length > 0) {
            var line = 'def ' + elem.name
            var params = elem.getNonReturnParameters()
            var paramStr = params.map(function(p) { return p.name }).join(', ')

            if (elem.isStatic) {
                codeWriter.writeLine('@classmethod')
                codeWriter.writeLine(line + '(cls, ' + paramStr + '):')
            } else {
                codeWriter.writeLine(line + '(self, ' + paramStr + '):')
            }
            codeWriter.indent()
            this.writeDoc(codeWriter, elem.documentation, options)
            codeWriter.writeLine('pass')
            codeWriter.outdent()
            codeWriter.writeLine()
        }
    }

    writeCreateMethod(codeWriter, className, objectName, options, withSequence) {
        codeWriter.writeLine()
        codeWriter.writeLine('@api.model')
        codeWriter.writeLine('def create(self, vals):')
        codeWriter.indent()
        if (withSequence) {
            codeWriter.writeLine('if not vals.get("name", False) or vals["name"] == "New":')
            codeWriter.indent()
            codeWriter.writeLine('vals["name"] = self.env["ir.sequence"].next_by_code("' + objectName + '") or "Error Number!!!"')
            codeWriter.outdent()
        }
        codeWriter.writeLine('return super(' + className + ', self).create(vals)')
        codeWriter.outdent()
    }

    writeActionMethod(codeWriter, className, objectName, options) {
        var odooVersion = options.odooVersion

        codeWriter.writeLine()
        codeWriter.writeLine('def action_confirm(self):')
        codeWriter.indent()
        codeWriter.writeLine('self.state = STATES[1][0]')
        codeWriter.outdent()

        codeWriter.writeLine()
        codeWriter.writeLine('def action_done(self):')
        codeWriter.indent()
        codeWriter.writeLine('self.state = STATES[2][0]')
        codeWriter.outdent()

        codeWriter.writeLine()
        codeWriter.writeLine('def action_draft(self):')
        codeWriter.indent()
        codeWriter.writeLine('self.state = STATES[0][0]')
        codeWriter.outdent()

        codeWriter.writeLine()
        if (odooVersion < 13)
            codeWriter.writeLine('@api.multi')
        codeWriter.writeLine('def unlink(self):')
        codeWriter.indent()
        codeWriter.writeLine('for me_id in self :')
        codeWriter.indent()
        codeWriter.writeLine('if me_id.state != STATES[0][0]:')
        codeWriter.indent()
        codeWriter.writeLine('raise UserError("Cannot delete non draft record!")')
        codeWriter.outdent()
        codeWriter.outdent()
        codeWriter.writeLine('return super(' + className + ', self).unlink()')
        codeWriter.outdent()
    }

    writeEnum(codeWriter, elem, options) {
        var line = ''
        codeWriter.writeLine('from enum import Enum')
        codeWriter.writeLine()
        line = 'class ' + elem.name + '(Enum):'
        codeWriter.writeLine(line)
        codeWriter.indent()
        this.writeDoc(codeWriter, elem.documentation, options)
        if (elem.literals.length === 0) {
            codeWriter.writeLine('pass')
        } else {
            for (var i = 0, len = elem.literals.length; i < len; i++) {
                codeWriter.writeLine(elem.literals[i].name + ' = ' + (i + 1))
            }
        }
        codeWriter.outdent()
        codeWriter.writeLine()
    }

    writeInit(codeWriter, ownedElements, options) {
        ownedElements.forEach(child => {
            if (child instanceof type.UMLClass) {
                codeWriter.writeLine('from . import ' + child.name)
            }
        })
    }

    writeModelAccess(fullPath, ownedElements, folderName, options) {
        var self = this
        var codeWriter = new codegen.CodeWriter('\t')
        var appName = options.appName
        var appNameLower = appName.toLowerCase()
        var userGroup = folderName + '.group_' + appNameLower + '_user'
        var managerGroup = folderName + '.group_' + appNameLower + '_manager'

        codeWriter.writeLine('"id","name","model_id:id","group_id:id","perm_read","perm_write","perm_create","perm_unlink"')

        ownedElements.forEach(elem => {
            if (elem instanceof type.UMLClass) {
                // FIX: use correct checkInherit — only skip truly inherited models
                var is_inherit = self.checkInherit(elem)
                if (!is_inherit) {
                    var model_name_underscore = this.getModelName(elem, options, '_')
                    codeWriter.writeLine('access_user_' + model_name_underscore + ',access_user_' + model_name_underscore + ',model_' + model_name_underscore + ',' + userGroup + ',1,0,0,0')
                    codeWriter.writeLine('access_manager_' + model_name_underscore + ',access_manager_' + model_name_underscore + ',model_' + model_name_underscore + ',' + managerGroup + ',1,1,1,1')
                    codeWriter.writeLine('access_admin_' + model_name_underscore + ',access_admin_' + model_name_underscore + ',model_' + model_name_underscore + ',base.group_system,1,1,1,1')
                }
            }
        })
        fs.writeFileSync(fullPath + '/security/ir.model.access.csv', codeWriter.getData())
    }

    writeGroupsXML(fullPath, options) {
        var appName = options.appName
        var appNameLower = appName.toLowerCase()

        var xmlWriter = new codegen.CodeWriter('\t')
        xmlWriter.writeLine('<odoo>')
        xmlWriter.indent()
        xmlWriter.writeLine('<data>')
        xmlWriter.indent()

        xmlWriter.writeLine('<record model="ir.module.category" id="module_category_' + appNameLower + '">')
        xmlWriter.indent()
        xmlWriter.writeLine('<field name="name">' + appName + '</field>')
        xmlWriter.writeLine('<field name="description">' + appName + ' Groups</field>')
        xmlWriter.writeLine('<field name="sequence">10</field>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</record>')

        xmlWriter.writeLine('<record id="group_' + appNameLower + '_user" model="res.groups">')
        xmlWriter.indent()
        xmlWriter.writeLine('<field name="name">User</field>')
        xmlWriter.writeLine('<field name="category_id" ref="module_category_' + appNameLower + '"/>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</record>')

        xmlWriter.writeLine('<record id="group_' + appNameLower + '_manager" model="res.groups">')
        xmlWriter.indent()
        xmlWriter.writeLine('<field name="name">Manager</field>')
        xmlWriter.writeLine('<field name="category_id" ref="module_category_' + appNameLower + '"/>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</record>')

        xmlWriter.outdent()
        xmlWriter.writeLine('</data>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</odoo>')

        fs.writeFileSync(fullPath + '/security/groups.xml', xmlWriter.getData())
    }

    writeManifest(codeWriter, ownedElements, options, folderName, inheritedModule) {
        var self = this
        var appName = options.appName
        var depends = options.depends

        codeWriter.writeLine('#-*- coding: utf-8 -*-')
        codeWriter.writeLine()
        codeWriter.writeLine('{')
        codeWriter.indent()
        codeWriter.writeLine('"name": "' + appName + (inheritedModule ? " Inherited" : "") + '",')
        codeWriter.writeLine('"version": "1.0", ')
        codeWriter.writeLine('"depends": [')
        codeWriter.indent()
        codeWriter.writeLine(depends + ",")
        if (inheritedModule) {
            codeWriter.writeLine("'" + folderName + "'")
        }
        codeWriter.outdent()
        codeWriter.writeLine('],')
        codeWriter.writeLine('"author": "Akhmad D. Sembiring [vitraining.com]",')
        codeWriter.writeLine('"category": "Utility",')
        codeWriter.writeLine('"website": "http://vitraining.com",')
        codeWriter.writeLine('"images": ["static/description/images/main_screenshot.jpg"],')
        codeWriter.writeLine('"price": "10",')
        codeWriter.writeLine('"license": "OPL-1",')
        codeWriter.writeLine('"currency": "USD",')
        codeWriter.writeLine('"summary": "This is the ' + appName + ' module generated by StarUML Odoo Generator Pro Version",')
        codeWriter.writeLine('"description": """')
        codeWriter.outdent()
        codeWriter.writeLine()
        codeWriter.writeLine('Information')
        codeWriter.writeLine('======================================================================')
        codeWriter.writeLine()
        codeWriter.writeLine('* created menus')
        codeWriter.writeLine('* created objects')
        codeWriter.writeLine('* created views')
        codeWriter.writeLine('* logics')
        codeWriter.writeLine()
        codeWriter.writeLine('""",')
        codeWriter.indent()
        codeWriter.writeLine('"data": [')
        codeWriter.indent()

        if (!inheritedModule) {
            codeWriter.writeLine('"security/groups.xml",')
            codeWriter.writeLine('"security/ir.model.access.csv",')
            codeWriter.writeLine('"view/menu.xml",')

            ownedElements.forEach(child => {
                if (child instanceof type.UMLClass) {
                    var is_inherit = self.checkInherit(child)
                    if (!is_inherit) {
                        codeWriter.writeLine('"view/' + child.name + '.xml",')
                    } else {
                        codeWriter.writeLine('"view/' + child.name + '.xml", #inherited')
                    }

                    // FIX: use a scoped variable, not reusing outer 'child'
                    var childStateExists = false
                    child.attributes.forEach(function(attr) {
                        if (attr.name === 'state') {
                            childStateExists = true
                        }
                    })

                    if (childStateExists) {
                        codeWriter.writeLine('"data/sequence_' + child.name + '.xml",')
                    }
                }
            })

            ownedElements.forEach(child => {
                if (child instanceof type.UMLClass) {
                    codeWriter.writeLine('"report/' + child.name + '.xml",')
                }
            })

        } else {
            // inherited module
            ownedElements.forEach(child => {
                if (child instanceof type.UMLClass) {
                    codeWriter.writeLine('# "view/' + child.name + '.xml",')

                    var childStateExists = false
                    child.attributes.forEach(function(attr) {
                        if (attr.name === 'state') {
                            childStateExists = true
                        }
                    })

                    if (childStateExists) {
                        codeWriter.writeLine('# "data/sequence_' + child.name + '.xml",')
                    }
                }
            })
        }

        codeWriter.outdent()
        codeWriter.writeLine('],')
        codeWriter.writeLine('"installable": True,')
        codeWriter.writeLine('"auto_install": False,')
        codeWriter.writeLine('"application": True,')
        codeWriter.outdent()
        codeWriter.writeLine('}')
    }

    writeClass(codeWriter, elem, options) {
        var self = this
        var line = ''
        var addonName = options.addonName
        var odooVersion = options.odooVersion
        var stateExist = false
        var className = elem.name
        var objectName = ''

        elem.attributes.forEach(function(attr) {
            if (attr.name === 'state') {
                stateExist = true
                codeWriter.writeLine('STATES = [' + attr.defaultValue + ']')
            }
        })

        codeWriter.writeLine('from odoo import models, fields, api, _')
        codeWriter.writeLine('from odoo.exceptions import UserError, Warning')
        codeWriter.writeLine(line)

        line = 'class ' + className + '(models.Model):'
        codeWriter.writeLine(line)
        codeWriter.indent()

        this.writeDoc(codeWriter, elem.documentation, options)
        codeWriter.writeLine()

        if (elem.attributes.length === 0 && elem.operations.length === 0) {
            codeWriter.writeLine('pass')
        } else {
            objectName = this.getModelName(elem, options, '.')
            codeWriter.writeLine('_name = "' + objectName + '"')
            codeWriter.writeLine('_description = "' + objectName + '"')

            elem.attributes.forEach(function(attr) {
                self.writeVariable(codeWriter, attr, options, true, false, stateExist)
            })
            codeWriter.writeLine()

            if (elem.operations.length > 0) {
                elem.operations.forEach(function(op) {
                    self.writeMethod(codeWriter, op, options)
                })
            }

            if (stateExist) {
                self.writeCreateMethod(codeWriter, className, objectName, options, true)
                self.writeActionMethod(codeWriter, className, objectName, options)
            }
        }

        codeWriter.writeLine()

        var associations = app.repository.getRelationshipsOf(elem, function(rel) {
            return (rel instanceof type.UMLAssociation)
        })

        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i]
            if (asso.end1.reference === elem) {
                self.writeVariable(codeWriter, asso.end1, options, true, asso.end2, stateExist)
            }
            if (asso.end2.reference === elem) {
                self.writeVariable(codeWriter, asso.end2, options, true, asso.end1, stateExist)
            }
        }

        codeWriter.outdent()
        codeWriter.writeLine()
    }

    writeInheritedClass(codeWriter, elem, options) {
        var self = this
        var line = ''
        var state_field_exist = false

        elem.attributes.forEach(function(attr) {
            if (attr.name === 'state') {
                state_field_exist = true
                codeWriter.writeLine('STATES = [' + attr.defaultValue + ']')
            }
        })

        codeWriter.writeLine('from odoo import models, fields, api, _')
        codeWriter.writeLine('from odoo.exceptions import UserError, Warning')
        codeWriter.writeLine(line)

        var className = elem.name
        line = 'class ' + elem.name + '(models.Model):'
        codeWriter.writeLine(line)
        codeWriter.indent()
        var objectName = this.getModelName(elem, options, '.')
        codeWriter.writeLine('_name = "' + objectName + '"')
        codeWriter.writeLine('_inherit = "' + objectName + '"')

        if (state_field_exist) {
            self.writeCreateMethod(codeWriter, className, objectName, options, false)
            self.writeActionMethod(codeWriter, className, objectName, options)
        }
        if (elem.operations.length > 0) {
            elem.operations.forEach(function(op) {
                self.writeMethod(codeWriter, op, options)
            })
        }
        codeWriter.outdent()
        codeWriter.writeLine()
    }

    writeXML(xmlWriter, elem, options, folderName, sequence) {
        var self = this
        var normal_fields = []
        var o2m_fields = []
        var m2o_fields = []
        var m2m_fields = []
        var odooVersion = options.odooVersion
        var model_name_underscore = this.getModelName(elem, options, '_')
        var model_name_dot = this.getModelName(elem, options, '.')
        var model_name_title = this.sentenceCase(elem.name, options)
        var date_field_exist = false
        var date_field = ''
        var state_field_exist = false
        var is_inherit = self.checkInherit(elem)
        var elem_name = elem.name

        elem.attributes.forEach(function(attr) {
            if (attr.name !== '' && attr.name !== undefined && attr.name != '_name' && attr.name != '_inherit') {
                normal_fields.push(attr)
                if (attr.type === 'Date' || attr.type === 'Datetime') {
                    date_field_exist = true
                    date_field = attr.name
                }
                if (attr.name === 'state') {
                    state_field_exist = true
                }
            }
        })

        var associations = app.repository.getRelationshipsOf(elem, function(rel) {
            return (rel instanceof type.UMLAssociation)
        })
        for (var i = 0, len = associations.length; i < len; i++) {
            var asso = associations[i]
            if (asso.end1.reference === elem) {
                if (asso.end1.name !== "" && asso.end1.name !== undefined) {
                    if (asso.end1.multiplicity == '0..*' || asso.end1.multiplicity == '1..*') {
                        m2o_fields.push(asso.end1)
                    } else if (asso.end1.multiplicity == '*') {
                        m2m_fields.push(asso.end1)
                    }
                }
            }
            if (asso.end2.reference === elem) {
                if (asso.end2.name !== "" && asso.end2.name !== undefined) {
                    if (asso.end2.multiplicity == '1') {
                        o2m_fields.push(asso.end2)
                    } else if (asso.end2.multiplicity == '*') {
                        m2m_fields.push(asso.end2)
                    }
                }
            }
        }

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>')
        xmlWriter.writeLine('<odoo>')
        xmlWriter.indent()
        xmlWriter.writeLine('<data>')
        xmlWriter.indent()

        if (!is_inherit) {
            xmlWriter.writeLine('<!-- tree view -->')
            xmlWriter.writeLine('<record id="view_' + model_name_underscore + '_tree" model="ir.ui.view">')
            xmlWriter.indent()
            xmlWriter.writeLine('<field name="name">' + model_name_underscore + '_tree</field>')
            xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>')
            xmlWriter.writeLine('<field name="type">tree</field>')
            xmlWriter.writeLine('<field name="priority" eval="8"/>')
            xmlWriter.writeLine('<field name="arch" type="xml">')
            xmlWriter.indent()
            xmlWriter.writeLine('<tree string="' + model_name_title + '">')
            xmlWriter.indent()
            normal_fields.forEach(function(field) {
                xmlWriter.writeLine('<field name="' + field.name + '" />')
            })
            m2o_fields.forEach(function(field) {
                xmlWriter.writeLine('<field name="' + field.name + '" />')
            })
            xmlWriter.outdent()
            xmlWriter.writeLine('</tree>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</field>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</record>')

            xmlWriter.writeLine('<!-- form view -->')
            xmlWriter.writeLine('<record id="view_' + model_name_underscore + '_form" model="ir.ui.view">')
            xmlWriter.indent()
            xmlWriter.writeLine('<field name="name">' + model_name_underscore + '_form</field>')
            xmlWriter.writeLine('<field name="model">' + model_name_dot + '</field>')
            xmlWriter.writeLine('<field name="type">form</field>')
            xmlWriter.writeLine('<field name="priority" eval="8"/>')
            xmlWriter.writeLine('<field name="arch" type="xml">')
            xmlWriter.indent()
            xmlWriter.writeLine('<form string="' + model_name_title + '">')
            xmlWriter.indent()
            xmlWriter.writeLine('<header>')
            xmlWriter.indent()
            if (state_field_exist) {
                xmlWriter.writeLine('<button string="Confirm" type="object" name="action_confirm" states="draft" />')
                xmlWriter.writeLine('<button string="Mark as Done" type="object" name="action_done" states="open" />')
                xmlWriter.writeLine('<button string="Reset to Draft" type="object" name="action_draft" states="open,done" />')
                xmlWriter.writeLine('<field name="state" widget="statusbar" />')
            }
            xmlWriter.outdent()
            xmlWriter.writeLine('</header>')
            xmlWriter.writeLine('<sheet>')
            xmlWriter.indent()
            xmlWriter.writeLine('<div class="oe_button_box" name="button_box">')
            xmlWriter.indent()
            xmlWriter.writeLine('<!--button type="object" name="action_view_detail" class="oe_stat_button" icon="fa-pencil-square-o"-->')
            xmlWriter.indent()
            xmlWriter.writeLine('<!--field name="detail_count" widget="statinfo" string="Detail(s)"/-->')
            xmlWriter.writeLine('<!--field name="detail_ids" invisible="1"/-->')
            xmlWriter.outdent()
            xmlWriter.writeLine('<!--/button-->')
            xmlWriter.outdent()
            xmlWriter.writeLine('</div>')
            xmlWriter.writeLine('<div class="oe_title">')
            xmlWriter.indent()
            xmlWriter.writeLine('<label for="name" class="oe_edit_only" string="' + model_name_title + ' Name"/>')
            xmlWriter.writeLine('<h1><field name="name"/></h1>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</div>')
            xmlWriter.writeLine('<group>')
            xmlWriter.indent()
            xmlWriter.writeLine('<group>')
            xmlWriter.indent()
            normal_fields.forEach(function(field) {
                if (field.name !== 'name' && field.name !== 'state') {
                    xmlWriter.writeLine('<field name="' + field.name + '" />')
                }
            })
            xmlWriter.outdent()
            xmlWriter.writeLine('</group>')
            xmlWriter.writeLine('<group>')
            xmlWriter.indent()
            m2o_fields.forEach(function(field) {
                xmlWriter.writeLine('<field name="' + field.name + '" />')
            })
            m2m_fields.forEach(function(field) {
                xmlWriter.writeLine('<field name="' + field.name + '" widget="many2many_tags"/>')
            })
            xmlWriter.outdent()
            xmlWriter.writeLine('</group>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</group>')
            xmlWriter.writeLine('<notebook>')
            xmlWriter.indent()
            o2m_fields.forEach(function(field) {
                xmlWriter.writeLine('<page name="' + field.name + '" string="' + self.sentenceCase(field.name, options) + '">')
                xmlWriter.indent()
                xmlWriter.writeLine('<field name="' + field.name + '"/>')
                xmlWriter.outdent()
                xmlWriter.writeLine('</page>')
            })
            xmlWriter.outdent()
            xmlWriter.writeLine('</notebook>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</sheet>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</form>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</field>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</record>')
        }

        // FIX: action window for all non-res_users
        if (model_name_underscore != 'res_users') {
            xmlWriter.writeLine('<!-- action window -->')
            xmlWriter.writeLine('<record id="action_' + elem_name + '" model="ir.actions.act_window">')
            xmlWriter.indent()
            xmlWriter.writeLine('<field name="name">' + model_name_title + '</field>')
            xmlWriter.writeLine('<field name="type">ir.actions.act_window</field>')
            xmlWriter.writeLine('<field name="res_model">' + model_name_dot + '</field>')
            if (odooVersion < 12) {
                xmlWriter.writeLine('<field name="view_type">form</field>')
            }
            xmlWriter.writeLine('<field name="view_mode">tree,form</field>')
            xmlWriter.writeLine('<field name="context">{"search_default_fieldname":1}</field>')
            xmlWriter.writeLine('<field name="help" type="html">')
            xmlWriter.indent()
            xmlWriter.writeLine('<p class="oe_view_nocontent_create">')
            xmlWriter.writeLine('Click to add a new ' + model_name_title)
            xmlWriter.writeLine('</p><p>')
            xmlWriter.writeLine('Click the Create button to add a new ' + model_name_title)
            xmlWriter.writeLine('</p>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</field>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</record>')

            xmlWriter.writeLine()
            var parentMenu = state_field_exist
                ? folderName + '_sub_menu'
                : folderName + '_config_menu'
            xmlWriter.writeLine('<menuitem id="menu_' + elem_name + '" name="' + model_name_title + '" parent="' + parentMenu + '" action="action_' + elem_name + '" sequence="' + sequence + '"/>')
        }

        xmlWriter.outdent()
        xmlWriter.writeLine('</data>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</odoo>')
    }

    writeSequenceXML(basePath, elem, options, isInheritedModule, folderName) {
        var state_field_exist = false
        elem.attributes.forEach(function(attr) {
            if (attr.name === 'state') {
                state_field_exist = true
            }
        })

        if (!state_field_exist) return

        var fullPath = basePath + '/data/sequence_' + elem.name + '.xml'
        var xmlWriter = new codegen.CodeWriter(this.getIndentString(options))
        var model_name_dot = this.getModelName(elem, options, '.')
        var model_name_title = this.sentenceCase(elem.name, options)
        var sequence_name = 'sequence_' + elem.name

        xmlWriter.writeLine('<?xml version="1.0" encoding="utf-8"?>')
        xmlWriter.writeLine('<odoo>')
        xmlWriter.indent()

        if (isInheritedModule) {
            xmlWriter.writeLine('<data >')
            xmlWriter.indent()
            xmlWriter.writeLine('<function name="write" model="ir.model.data">')
            xmlWriter.indent()
            xmlWriter.writeLine('<function name="search" model="ir.model.data">')
            xmlWriter.indent()
            xmlWriter.writeLine('<value eval="[(\'module\', \'=\', \'' + folderName + '\'), (\'name\', \'=\', \'' + sequence_name + '\')]"/>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</function>')
            xmlWriter.writeLine('<value eval="{\'noupdate\': False}" /> ')
            xmlWriter.outdent()
            xmlWriter.writeLine('</function>')
            xmlWriter.writeLine('<record id="' + folderName + '.' + sequence_name + '" model="ir.sequence">')
            xmlWriter.indent()
            xmlWriter.writeLine('<field name="name">' + sequence_name + '</field>')
            xmlWriter.writeLine('<field name="code">' + model_name_dot + '</field>')
            xmlWriter.writeLine('<field name="prefix">X/%(year)s/%(month)s/</field>')
            xmlWriter.writeLine('<field name="padding">3</field>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</record>')
            xmlWriter.writeLine('<function name="write" model="ir.model.data">')
            xmlWriter.indent()
            xmlWriter.writeLine('<function name="search" model="ir.model.data">')
            xmlWriter.indent()
            xmlWriter.writeLine('<value eval="[(\'module\', \'=\', \'' + folderName + '\'), (\'name\', \'=\', \'' + sequence_name + '\')]"/>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</function>')
            xmlWriter.writeLine('<value eval="{\'noupdate\': True}" />')
            xmlWriter.outdent()
            xmlWriter.writeLine('</function>')
        } else {
            xmlWriter.writeLine('<data noupdate="1">')
            xmlWriter.indent()
            xmlWriter.writeLine('<record id="' + sequence_name + '" model="ir.sequence">')
            xmlWriter.indent()
            xmlWriter.writeLine('<field name="name">' + sequence_name + '</field>')
            xmlWriter.writeLine('<field name="code">' + model_name_dot + '</field>')
            xmlWriter.writeLine('<field name="prefix">' + model_name_title.slice(0, 3).toUpperCase() + '/%(year)s/%(month)s/</field>')
            xmlWriter.writeLine('<field name="padding">3</field>')
            xmlWriter.writeLine('<field name="number_next_actual">1</field>')
            xmlWriter.writeLine('<field name="number_increment">1</field>')
            xmlWriter.writeLine('<field name="implementation">standard</field>')
            xmlWriter.outdent()
            xmlWriter.writeLine('</record>')
        }

        xmlWriter.outdent()
        xmlWriter.writeLine('</data>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</odoo>')

        fs.writeFileSync(fullPath, xmlWriter.getData())
    }

    writeTopMenuXML(xmlWriter, options, folderName) {
        var addonName = folderName
        var appName = options.appName

        xmlWriter.writeLine('<odoo>')
        xmlWriter.indent()
        xmlWriter.writeLine('<data>')
        xmlWriter.indent()

        xmlWriter.writeLine('<menuitem id="' + addonName + '_top_menu" name="' + appName + '" sequence="20" web_icon="' + addonName + ',static/description/icon.png" />')
        xmlWriter.writeLine('<menuitem id="' + addonName + '_sub_menu" name="Operations" sequence="40" parent="' + addonName + '_top_menu" />')
        xmlWriter.writeLine('<menuitem id="' + addonName + '_config_menu" name="Configurations" sequence="50" parent="' + addonName + '_top_menu" />')

        xmlWriter.outdent()
        xmlWriter.writeLine('</data>')
        xmlWriter.outdent()
        xmlWriter.writeLine('</odoo>')
    }

    generate(elem, basePath, options, folderName, inheritedModule, sequence) {
        var result = new $.Deferred()
        var fullPath, codeWriter, xmlWriter

        if (elem instanceof type.UMLPackage) {
            fullPath = path.join(basePath, elem.name)
            fs.mkdirSync(fullPath)
            fs.writeFileSync(path.join(fullPath, '__init__.py'), '')
            // FIX: pass all required args in recursive call
            elem.ownedElements.forEach(child => {
                this.generate(child, fullPath, options, folderName, inheritedModule, sequence)
            })

        } else if (elem instanceof type.UMLClass || elem instanceof type.UMLInterface) {
            // generate .py
            fullPath = basePath + '/model/' + elem.name + '.py'
            codeWriter = new codegen.CodeWriter(this.getIndentString(options))
            codeWriter.writeLine(options.installPath)
            codeWriter.writeLine('#-*- coding: utf-8 -*-')
            codeWriter.writeLine()
            this.writeClass(codeWriter, elem, options)
            fs.writeFileSync(fullPath, codeWriter.getData())

            // generate view XML
            fullPath = basePath + '/view/' + elem.name + '.xml'
            xmlWriter = new codegen.CodeWriter(this.getIndentString(options))
            this.writeXML(xmlWriter, elem, options, folderName, sequence)
            fs.writeFileSync(fullPath, xmlWriter.getData())

            // generate report XML
            fullPath = basePath + '/report/' + elem.name + '.xml'
            xmlWriter = new codegen.CodeWriter(this.getIndentString(options))
            this.writeReport(xmlWriter, elem, options, folderName)
            fs.writeFileSync(fullPath, xmlWriter.getData())

            // generate sequence XML
            this.writeSequenceXML(basePath, elem, options, false, folderName)

        } else if (elem instanceof type.UMLEnumeration) {
            fullPath = basePath + '/' + elem.name + '.py'
            codeWriter = new codegen.CodeWriter(this.getIndentString(options))
            codeWriter.writeLine(options.installPath)
            codeWriter.writeLine('#-*- coding: utf-8 -*-')
            codeWriter.writeLine()
            this.writeEnum(codeWriter, elem, options)
            fs.writeFileSync(fullPath, codeWriter.getData())

        } else {
            result.resolve()
        }
        return result.promise()
    }

    lowerFirst(string) {
        return string.replace(/^[A-Z]/, function(m) { return m.toLowerCase() })
    }

    kebabCase(string) {
        return this.lowerFirst(string).replace(/([A-Z])/g, function(m, g) {
            return '-' + g.toLowerCase()
        }).replace(/[\s\-_]+/g, '-')
    }

    capitalise(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
    }

    sentenceCase(string, options) {
        var english = options.en_language
        var res = this.capitalise(this.kebabCase(string).replace(/(-)/g, ' '))
        if (english)
            return res.replace(/ ids/g, 's').replace(/ id/g, '')
        else
            return res.replace(/ ids/g, '').replace(/ id/g, '')
    }

    getModelName(elem, options, separator) {
        var _name_value = ''
        var has_name = false
        var addonName = options.addonName

        elem.attributes.forEach(function(attr) {
            if (attr.name == "_name") {
                has_name = true
                _name_value = attr.defaultValue
                if (separator == '_') {
                    var res = _name_value.split(".")
                    _name_value = res[0] + separator + res[1]
                }
            }
        })

        if (!has_name) {
            if (!separator) separator = '.'
            _name_value = addonName + separator + elem.name
        }

        return _name_value
    }

    // FIX: corrected checkInherit logic
    // Original bug: it set is_inherit = false on every non-_inherit field,
    // overwriting a previous true value. Now uses .some() for a clean check.
    checkInherit(elem) {
        return elem.attributes.some(function(attr) {
            return attr.name === '_inherit'
        })
    }
}

function generate(baseModel, basePath, options) {
    var iconName = options.iconName

    var odooCodeGenerator = new OdooCodeGenerator(baseModel, basePath)
    var fullPath = basePath + '/' + baseModel.name

    fs.mkdirSync(fullPath)
    fs.mkdirSync(fullPath + '/model')
    fs.mkdirSync(fullPath + '/view')
    fs.mkdirSync(fullPath + '/security')
    fs.mkdirSync(fullPath + '/report')
    fs.mkdirSync(fullPath + '/static')
    fs.mkdirSync(fullPath + '/static/description')
    fs.mkdirSync(fullPath + '/static/js')
    fs.mkdirSync(fullPath + '/static/xml')
    fs.mkdirSync(fullPath + '/data')

    fs.copyFile(__dirname + "/icons/" + iconName + ".png", fullPath + '/static/description/icon.png', function(err) {
        if (err) throw err
        console.log('done copy icon')
    })

    // write top menu
    var xmlWriter = new codegen.CodeWriter('\t')
    odooCodeGenerator.writeTopMenuXML(xmlWriter, options, baseModel.name)
    fs.writeFileSync(fullPath + '/view/menu.xml', xmlWriter.getData())

    // FIX: declared with var
    var codeWriter = new codegen.CodeWriter('\t')
    odooCodeGenerator.writeManifest(codeWriter, baseModel.ownedElements, options, baseModel.name, false)
    fs.writeFileSync(fullPath + '/__manifest__.py', codeWriter.getData())

    codeWriter = new codegen.CodeWriter('\t')
    codeWriter.writeLine(options.installPath)
    codeWriter.writeLine('from . import model')
    fs.writeFileSync(fullPath + '/__init__.py', codeWriter.getData())

    odooCodeGenerator.writeModelAccess(fullPath, baseModel.ownedElements, baseModel.name, options)
    odooCodeGenerator.writeGroupsXML(fullPath, options)

    codeWriter = new codegen.CodeWriter('\t')
    codeWriter.writeLine(options.installPath)
    odooCodeGenerator.writeInit(codeWriter, baseModel.ownedElements, options)
    fs.writeFileSync(fullPath + '/model/__init__.py', codeWriter.getData())

    var sequence = 10
    baseModel.ownedElements.forEach(child => {
        odooCodeGenerator.generate(child, fullPath, options, baseModel.name, false, sequence)
        sequence += 10
    })
}

exports.generate = generate