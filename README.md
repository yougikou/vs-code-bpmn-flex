# BPMN Editor

View and edit BPMN diagrams in [VSCode](https://code.visualstudio.com/).

![VSCode BPMN Editor in use](https://raw.githubusercontent.com/yougikou/vs-code-bpmn-flex/main/docs/screenshot.png)


## Features

* View and edit [BPMN files](https://en.wikipedia.org/wiki/Business_Process_Model_and_Notation)
* Save changes to your local file
* Undo/redo and other keyboard shortcuts
* Create from empty `.bpmn` files
* Add i18n support

## Feature Details
1. Added Chinese, Japanese, English selector
2. Added custom attribute, elements to side panel to show
   1. Supported types: `attribute` (text input), `elementText` (textarea), `date`, `number`, `boolean` (select True/False).
   2. Add below setting configuration:
    ```json
       "bpmn-flex.commonProperties": [
        {
            "type": "attribute",
            "xpath": "name",
            "label": "Name"
        },
        {
            "type": "elementText",
            "xpath": "bpmn:documentation",
            "label": "Documentation"
        },
        {
            "type": "date",
            "xpath": "custom:startDate",
            "label": "Start Date"
        },
        {
            "type": "number",
            "xpath": "custom:priority",
            "label": "Priority"
        },
        {
            "type": "boolean",
            "xpath": "custom:isActive",
            "label": "Is Active"
        }
    ],
    "bpmn-flex.elementSpecificProperties": {
        "bpmn:Process": [
            {
              "type": "attribute",
              "xpath": "name",
              "label": "Name"
            }
        ],
        "bpmn:ServiceTask": [
          {
              "type": "elementText",
              "xpath": "bpmn:documentation",
              "label": "Documentation"
          }
        ]
    }
  ```

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
