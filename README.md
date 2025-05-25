# BPMN Editor

View and edit BPMN diagrams in [VSCode](https://code.visualstudio.com/).

![VSCode BPMN Editor in use](https://raw.githubusercontent.com/yougikou/vs-code-bpmn-flex/main/docs/screenshot.png)


## Features

* View and edit [BPMN files](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)
* Save changes to your local file
* Undo/redo and other keyboard shortcuts
* Create from empty `.bpmn` files
* Internationalization support for both the BPMN modeler and sidebar informational messages (English, Chinese, Japanese).
* Customizable properties display in the sidebar (see [Custom Properties Configuration](#custom-properties-configuration)).


## Installation

Download it from the VSCode Marketplace, search for `vs-code-bpmn-flex` directly inside VSCode.


## Build and Run

First step, clone this project to your local machine and open it with [VSCode](https://code.visualstudio.com/):

```sh
git clone https://github.com/yougikou/vs-code-bpmn-flex.git
cd ./vs-code-bpmn-flex
npm install
code .
```

Press `F5` to load and debug the extension in a new VSCode instance. To exectute the tests choose the *Extension Tests* in the Debug mode.

You can build the extension from the command line, too:

```sh
# execute the test suite
npm run test

# execute all scripts
npm run all
```


## License

MIT

Contains parts ([bpmn-js](https://github.com/bpmn-io/bpmn-js)) released under the [bpmn.io license](http://bpmn.io/license).

## Custom Properties Configuration

You can customize the properties displayed in the sidebar for selected BPMN elements by adding a configuration to your VS Code `settings.json` file (either user settings or workspace `.vscode/settings.json`). This configuration should be placed under the `bpmn-flex.customProperties` key. It allows you to define common properties for all elements and specific properties for particular BPMN types.

Each property definition is an object with the following fields:
*   `label`: (string, required) The label displayed for the property in the sidebar.
*   `xpath`: (string, required) An XPath-like expression to retrieve the property value from the element's business object, or a direct property name if using `displayType: 'textValue'`.
*   `displayType`: (string, optional) Defines how the `xpath` is interpreted.
    *   `property` (default if undefined): Interprets `xpath` to access attributes (e.g., `@id`), documentation (`bpmn:documentation/text()`), condition expressions (`bpmn:conditionExpression/text()`), or other properties from the element's business object.
    *   `textValue`: Interprets `xpath` as a direct key to access a text property from the element's `businessObject` (e.g., `name` for an element's name, `text` for a `bpmn:TextAnnotation`). If the key specified in `xpath` is not found, it will attempt to fall back to `businessObject.text` (for TextAnnotations) or `businessObject.name`.

### Example: `settings.json`

```json
// In your .vscode/settings.json or global settings
{
  "bpmn-flex.customProperties": {
    "common": [
      {
        "label": "Element ID",
        "xpath": "@id",
        "displayType": "property"
      },
      {
        "label": "Element Name",
        "xpath": "name",
        "displayType": "textValue"
      },
      {
        "label": "Documentation",
        "xpath": "bpmn:documentation/text()",
        "displayType": "property"
      }
    ],
    "elementSpecific": {
      "bpmn:TextAnnotation": [
        {
          "label": "Annotation Text",
          "xpath": "text",
          "displayType": "textValue"
        }
      ],
      "bpmn:SequenceFlow": [
        {
          "label": "Condition",
          "xpath": "bpmn:conditionExpression/text()",
          "displayType": "property"
        }
      ],
      "bpmn:UserTask": [
        {
          "label": "Assignee",
          "xpath": "@assignee",
          "displayType": "property"
        },
        {
          "label": "Priority",
          "xpath": "@priority"
        }
      ]
    }
  }
}
```

This configuration will display the "Element ID", "Element Name", and "Documentation" for all elements. For `bpmn:TextAnnotation` elements, it will also show "Annotation Text". For `bpmn:SequenceFlow` elements, it will show "Condition", and for `bpmn:UserTask` elements, it will show "Assignee" and "Priority".
