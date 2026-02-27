# Getting Started | StarUML documentation

copyCopychevron-down

# Getting Started

Let's start to create an HelloWorld extension for StarUML. Full source codes of HelloWorld extension are available at [https://github.com/staruml/staruml-helloworldarrow-up-right](https://github.com/staruml/staruml-helloworld).

circle-check

Additional resources and docs for developers

- [StarUML sample modelsarrow-up-right](https://github.com/staruml/staruml-samples)
- [StarUML metamodelarrow-up-right](https://files.staruml.io/api-docs/6.0.0/metamodel/index.html)
- [API referencearrow-up-right](https://files.staruml.io/api-docs/6.0.0/api/index.html)

[hashtag](#create-an-extension)

Create an extension

First we need to create an extension folder. Open your extensions folder.

- MacOS: `~/Library/Application Support/StarUML/extensions/user`
- Windows: `C:\Users\<user>\AppData\Roaming\StarUML\extensions\user`
- Linux: `~/.config/StarUML/extensions/user`

Create a new folder `HelloWorld` in your extensions folder.

[hashtag](#extension-package-layout)

Extension package layout

An extension may have following folder structure:

Copy

```
my-extension/
├─ menus/
├─ keymaps/
├─ toolbox/
├─ stylesheets/
├─ preferences/
├─ main.js
└─ package.json
```

- `/menus` See [Menus](/developing-extensions/menus).
- `/keymaps` See [Keymaps](/developing-extensions/keymaps).
- `/toolbox` See [Toolbox](/developing-extensions/toolbox).
- `/stylesheets` Place CSS stylesheet files (`.css`).
- `/preferences` See [Preferences](/developing-extensions/defining-preferences).
- `main.js`
- `package.json`

[hashtag](#create-main.js)

Create `main.js`

Create `main.js` in the new extension folder. `main.js` is the entry point to be executed when StarUML is started. `init()` function will be called when the extension is loaded. `init()` is optional, not mandatory.

Copy

```
function init() {
  // ...
}

exports.init = init
```

circle-info

The StarUML extension does not support loading external modules. If you use external modules, you need to build them into a single JavaScript file using tools such as Webpack or Vite.

[hashtag](#application-context)

Application Context

To write an extension with Javascript, you need to use StarUML's open APIs. You can use most of API functions via the application context object `app`. The `app` includes objects providing useful APIs for commands, menus, keymaps, preferences, factory, dialogs, etc. For more about `app` object, see [API Referencearrow-up-right](https://files.staruml.io/api-docs/6.0.0/api/index.html).

> **Note**
>
> StarUML is developed based on [electronarrow-up-right](https://electronjs.org/) platform, so you can also use electron APIs in your extension.

[hashtag](#add-a-command)

Add a command

A command is an execution unit which can be bound with a menu item as well as a keyboard shortcut. For more about command, see [Commands](/developing-extensions/commands).

In Hello World extension, we will add a command that showing "Hello, World!" message with id `helloworld:show-message` as bellow:

Copy

```
function handleShowMessage () {
  window.alert('Hello, world!')
}

function init () {
  app.commands.register('helloworld:show-message', handleShowMessage)
}

exports.init = init
```

You can find and execute the command by [Command Palette](/user-guide/user-interface#command-palette) (`Ctrl+Shift+P` or `Cmd+Shift+P`).

[hashtag](#add-a-menu-item)

Add a menu item

We will add a menu item named **Hello World** under **Tools** menu. To add a menu item, we need to create a folder `/menus` and a menu JSON file `helloworld.json` in the folder.

Copy

```
staruml-helloworld/
├─ menus/
│  └─ helloworld.json
└─ main.js
```

The menu JSON file is as below:

Copy

```
{
  "menu": [
    {
      "id": "tools",
      "submenu": [
        {
          "label": "Hello World",
          "id": "tool.helloworld",
          "command": "helloworld:show-message"
        }
      ]
    }
  ]
}
```

[hashtag](#add-a-shortcut)

Add a shortcut

We will also bind a keyboard shortcut `Ctrl+W` (`Cmd+W` for MacOS) to the command, so we need to create a folder `/keymaps` and a keymap JSON file `helloworld.json` in the folder.

Copy

```
staruml-helloworld/
├─ menus/
│ └─ helloworld.json
├─ keymaps/
│ └─ helloworld.json
└─ main.js
```

The keymap JSON file is as below:

Copy

```
{
  "cmdctrl-w": "helloworld:show-message"
}
```

Now when user selects the menu item or press `Ctrl+W` (`Cmd+W` for MacOS), the command `helloworld:show-message` will be executed to show alert dialog with message "Hello, World!".

[hashtag](#run-and-debug)

Run and Debug

If you finished editing `main.js`, then just restart StarUML. However, restarting whenever you modified codes is very tedious. So, just reload by pressing `Ctrl+R` (`Cmd+R` for MacOS) or selecting **Debug > Reload** menu item.

It is useful to use **DevTools** to debug an extension. To open **DevTools**, select **Debug > Show DevTools**. You can see all console errors and logs.

[hashtag](#define-package.json)

Define `package.json`

If you consider to distribute your extension to other users, you need to create a `package.json` file containing metadata for the extension.

Copy

```
{
  "name": "your_id.helloworld",
  "title": "HelloWorld",
  "description": "HelloWorld extension example.",
  "homepage": "https://github.com/staruml/staruml-helloworld",
  "version": "1.0.0",
  "keywords": ["example", "helloworld"],
  "author": {
    "name": "Minkyu Lee",
    "email": "niklaus.lee@gmail.com",
    "url": "https://github.com/niklauslee"
  },
  "license": "MIT",
  "engines": {
    "staruml": ">=3.0.0"
  }
}
```

Restart StarUML and then check whether your extension is properly shown in **Extension Manager** or not. (select **Tools > Extension Manager** and click **Installed** tab).

[hashtag](#distribute-your-extension)

Distribute your extension

To allow other users to install your extension, there are several possible ways:

1. Distribute as ZIP archive. Zip the extension folder `staruml-helloworld` as `staruml-helloworld.zip` and just unzip the file in other user's the extensions folder explained above.
2. Distribute via Github URL. Users can install from Github URL. In **Extension Manager**, click **Install from URL** and enter the Github URL (e.g. `https://github.com/staruml/staruml-helloworld`) and press **Install** button.
3. Distribute via Extensions Registry. If you want to register official extensions registry. Please contact us (support@staruml.io)

[PreviousGCP Architecture Diagramchevron-left](/working-with-additional-diagrams/gcp-architecture-diagram)[NextCommandschevron-right](/developing-extensions/commands)

Last updated 8 months ago






# Registering to Extension Registry | StarUML documentation

copyCopychevron-down

# Registering to Extension Registry

When you complete your extension development, you can register your extension to **Extension Registry** so that users can install your extension easily via **Extension Manager**.

[hashtag](#first-registration)

First Registration

If you created your own extension and want to release the first version, then please follow the below steps.

[hashtag](#create-package.json)

Create `package.json`

Create a `package.json` file. `name` field is a unique identifier for the extension. We recommend to combine your Github id and repository name. For example, if your Github id is `john` and the repository name is `sql-generator`, then `john.sql-generator` could be good for `name` field. `version` field has to be set carefully. Recommend to follow [Semantic Versioningarrow-up-right](http://semver.org/).

> Note that `name` field should be lowercase alpha-numeric name without spaces. It may include "." or "\_" or "-" characters.

Following is an example for Java extension.

Copy

```
{
    "name": "staruml.java",
    "title": "Java",
    "description": "Java code generation and reverse engineering.",
    "homepage": "https://github.com/staruml/Java",
    "issues": "https://github.com/staruml/Java/issues",
    "keywords": ["java"],
    "version": "0.9.0",
    "author": {
        "name": "Minkyu Lee",
        "email": "niklaus.lee@gmail.com",
        "url": "https://github.com/niklauslee"
    },
    "license": "MIT",
    "engines": {
        "staruml": ">=3.0.0"
    }
}
```

[hashtag](#write-readme.md)

Write README.md

Please write information and user manual of your extension in `README.md` file.

[hashtag](#upload-to-github)

Upload to Github

Upload your extension source codes to a Github repository. Only Github is supported, so others (e.g. Bitbuckets, etc.) are not supported. When user install an extension, then **Extension Manager** downloads extension directly from the Github repository.

[hashtag](#create-a-release)

Create a release

Finally, you have to create a release in the Github repository as described in [https://help.github.com/articles/creating-releases/arrow-up-right](https://help.github.com/articles/creating-releases/). This is very important. Without this, extensions cannot be downloaded from **Extension Manager**. The `tag version` and `release title` should be matched with the `version` field in the `package.json` file.

[hashtag](#send-email)

Send email

After creating a release, just send email to us (`support@staruml.io`) with your extension repository URL. Then, we will register your extension to **Extension Registry** within one or two business days.

[hashtag](#upgrading-to-new-version)

Upgrading to New Version

If you want to release a new version of your extension already registered in **Extension Registry**. Please check the followings.

[hashtag](#check-version-in-package.json)

Check `version` in `package.json`

Set new version number in `version` field in `package.json`.

[hashtag](#create-a-new-release)

Create a new release

You have to create a release for every version. Check again that the `tag version` and `release title` are matched with the `version` field in the `package.json` file.

[hashtag](#send-email-1)

Send email.

After creating a new release, just let us know that new version is released by sending email to us (`support@staruml.io`). We will upgrade your extension to the new version within one or two business days.

[PreviousUsing Dialogschevron-left](/developing-extensions/using-dialogs)

# Using Dialogs | StarUML documentation

copyCopychevron-down

# Using Dialogs

In this chapter, we're going to learn how to use dialogs.

[hashtag](#file-dialogs)

File Dialogs

You can use **Open Dialog** and **Save Dialog** to allow users to choose files or directories.

Following is an example of **Open Dialog** for choosing a text `*.txt` file.

Copy

```
var filters = [
  { name: "Text Files", extensions: [ "txt" ] }
]
var selected = app.dialogs.showOpenDialog("Select a text file...", null, filters)
// Returns an array of paths of selected files
```

Following is an example of **Save Dialog** for getting a file name.

Copy

```
var filters = [
  { name: "Text Files", extensions: [ "txt" ] }
]
var selected = app.dialogs.showSaveDialog("Save text as...", null, filters)
// Returns a file path to save
```

[hashtag](#message-dialogs)

Message Dialogs

There are three types of message dialogs to show error, alert, and info.

Copy

```
// Error Dialog
app.dialogs.showErrorDialog("This is error message.")

// Alert Dialog
app.dialogs.showAlertDialog("This is alert message.")

// Info Dialog
app.dialogs.showInfoDialog("This is info message.")
```

[hashtag](#input-dialogs)

Input Dialogs

Here are code examples to show dialogs to get user inputs.

**Input Dialog** (single line text)

Copy

```
app.dialogs.showInputDialog("Enter your name.").then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log("Your name is", returnValue)
  } else {
    console.log("User canceled")
  }
})
```

**Text Dialog** (multi line text)

Copy

```
app.dialogs.showTextDialog("Enter your biography.", "Edit here...").then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log("Your bio is", returnValue)
  } else {
    console.log("User canceled")
  }
})
```

**Confirm Dialog**

Copy

```
var buttonId = app.dialogs.showConfirmDialog("Are you sure?")
```

**Select Radio Dialog**

Copy

```
var options = [
  { text: "First", value: 1 },
  { text: "Second", value: 2 },
  { text: "Third", value: 3 }
]
app.dialogs.showSelectRadioDialog("Select one of the following items.", options).then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log(returnValue)
  } else {
    console.log("User canceled")
  }
})
```

**Select Dropdown Dialog**

Copy

```
var options = [
  { text: "First", value: 1 },
  { text: "Second", value: 2 },
  { text: "Third", value: 3 }
]
app.dialogs.showSelectDropdownDialog("Select one of the following items.", options).then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log(returnValue);
  } else {
    console.log("User canceled")
  }
})
```

**Color Dialog**

Copy

```
// Initial color is red (#ff0000).
app.dialogs.showColorDialog("#ff0000").then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log(returnValue);
  } else {
    console.log("User canceled")
  }
})
```

**Font Dialog**

Copy

```
var font = {
  face: "Helvetica",
  size: 20,
  color: "#ff0000"
}
app.dialogs.showFontDialog(font).then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log(returnValue);
  } else {
    console.log("User canceled")
  }
})
```

[hashtag](#element-dialogs)

Element Dialogs

If you need to ask users to pick an model element, **Element Picker Dialog** can be used as follow:

Copy

```
app.elementPickerDialog.showDialog("Select a Class", null, type.UMLClass).then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log("You selected: ", returnValue)
  }
})
```

![](https://docs.staruml.io/~gitbook/image?url=https%3A%2F%2Fgithub.com%2Fstaruml%2Fstaruml-dev-docs%2Fblob%2Fmaster%2Fimages%2FElementPickerDialog.png%3Fraw%3Dtrue&width=768&dpr=3&quality=100&sign=9f617511&sv=2)

ElementPickerDialog

Or, you may need to constrain a list of elements which can be selected by users. Then you can use **Element List Picker Dialog**.

Copy

```
var classes = app.repository.select("@UMLClass")
var dlg = app.elementListPickerDialog.showDialog("Select a set of Class", classes).then(function ({buttonId, returnValue}) {
  if (buttonId === 'ok') {
    console.log("You selected: ", returnValue)
  }
})
```

![](https://docs.staruml.io/~gitbook/image?url=https%3A%2F%2Fgithub.com%2Fstaruml%2Fstaruml-dev-docs%2Fblob%2Fmaster%2Fimages%2FElementListPickerDialog.png%3Fraw%3Dtrue&width=768&dpr=3&quality=100&sign=b46cb799&sv=2)

ElementListPickerDialog

[hashtag](#toast)

Toast

**Toast** is a way to show a short message in some seconds. It appears on the top of diagram area and disappears automatically after some seconds.

Copy

```
app.toast.error("This is an error message") // Red color
app.toast.warning("This is a warning message") // Yellow color
app.toast.info("This is an info message") // Black color
```

[PreviousDefining Preferenceschevron-left](/developing-extensions/defining-preferences)[NextRegistering to Extension Registrychevron-right](/developing-extensions/registering-to-extension-registry)

# Defining Preferences | StarUML documentation

copyCopychevron-down

# Defining Preferences

In this chapter, we're going to learn how to define preferences. When you developing your own extensions, you may want to allow users to make preferred settings.

To define your own preferences, use `app.preferences`.

[hashtag](#defining-preference-schema)

Defining preference schema

Before we get in detail, it's better to take a look at an example. Following is a part of preference schema of [Java extensionarrow-up-right](https://github.com/staruml/staruml-java).

Copy

```
var javaPreferences = {
  id: "java",
  name: "Java",
  schema: {
    "java.gen": {
      text: "Java Code Generation",
      type: "section"
    },
    "java.gen.useTab": {
      text: "Use Tab",
      description: "Use Tab for indentation instead of spaces.",
      type: "check",
      default: false
    },
    "java.gen.indentSpaces": {
      text: "Indent Spaces",
      description: "Number of spaces for indentation.",
      type: "number",
      default: 4
    },
    ...
  }
}
...
app.preferences.register(javaPreferences)
```

This preference schema will be shown in **Preferences Dialog** as the below image.

![](https://docs.staruml.io/~gitbook/image?url=https%3A%2F%2Fgithub.com%2Fstaruml%2Fstaruml-dev-docs%2Fblob%2Fmaster%2Fimages%2FPreferenceDialog.png%3Fraw%3Dtrue&width=768&dpr=3&quality=100&sign=1d8fa8f4&sv=2)

PreferenceDialog

As shown in the above example, a preference schema have a _unique ID_, _name_, and a set of _preference items_. You can register a preference schema by `app.preferences.register` function.

A preference item should have the following properties.

- **key** : Unique identifier of preference item. It should be unique in all of the preference schemas, so it's strongly recommend to include all the IDs of preference schema and section (e.g. `java.gen.useTab`, `java.gen.indentSpaces`).
- **text** : Name of preference item. It will be shown in **Preferences Dialog** instead of `key`.
- **description** : Short description of preference item.
- **type** : Type of preference item. Available types will be described later.
- **default** : Default value of preference item.
- **width** _(optional)_ : Width of widget for preference item in **Preferences Dialog**.
- **options** _(optional)_ : Options users can select one of. This property is mandatory for `Combo` or `Dropdown` preference items. This property should be defined as an array of objects having two fields: `value` and `text`. (e.g. `[ { value: 0, text: "female" }, { value: 1, text: "male" } ]` )

Available types of preference item are as follow.

- **section** : Just for grouping preference items, so it has no actual preference value.
- **string** : Allows users can edit a text (a string value).
- **check** : Allows users can check or uncheck (a boolean value).
- **number** : Allows users can edit a number value (an integer value).
- **combo** : Allows users can edit or select a value from the defined options.
- **dropdown** : Allows users can select from the defined options.
- **color** : Allows users can select a color value. This type of preference item allow to set `default` property value to `null`. It means nothing selected. Additionally, allow to define `defaultButton` property like as `defaultButton: { text: "Use Default Color" }`. When it defined, a button is shown in front of color widget in **Preferences Dialog** and changes to default color when it pressed.

[hashtag](#reading-preference-values)

Reading preference values

You can read value of a particular preference item by calling `get` function with key of the preference item. It returns user selected value or default value. If passed undefined key, it returns `null` value.

Copy

```
app.preferences.get("java.gen.useTab") // false
app.preferences.get("java.gen.indentSpaces") // 4
app.preferences.get("java.gen.undefined-item") // null
```

[hashtag](#writing-preference-values)

Writing preference values

You can also write value for a particular preference item by calling `set` function with key and value. Note that you have to pass value of correct type conform to the type of preference item. For example, do not pass string value to a preference item of **check** type.

Copy

```
app.preferences.set("java.gen.useTab", true)
app.preferences.set("java.gen.indentSpaces", 2)
app.preferences.get("java.gen.useTab") // true
app.preferences.get("java.gen.indentSpaces") // 2
```

[PreviousWorking with Selectionschevron-left](/developing-extensions/working-with-selection)[NextUsing Dialogschevron-right](/developing-extensions/using-dialogs)

# Working with Selections | StarUML documentation

copyCopychevron-down

# Working with Selections

In this chapter, we're going to learn how to get selected elements, force to select particular elements, and do something by listening to selection changed events.

[hashtag](#getting-selected-elements)

Getting selected elements

Users can select elements in a diagram or in **Model Explorer**. Sometimes we may need to access only the selected elements.

We need to distinguish between **selected views** and **selected models**. If you select the **Book** class in a diagram, then there is a selected view (`UMLClassView`) and a selected model (`UMLClass`). If you select the **Author** class in **Model Explorer**, then there is a selected model (`UMLClass`) and no selected views.

We can access selected elements using `app.selections` as following:

Copy

```
var selectedViews = app.selections.getSelectedViews()
var selectedModels = app.selections.getSelectedModels()
var selected = app.selections.getSelected() // === selectedModels[0]
```

[hashtag](#enforce-to-select-particular-elements)

Enforce to select particular elements

To select a model element in **Model Explorer**, use **ModelExplorerView** module. (Assume that `Book.mdj` used in [Accessing Elementsarrow-up-right](https://github.com/staruml/staruml-gitbook/tree/de0346ed28133c9def39873bb4f98979a1698049/developing-extensions/AccessingElements/README.md) were loaded)

Copy

```
var book = app.repository.select("Model::Book")[0]
app.modelExplorer.select(book)
```

To scroll automatically so as to show the element, pass `true` value as the second parameter.

Copy

```
app.modelExplorer.select(book, true)
```

To select a view element in diagram, use `app.diagrams`. You can find more functions about selection in [API Referencearrow-up-right](http://staruml.io/reference/3.0.0/api).

Copy

```
var diagram = app.repository.select("@Diagram")[0]
var view1 = diagram.ownedViews[0]

app.diagrams.selectInDiagram(view1)
```

[hashtag](#listening-selection-changed-event)

Listening selection changed event

Now we will show how to listen and handle a selection change event. An array of selected model elements and an array of selected view elements are passed to the second and the third parameters respectively to the callback function.

Copy

```
app.selections.on('selectionChanged', function (models, views) {
  console.log("Selected number of model elements: ", models.length)
  console.log("Selected number of view elements: ", views.length)
})
```

[PreviousCreating, Deleting and Modifying Elementschevron-left](/developing-extensions/creating-deleting-and-modifying-elements)[NextDefining Preferenceschevron-right](/developing-extensions/defining-preferences)

# Creating, Deleting and Modifying Elements | StarUML documentation

copyCopychevron-down

# Creating, Deleting and Modifying Elements

In this chapter, we're going to learn how to create and modify elements. The most important is that you **should not** create or modify elements directly like `var class1 = new UMLClass()` or `class1.name = "New Name"` because all changes should be done via _operations_ which supports by undo and redo.

[hashtag](#creating-elements)

Creating elements

[hashtag](#creating-a-model-element)

Creating a model element

You can call `createModel` function of `app.factory` to create a model element with an option object.

The option object may have following fields:

- `id` : ID of factory function to create an element. To see the full ID list, execute `app.factory.getModelIds()`.
- `parent` : A parent element where the created element to be contained.
- `field` (optional) : Field name of the parent element (default is `ownedElements`).
- `modelInitializer` (optional) : A function to initialize the created model element.

Copy

```
// Get a reference to top-level project
var project = app.repository.select("@Project")[0]

// Create a UMLModel element as a child of project
var model1 = app.factory.createModel({ id: "UMLModel", parent: project })

// Create a UMLClass element as a child of the model
var class1 = app.factory.createModel({ id: "UMLClass", parent: model1 })

// Create a UMLAttribute element and add to the field 'attributes' of the class
var attr1 = app.factory.createModel({ id: "UMLAttribute", parent: class1, field: "attributes" })

// Create a UMLClass with options
var options = {
  id: "UMLClass",
  parent: model1,
  modelInitializer: function (elem) {
    elem.name = "MyClass";
    elem.isAbstract = true;
  }
}
var class2 = app.factory.createModel(options);
```

You can see the created elements in **Model Explorer** and undo and redo are available for each creation.

[hashtag](#creating-a-diagram)

Creating a diagram

Call `createDiagram` function of `app.factory` to create a diagram with an option object:

The option object may have following fields:

- `id` : ID of Factory function to create a diagram. To see the full ID list, execute `app.factory.getDiagramIds()`.
- `parent` : A parent element where the created diagram to be contained.
- `options` (optional) : An object containing the below options.
- `diagramInitializer` (optional) : A function to initialize the created diagram.

Copy

```
// Get a reference to top-level project
var project = app.repository.select("@Project")[0]

// Create a UMLModel element as a child of project
var model1 = app.factory.createModel({ id: "UMLModel", parent: project })

// Create a UMLClassDiagram as a child of the model
var diagram1 = app.factory.createDiagram({ id: "UMLClassDiagram", parent: model1 })

// Create a UMLClassDiagram with options
var options = {
  id: "UMLClassDiagram",
  parent: model1,
  diagramInitializer: function (dgm) {
    dgm.name = "MyDiagram";
    dgm.defaultDiagram = true;
  }
}
var diagram2 = app.factory.createDiagram(options)
```

[hashtag](#creating-a-model-element-and-a-view-element-at-once)

Creating a model element and a view element at once

Call `createModelAndView` function of `app.factory` to create a model element and a view element at once with an option object.

The option object may have following fields:

- `id` : ID of Factory function. To see the full ID list, execute `Factory.getModelAndViewIds()`.
- `parent` : A parent element where the created model element to be contained.
- `diagram` : A diagram element where the created view element to be contained.
- `modelInitializer` (optional) : A function to initialize the created model element.
- `viewInitializer` (optional) : A function to initialize the created view element.
- `x1`, `y1`, `x2`, `y2` (optional) : Rectangle coordinate to initialize position and size of the created view element.
- `tailView`, `headView` (optional) : If you try to create a relationship (e.g. `UMLAssociation`), the created view element connects these two view elements `tailView` and `headView`.
- `tailModel`, and `headModel` (optional) : If you try to create a relationship, the created model element connects these two model elements `tailModel` and `headModel`.
- `containerView` (optional) : A view element where the created view element to be contained.

The function `createModelAndView` returns the created view element, so you need to get the create model element by accessing `model` field. (e.g. `classView1.model`). Following code will create two classes and a association connecting the two classes.

Copy

```
// Create a UMLClass and UMLClassView
var options1 = {
  id: "UMLClass",
  parent: diagram1._parent,
  diagram: diagram1,
  x1: 100,
  y1: 100,
  x2: 200,
  y2: 200
}
var classView1 = app.factory.createModelAndView(options1)

// Create another UMLClass and UMLClassView
var options2 = {
  id: "UMLClass",
  parent: diagram1._parent,
  diagram: diagram1,
  x1: 400,
  y1: 100,
  x2: 500,
  y2: 200
}
var classView2 = app.factory.createModelAndView(options2)

// Create an association connecting the two classes
var options3 = {
  id: "UMLAssociation",
  parent: diagram1._parent,
  diagram: diagram1,
  tailView: classView1,
  headView: classView2,
  tailModel: classView1.model,
  headModel: classView2.model
}
var assoView = app.factory.createModelAndView(options3)
```

[hashtag](#creating-a-view-element-of-an-existing-model-element)

Creating a view element of an existing model element

Call `createViewOf` function of `app.factory` to create a view element of an existing model element with an option object.

The option object may have following fields:

- `model` : A model element referenced by the created view element.
- `diagram` : A diagram element where the created view element to be contained.
- `viewInitializer` (optional) : A function to initialize the created view element.
- `x`, `y` (optional) : Position of the created view element.
- `containerView` (optional) : A view element where the created view element to be contained.

Copy

```
var options = {
  model: classView1.model,
  diagram: diagram1,
  x: 500,
  y: 500,
}
app.factory.createViewOf(options)
```

You will see the one more class view element at (500, 500).

[hashtag](#adding-tags-to-an-element)

Adding tags to an element

If you want to extend an element with additional tags, you can create tags by calling `createModel` function with `Tag` parameter of `app.factory`. There are five kinds of Tag: String, Number, Boolean, Reference, and Hidden. Hidden tags are not shown in diagrams, but other tags are shown as properties. (Check **Format > Show Property** menu). Following code will create a string tag to the selected element.

Copy

```
// Get a selected element
var selected = app.selections.getSelected()

// Options for creating a tag
var options = {
  id: "Tag",
  parent: selected,
  field: "tags",
  modelInitializer: function (tag) {
    tag.name = "Tag1";
    tag.kind = type.Tag.TK_STRING; // or TK_BOOLEAN, TK_NUMBER, TK_REFERENCE, TK_HIDDEN
    tag.value = "String Value...";
    // tag.checked = true; // for TK_BOOLEAN
    // tag.number = 100; // for TK_NUMBER
    // tag.reference = ...; // for TK_REFERENCE
  }
}

// Create a tag to the selected element
var tag1 = app.factory.createModel(options)
```

[hashtag](#deleting-elements)

Deleting elements

To delete some elements, call `app.engine.deleteElements` function with model and view elements as arguments.

Copy

```
// Delete selected model elements
var models = app.selections.getSelectedModels()
app.engine.deleteElements(models, [])

// Or, delete selected view elements
var views = app.selections.getSelectedViews()
app.engine.deleteElements([], views)

// Delete all selected model and view elements
var models = app.selections.getSelectedModels()
var views = app.selections.getSelectedViews()
app.engine.deleteElements(models, views)
```

[hashtag](#modifying-elements)

Modifying elements

[hashtag](#change-property-value)

Change property value

You **should not** modify a property of an element directly like `class1.name = "New Name"` because all changes should be done via _operations_ which supports by undo and redo.

To change property value, use `app.engine.setProperty()` function as below:

Copy

```
// Get a selected element
var selected = app.selections.getSelected()
// Change property value
app.engine.setProperty(selected, 'name', 'New Name')
```

[hashtag](#examples)

Examples

[hashtag](#sequence-diagram)

Sequence Diagram

Here is an example to create a Sequence Diagram including two Lifelines and a Message.

Copy

```
var project = app.repository.select("@Project")[0]

var model1 = app.factory.createModel({ id: "UMLModel", parent: project })

// Create a Sequence Diagram
var options = {
  id: "UMLSequenceDiagram",
  parent: model1,
  diagramInitializer: function (dgm) {
    dgm.name = "MyDiagram";
  }
}
var diagram1 = app.factory.createDiagram(options)

// Create a Lifeline
var options1 = {
  id: "UMLLifeline",
  parent: diagram1._parent,
  diagram: diagram1,
  x1: 50,
  y1: 20,
  x2: 50,
  y2: 20
}
var lifelineView1 = app.factory.createModelAndView(options1)

// Create another Lifeline
var options2 = {
  id: "UMLLifeline",
  parent: diagram1._parent,
  diagram: diagram1,   
  x1: 150,
  y1: 20,
  x2: 150,
  y2: 20
}
var lifelineView2 = app.factory.createModelAndView(options2)

// Create a Message connecting the above two Lifelines
var options3 = {
  id: "UMLMessage",
  parent: diagram1._parent,
  diagram: diagram1, 
  x1: 50,
  y1: 100,
  x2: 150,
  y2: 100,
  tailView: lifelineView1,
  headView: lifelineView2,
  tailModel: lifelineView1.model,
  headModel: lifelineView2.model
}
var messageView1 = app.factory.createModelAndView(options3)
```

[PreviousAccessing Elementschevron-left](/developing-extensions/accessing-elements)[NextWorking with Selectionschevron-right](/developing-extensions/working-with-selection)

# Accessing Elements | StarUML documentation

copyCopychevron-down

# Accessing Elements

In this chapter, we're going to learn how to access elements. Before you read this chapter, you need to have clear understanding of the difference between software model and diagram as well as model elements and view elements. If you don't know about this, please read [Basic Concepts](/user-guide/basic-concepts) first.

In the following sections, we will use an example software model as shown in the below figure. Actual model file can be obtained from here: [https://github.com/staruml/staruml-dev-docs/blob/master/samples/Book.mdjarrow-up-right](https://github.com/staruml/staruml-dev-docs/blob/master/samples/Book.mdj). There are two classes **Book** and **Author** and a association **wrote** connecting between the two classes. In addition, there is a diagram named **Main** which containing three view elements, each corresponds to **Book**, **Author**, **wrote** respectively. All these elements and a diagram are contained by a model named **Model** which is also contained by the top-level project element named **Book Sample**.

![](https://docs.staruml.io/~gitbook/image?url=https%3A%2F%2Fgithub.com%2Fstaruml%2Fstaruml-dev-docs%2Fblob%2Fmaster%2Fimages%2FBook-sample.png%3Fraw%3Dtrue&width=768&dpr=3&quality=100&sign=8f19f1fd&sv=2)

Book Sample

[hashtag](#getting-a-top-level-project)

Getting a top-level project

First we will access to the top-level project element. The top-level project element can be obtained by using `app.project`.

Copy

```
var project = app.project.getProject()
console.log(project.name) // "Book Sample"
```

> **Note**
>
> all Javascript code examples can be executed in console (select **Debug > Show DevTools** and then click **Console** tab).

The obtained element is just a Javascript object, so you can access to any fields such as `project.name` or `project.ownedElements[0]`. Printing the element itself in console like `console.log(project)` is helpful to get all information about the element.

[hashtag](#inspecting-elements)

Inspecting elements

Then, how can we know which classes of elements are available and which attributes or operations are available for each class of elements? You can find documentations of the metamodel at [Metamodel documentationarrow-up-right](https://files.staruml.io/api-docs/6.0.0/metamodel/index.html) or additionally at [API Referencearrow-up-right](https://files.staruml.io/api-docs/6.0.0/api/index.html).

You can access to any elements via the top-level project. Containment structure is shown in **Explorer** of the above capture image.

Copy

```
var model = project.ownedElements[0]
console.log(model.name) // "Model"

var mainDiagram = model.ownedElements[0] 
console.log(mainDiagram.name) // "Main"

var book = model.ownedElements[1]
var author = model.ownedElements[2]
console.log(book.name) // "Book"
console.log(author.name) // "Author"

var association = book.ownedElements[0]
console.log(association.name) // "wrote"
console.log(association.end1.name) // "publications"
console.log(association.end1.multiplicity) // "1..*"
console.log(association.end2.name) // "authors"
console.log(association.end2.multiplicity) // "1..*"

var bookISBN = book.attributes[0]
console.log(bookISBN.name) // "ISBN"
console.log(bookISBN.type) // "String"
console.log(bookISBN.visibility) // "public"
console.log(bookISBN.isID) // true
```

So far we inspected model elements only, now you will see the view elements contained by the diagram **Main**.

Copy

```
var bookView = mainDiagram.ownedViews[0]
console.log(bookView.left) // 32
console.log(bookView.top) // 20
console.log(bookView.width) // 114
console.log(bookView.height) // 103
console.log(bookView.fillColor) // "#ffffff"
console.log(bookView.model.name) // "Book"
console.log(bookView.model === book) // true

var authorView = mainDiagram.ownedViews[1]
...
```

Each element has a corresponding Javascript class definition. The class definitions are in a global variable `type`.

Copy

```
console.log(project instanceof type.Project) // true
console.log(model instanceof type.UMLModel) // true
console.log(mainDiagram instanceof type.UMLClassDiagram) // true
console.log(book instanceof type.UMLClass) // true
console.log(bookISBN instanceof type.UMLAttribute) // true
console.log(association instanceof type.UMLAssociation) // true
console.log(bookView instanceof type.UMLClassView) // true
```

[hashtag](#undefined)

[hashtag](#retrieving-elements-by-query)

Retrieving elements by query

Accessing elements from the top-level project is very inconvenient and tedious. How can we get all elements of `UMLClass` type? To retrieve elements easily, StarUML provides a very simple select expression. Followings are several examples of select expression.

Copy

```
app.repository.select("@Project")
// returns elements of type.Project: [Project]

app.repository.select("@UMLClass")
// returns elements of type.UMLClass: [Book, Author]

app.repository.select("Model::Book")
// returns elements named "Book" contained by an element named "Model": [Book]

app.repository.select("Book.attributes")
// returns elements in 'attributes' field of an element named "Book": [ISBN, title, summary, publisher]

app.repository.select("@UMLAttribute[type=String]")
// returns elements of type.UMLAttribute only if whose 'type' field has "String" value: [ISBN, title, summary, publisher, name, biography]
```

You can make a query expression to select elements with the five selectors.

[hashtag](#name-selector-n)

Name Selector (N)

Select elements which has name specified by `N` (equivalent to value selector `[name=N]`).

Examples:

- `Class1` : All elements named by "Class1".
- `Class1::Attribute1` : All elements named by "Attribute1" only in the child elements of the element named by "Class1".

[hashtag](#children-selector-p)

Children Selector (P::)

Select all child elements of the element `P`.

Examples:

- `Package1::` : All child elements of the element named by "Package1".
- `Package1::@UMLClass` : All elements of type "UMLClass" only in the child elements of the element named by "Package1".

[hashtag](#type-selector-t)

Type Selector (@T)

Select all elements of type `T`.

Examples:

- `@UMLInterface` : All elements of type "UMLInterface".
- `@UMLClassifier` : All elements of type "UMLClassifier" (includes all descendant types: e.g. UMLClass, UMLInterface, UMLEnumeration, ...).
- `Package1::@UMLClass` : All elements of type "UMLClass" only in the child elements of the element named by "Package1".

[hashtag](#field-selector-.f)

Field Selector (.F)

Select all elements contained in the field `F`.

Examples:

- `Class1.attributes` : All attribute elements contained in `attributes` field of the "Class1" element(s).
- `Package1.ownedElements` : All elements contained in `ownedElements` field of the "Package1" element(s).
- `@UMLClass.operations` : All operation elements contained in `operations` field for all elements of type "UMLClass".

[hashtag](#value-selector-f-v)

Value Selector (\[F=V\])

Select all elements whose field `F` has value `V`.

Examples:

- `Class1.operations[isAbstract=false]` : All non-abstract (`isAbstract=false`) operations of "Class1" element(s).
- `Class1.attributes[isDerived=true]` : All derived (`isDerived=true`) attributes of "Class1" element(s).

[PreviousToolboxchevron-left](/developing-extensions/toolbox)[NextCreating, Deleting and Modifying Elementschevron-right](/developing-extensions/creating-deleting-and-modifying-elements)

# Toolbox | StarUML documentation

copyCopychevron-down

# Toolbox

If you want to add your tool items in **Toolbox**, you need to define a toolbox JSON in your extension. The toolbox JSON files should be placed in `toolbox/` folder in your extension.

Copy

```
my-extension/
└─ toolbox/
   └─ toolbox.json
```

[hashtag](#tool-group)

Tool Group

The toolbox JSON defines an array of Tool Group definitions as below:

Copy

```
[
  {
    "label": "Tool Group 1",
    "id": "tool-group-1",
    "diagram-types": [ "UMLClassDiagram" ],
    "items": [
      {
        "label": "Tool Item 1",
        "id": "tool-item-1",
        "icon": "icon-UMLClass",
        "rubberband": "rect",
        "command": "my:add-element",
        "command-arg": {
          "id": "UMLClass",
          "stereotype": "my-stereotype"
        }
      },
      ...
    ]
  },
  ...
]
```

- `label` : The tool group title shown in the Toolbox.
- `id` : Unique identifier.
- `diagram-types` : A list of diagram types. The tool group will be shown only when one of the diagram-types is active. (e.g. `"UMLClassDiagram"`, `"UMLUseCaseDiagram"`, ...)
- `items` : A list of tool item definitions.

[hashtag](#tool-item)

Tool Item

A tool item represents an element that users can create on a diagram.

- `label` : The tool item title shown in the Toolbox
- `id` : Unique identifier of the tool item.
- `icon` : Icon CSS class name. You can specify already defined icon names (e.g. `"icon-UMLClass"`, `"icon-UMLPackage"`, ...) or your own CSS class name in stylesheets of your extension.
- `rubberband` : A type of rubberband. One of `"rect"`(for sizable node-type elements), `"line"`(for edge-type elements), `"point"`(for fixed-size node-type elements).
- `command` : A command name to be executed.
- `command-arg` : An argument object will be passed to the command.

[hashtag](#command)

Command

A command used for tool item should create an element on a diagram. We strongly recommend to use `app.factory.createModelAndView()` function to create an element. See the [section](/developing-extensions/creating-deleting-and-modifying-elements#creating-a-model-element-and-a-view-element-at-once) for more detail.

Toolbox will pass `options` object to the command. The passed `options` parameter contains:

- `diagram` : The active diagram.
- `id` : The identifier of tool item.
- `x1`, `y1`, `x2`, `y2` : The user dragged area on the diagram.
- ... : `command-arg` are combined.

main.js

Copy

```
function handleAddElement (options) {
  options = Object.assign(options, {
    'model-init': {
      'stereotype': options.stereotype
    },
    'view-init': {
      'stereotypeDisplay': 'icon',
      'suppressAttributes': true,
      'suppressOperations': true
    }
  })
  return app.factory.createModelAndView(options)
}

app.commands.register('my:add-element', handleAddElement)
```

[PreviousKeymapschevron-left](/developing-extensions/keymaps)[NextAccessing Elementschevron-right](/developing-extensions/accessing-elements)

# Menus | StarUML documentation

copyCopychevron-down

# Menus

Menus are defined in one or more JSON files. A menu file can define or extend **application menu** and **context menus**. All menu files are loaded in alphabetical order.

Copy

```
{
  "menu": [],
  "context-menu": []
}
```

The menu JSON files should be placed in `menus/` folder of the extension.

Copy

```
my-extension/
└─ menus/
   └─ menu.json
```

[hashtag](#application-menu)

Application Menu

Now we're going to explain how to add menu items in application menu that is placed in the top of the screen except in Windows which placing on the top of the StarUML window.

[hashtag](#adding-a-top-level-menu-items)

Adding a top-level menu items

We will add a top-level menu item `Menu1` and three sub menu items `Sub Menu1`, `Sub Menu2` and `Sub Menu3`. There will be a separator between `Sub Menu2` and `Sub Menu3`.

We assumes that the commands corresponds to menu items were already defined. To add commands, please refer [Adding Commandsarrow-up-right](https://github.com/staruml/staruml-gitbook/tree/a4e7d94a6d3e900751c092bd56ef0f5f8b857276/developing-extensions/adding-commands.md).

Copy

```
{
  "menu": [
    {
      "id": "menu1",
      "label": "Menu1",
      "submenu": [
        {
          "label": "Sub Menu1",
          "id": "menu1.submenu1",
          "command": "example:function1"
        },
        {
          "label": "Sub Menu2",
          "id": "menu1.submenu2",
          "command": "example:function2"
        },
        { "type": "separator" },
        {
          "label": "Sub Menu3",
          "id": "menu1.submenu3",
          "command": "example:function3"
        }
      ]
    }
  ]
}
```

Each menu item may have following properties:

- **id** : Unique id of the menu item. If `id` is omitted, `command` id will be used for the id.
- **label** : Label for the menu item.
- **command** : A command id to be executed when the menu item selected.
- **submenu** : Submenu items of this menu item.
- **type** : Type of the menu item. One of the values `separator` | `checkbox`.
- **position** : Position of the menu item to be added. One of the values `first` | `last` (default) | `before` | `after`.
- **relative-id** : Relative menu item id for position `before` and `after`.

If you want to add a separator:

Copy

```
{ "type": "separator" }
```

[hashtag](#adding-menu-items-in-existing-menu-items)

Adding menu items in existing menu items

You can add menu items to an existing menu such as **File**, **Edit**, **Tools**, etc.

We're going to add two sub menu items under the existing **Tools** menu item. All menu items have unique ID. If `id` matches an existing id of menu item, submenu items will be added under the existing menu item.

Copy

```
{
  "menu": [
    {
      "id": "tools",
      "submenu": [
        {
          "label": "Tool Sub Menu1",
          "id": "tools.submenu1",
          "command": "example:function1"
        },
        {
          "label": "Tool Sub Menu2",
          "id": "tools.submenu2",
          "command": "example:function2"
        }
      ]
    }
  ]
}
```

[hashtag](#changing-states-of-menu-items)

Changing states of menu items

Each menu item has three states _checked_, _enabled_, and _visible_. Here we're going to show how to change the states of existing menu items. You will be able to see the changed state in the both application menu and context menus.

Checked state can be changed only for the menu item defined with type is `checkbox`. To change checked states of menu items as follow.

Copy

```
// Change checked states
var checkedStates = {
  'format.show-shadow': true,  //checked
  'format.auto-resize': false  // unchecked
}
app.menu.updateStates(null, null, checkedState)
```

You can also change the visible and enabled states of the menu item **Edit > Select All** as follow:

Copy

```
// Change visible state
app.menu.updateStates({ 'edit.select-all': false }, null, null)  // hide
app.menu.updateStates({ 'edit.select-all': true }, null, null)   // show

// Change enabled state
app.menu.updateStates(null, { 'edit.select-all': false }, null)  // disabled
app.menu.updateStates(null, { 'edit.select-all': true }, null)   // enabled
```

[hashtag](#context-menu)

Context Menu

Adding menu items to context menus is basically same with application menu. One difference is that there is only one application menu, but there may be multiple context menus. So the context menus are defined in the menu JSON files as follow:

Copy

```
{
  "context-menu": {
    "<dom-selector-for-context-menu1>": [],
    "<dom-selector-for-context-menu2>": [],
    ...
  }
}
```

[DOM selectorarrow-up-right](https://www.w3.org/TR/selectors-api/) is used to specify a context menu. This means the context menu will be popup when user click mouse right button on the DOM element specified by the DOM selector.

There are three predefined context menus with DOM selectors.

- `#diagram-canvas` : [Diagram Area](/user-guide/user-interface#diagram-area)
- `#model-explorer-holder .treeview` : [Model Explorer](/user-guide/user-interface#model-explorer)
- `#working-diagrams ul.listview` : [Working Diagrams](/user-guide/user-interface#working-diagrams).

[hashtag](#adding-menu-items-in-a-predefined-context-menu)

Adding menu items in a predefined context menu

We're going to add a menu item to a predefined context menu of **Diagram Area**.

Copy

```
{
  "context-menu": {
    "#diagram-canvas": [
      {
        "label": "Submenu1 for Diagram Area",
        "id": "example.submenu1",
        "command": "example:function1"
      }
    ]
  }
}
```

Click mouse right button on diagram area, you will see the added menu item in the context menu.

[hashtag](#adding-a-new-context-menu)

Adding a new context menu

StarUML even allows adding a new Context Menu for a specific DOM element. In here, instead of adding new DOM element we will use an existing DOM element, [Statusbar](/user-guide/user-interface#statusbar), which doesn't have any context menu.

**Statusbar** is defined as a DIV element like as `<div id="statusbar" ...></div>`. You can find in **Elements** tab of **DevTools** (**Debug > Show DevTools**). We can add a new Context Menu having only one menu item for **Statusbar** as follow:

Copy

```
{
  "context-menu": {
    "#statusbar": [
      {
        "label": "Submenu1 for StatusBar",
        "id": "example.submenu1",
        "command": "example:function1"
      }
    ]
  }
}
```

Click mouse right button on **Statusbar**, you will see the new context menu.

[PreviousCommandschevron-left](/developing-extensions/commands)[NextKeymapschevron-right](/developing-extensions/keymaps)

# Menus | StarUML documentation

copyCopychevron-down

# Menus

Menus are defined in one or more JSON files. A menu file can define or extend **application menu** and **context menus**. All menu files are loaded in alphabetical order.

Copy

```
{
  "menu": [],
  "context-menu": []
}
```

The menu JSON files should be placed in `menus/` folder of the extension.

Copy

```
my-extension/
└─ menus/
   └─ menu.json
```

[hashtag](#application-menu)

Application Menu

Now we're going to explain how to add menu items in application menu that is placed in the top of the screen except in Windows which placing on the top of the StarUML window.

[hashtag](#adding-a-top-level-menu-items)

Adding a top-level menu items

We will add a top-level menu item `Menu1` and three sub menu items `Sub Menu1`, `Sub Menu2` and `Sub Menu3`. There will be a separator between `Sub Menu2` and `Sub Menu3`.

We assumes that the commands corresponds to menu items were already defined. To add commands, please refer [Adding Commandsarrow-up-right](https://github.com/staruml/staruml-gitbook/tree/a4e7d94a6d3e900751c092bd56ef0f5f8b857276/developing-extensions/adding-commands.md).

Copy

```
{
  "menu": [
    {
      "id": "menu1",
      "label": "Menu1",
      "submenu": [
        {
          "label": "Sub Menu1",
          "id": "menu1.submenu1",
          "command": "example:function1"
        },
        {
          "label": "Sub Menu2",
          "id": "menu1.submenu2",
          "command": "example:function2"
        },
        { "type": "separator" },
        {
          "label": "Sub Menu3",
          "id": "menu1.submenu3",
          "command": "example:function3"
        }
      ]
    }
  ]
}
```

Each menu item may have following properties:

- **id** : Unique id of the menu item. If `id` is omitted, `command` id will be used for the id.
- **label** : Label for the menu item.
- **command** : A command id to be executed when the menu item selected.
- **submenu** : Submenu items of this menu item.
- **type** : Type of the menu item. One of the values `separator` | `checkbox`.
- **position** : Position of the menu item to be added. One of the values `first` | `last` (default) | `before` | `after`.
- **relative-id** : Relative menu item id for position `before` and `after`.

If you want to add a separator:

Copy

```
{ "type": "separator" }
```

[hashtag](#adding-menu-items-in-existing-menu-items)

Adding menu items in existing menu items

You can add menu items to an existing menu such as **File**, **Edit**, **Tools**, etc.

We're going to add two sub menu items under the existing **Tools** menu item. All menu items have unique ID. If `id` matches an existing id of menu item, submenu items will be added under the existing menu item.

Copy

```
{
  "menu": [
    {
      "id": "tools",
      "submenu": [
        {
          "label": "Tool Sub Menu1",
          "id": "tools.submenu1",
          "command": "example:function1"
        },
        {
          "label": "Tool Sub Menu2",
          "id": "tools.submenu2",
          "command": "example:function2"
        }
      ]
    }
  ]
}
```

[hashtag](#changing-states-of-menu-items)

Changing states of menu items

Each menu item has three states _checked_, _enabled_, and _visible_. Here we're going to show how to change the states of existing menu items. You will be able to see the changed state in the both application menu and context menus.

Checked state can be changed only for the menu item defined with type is `checkbox`. To change checked states of menu items as follow.

Copy

```
// Change checked states
var checkedStates = {
  'format.show-shadow': true,  //checked
  'format.auto-resize': false  // unchecked
}
app.menu.updateStates(null, null, checkedState)
```

You can also change the visible and enabled states of the menu item **Edit > Select All** as follow:

Copy

```
// Change visible state
app.menu.updateStates({ 'edit.select-all': false }, null, null)  // hide
app.menu.updateStates({ 'edit.select-all': true }, null, null)   // show

// Change enabled state
app.menu.updateStates(null, { 'edit.select-all': false }, null)  // disabled
app.menu.updateStates(null, { 'edit.select-all': true }, null)   // enabled
```

[hashtag](#context-menu)

Context Menu

Adding menu items to context menus is basically same with application menu. One difference is that there is only one application menu, but there may be multiple context menus. So the context menus are defined in the menu JSON files as follow:

Copy

```
{
  "context-menu": {
    "<dom-selector-for-context-menu1>": [],
    "<dom-selector-for-context-menu2>": [],
    ...
  }
}
```

[DOM selectorarrow-up-right](https://www.w3.org/TR/selectors-api/) is used to specify a context menu. This means the context menu will be popup when user click mouse right button on the DOM element specified by the DOM selector.

There are three predefined context menus with DOM selectors.

- `#diagram-canvas` : [Diagram Area](/user-guide/user-interface#diagram-area)
- `#model-explorer-holder .treeview` : [Model Explorer](/user-guide/user-interface#model-explorer)
- `#working-diagrams ul.listview` : [Working Diagrams](/user-guide/user-interface#working-diagrams).

[hashtag](#adding-menu-items-in-a-predefined-context-menu)

Adding menu items in a predefined context menu

We're going to add a menu item to a predefined context menu of **Diagram Area**.

Copy

```
{
  "context-menu": {
    "#diagram-canvas": [
      {
        "label": "Submenu1 for Diagram Area",
        "id": "example.submenu1",
        "command": "example:function1"
      }
    ]
  }
}
```

Click mouse right button on diagram area, you will see the added menu item in the context menu.

[hashtag](#adding-a-new-context-menu)

Adding a new context menu

StarUML even allows adding a new Context Menu for a specific DOM element. In here, instead of adding new DOM element we will use an existing DOM element, [Statusbar](/user-guide/user-interface#statusbar), which doesn't have any context menu.

**Statusbar** is defined as a DIV element like as `<div id="statusbar" ...></div>`. You can find in **Elements** tab of **DevTools** (**Debug > Show DevTools**). We can add a new Context Menu having only one menu item for **Statusbar** as follow:

Copy

```
{
  "context-menu": {
    "#statusbar": [
      {
        "label": "Submenu1 for StatusBar",
        "id": "example.submenu1",
        "command": "example:function1"
      }
    ]
  }
}
```

Click mouse right button on **Statusbar**, you will see the new context menu.

[PreviousCommandschevron-left](/developing-extensions/commands)[NextKeymapschevron-right](/developing-extensions/keymaps)

# Commands | StarUML documentation

copyCopychevron-down

# Commands

In this chapter, we're going to learn how to make commands.

[hashtag](#making-a-command)

Making a command

A command is an execution unit that can be called by menu item, keyboard shortcuts or any parts of applications via API. All menu items such as **File > Open...**, **Edit > Copy** have corresponding commands. So you must make a command first before to add a menu item. As shown in [Getting Started](/developing-extensions/getting-started), we will make a simple command showing a message in alert dialog.

First you have to defined an unique ID for a command. Typical command ID have the form `<group>:<function>` where `<group>` is the group name of commands and `<function>` is the function name of the command. An extension may have a set of commands, so typically the group name is the extension name. For example, the ID of the command showing a message of HelloWorld extension is `helloworld:show-message`.

And then, we will define a handler function to be executed when the command is called.

Copy

```
function handleShowMessage() {
  window.alert('Hello, world!')
}
```

Finally, we need to register this command to application by calling `app.commands.register` method. The first parameter is the ID of the command and the second is the handler function and the third (optional) is the display name of the command (Shown in [Command Palette](/user-guide/user-interface#command-palette)).

Copy

```
app.commands.register('helloworld:show-message', handleShowMessage, 'Show Message')
```

[hashtag](#calling-a-command)

Calling a command

Now we have a new `helloworld:show-message` command. It can be called manually as follow:

Copy

```
app.commands.execute('helloworld:show-message')
```

All functionalities of StarUML are defined as commands so that you can call without defining duplicated functionality.

Copy

```
var ids = Object.keys(app.commands.commands)
console.log(ids); // you can see all available command IDs
app.commands.execute('project:open') // execute `project:open` command
```

[hashtag](#passing-parameters)

Passing parameters

You can pass one or more parameters to the command. We will fix the handle function so that it can receive a parameter (two or more parameters are possible).

Copy

```
function handleShowMessage(message) {
  if (message) {
    window.alert(message)
  } else {
    window.alert('Hello, world!')
  }
}
```

Then, you can pass a string to the parameter as follow:

Copy

```
app.commands.execute('helloworld:show-message', 'New Message')
```

[PreviousGetting Startedchevron-left](/developing-extensions/getting-started)[NextMenuschevron-right](/developing-extensions/menus)
