# Cursor Prompt — StarUML v7 Odoo Generator Plugin

---

You are an expert StarUML v7 plugin developer and an expert in modern Odoo module architecture.

I am building a StarUML v7 plugin that reads UML Class Diagrams and generates a complete, production-ready Odoo 19 module. Before writing any code, I need you to deeply read and understand all the codebases in this workspace. Do not write any code yet — only read, analyze, and report back what you learned.

---

## STEP 1 — READ THE STARUML OFFICIAL EXAMPLES

Read every file inside the `staruml.java/` folder and the `staruml-python/` folder. These are the official StarUML code generator examples. I need you to understand:

- How the plugin is declared in `package.json` for StarUML v7, including the engines field, the menus registration, and the main entry point
- How the plugin initializes itself in `main.js` and how it registers commands using the StarUML v7 app global object
- Exactly which API calls are used to access the UML model — how they select classes, interfaces, attributes, operations, associations, generalizations, and dependencies from the repository
- How they traverse the UML element tree and read properties like name, type, multiplicity, visibility, stereotype, and documentation
- How they handle output — how they ask the user for an output folder, how they create directories, and how they write files to disk
- How they handle errors and show dialogs to the user
- Any utility or helper patterns they use for formatting names, types, or code structure

After reading both examples, summarize the correct StarUML v7 API patterns so we have a reliable reference before touching any Odoo-specific code.

---

## STEP 2 — READ THE OLD ODOO GENERATOR AND IDENTIFY ALL PROBLEMS

Read every file inside the old Odoo generator folder in this workspace (tstaruml-odoo-lite-main). I need you to identify and list every problem with this code, specifically:

- Every StarUML API call that is outdated, renamed, or no longer works in StarUML v7 — compare it against what you learned from the official Java and Python examples
- Every place where the code assumes a StarUML API structure that no longer exists
- Every Odoo pattern that is outdated and does not work in Odoo 19, including old ORM syntax, deprecated field definitions, old view structures, old manifest format, and old security file format
- Any structural or architectural problems that would make the code hard to maintain or extend
- Missing features that a modern Odoo 17 generator should have

After reading, give me a clear list of what needs to be rewritten from scratch versus what can be salvaged and adapted.

---

## STEP 3 — READ THE ODOO BASE SOURCE CODE AND LEARN MODERN ODOO 19 PATTERNS

Read the Odoo module source code in this workspace (odoo). Focus specifically on:

- How models are defined using models.Model, including _name, _description, _inherit, _inherits, _order, _rec_name, and _sql_constraints
- Every field type that Odoo 19 supports and how each one is declared with its parameters — Char, Text, Integer, Float, Boolean, Date, Datetime, Selection, Many2one, One2many, Many2many, Binary, Html, Monetary, and Reference
- How computed fields are defined using compute, store, depends, and readonly
- How onchange methods are decorated and what they do
- How constrains methods are decorated and how they raise ValidationError
- How default values are set — both static defaults and callable defaults
- How the __manifest__.py file is structured in Odoo 19, including all required and optional keys like name, version, category, depends, data, assets, and installable
- How __init__.py files are organized at the module level and inside the models folder
- How XML view files are structured for form views, list views, search views, and actions — including the correct XML namespaces and the correct record model names used in Odoo 19
- How ir.model.access.csv is structured, what columns it requires, and how the model name format works in the id and model_id columns
- How menus and actions are linked together in XML
- How security groups are referenced in access rules

After reading, give me a complete mapping of everything I need to generate for a minimal but complete and installable Odoo 19 module.

---

## STEP 4 — SYNTHESIZE AND PLAN

After reading everything, give me a complete development plan that answers these questions:

- What is the correct StarUML v7 API to use for each operation: selecting classes, reading attributes, reading relations, reading stereotypes, showing dialogs, and writing files
- What is the complete list of files that need to be generated for a proper Odoo 17 module
- How should UML class attributes map to Odoo field types
- How should UML associations and their multiplicities map to Odoo relational fields — Many2one, One2many, and Many2many
- How should UML stereotypes map to Odoo model behaviors like abstract models, mixins, or inherited models
- What is the recommended file and folder structure for the plugin itself

Only after I approve the plan should you start writing any code.
