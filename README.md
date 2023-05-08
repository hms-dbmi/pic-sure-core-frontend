# PIC-SURE HPDS UI
[![GitHub license](https://img.shields.io/github/license/hms-dbmi/pic-sure-hpds-ui)](https://github.com/hms-dbmi/pic-sure-hpds-ui/blob/master/LICENSE)

Welcome to the PIC-SURE HPDS UI repository! This repository contains the source code for the PIC-SURE HPDS UI, a web-based graphical user interface for accessing and querying datasets hosted on the PIC-SURE HPDS (High-performance Data Store) platform.

The PIC-SURE HPDS UI is designed to provide an intuitive, easy-to-use interface for researchers, enabling them to explore and analyze large-scale biomedical datasets without requiring extensive programming knowledge.

This README provides an overview of the main modules included in this repository.

## Modules
### 1. pic-sure-hpds-ui
The pic-sure-hpds-ui module contains the core user interface components for the PIC-SURE HPDS UI. This module is responsible for the overall layout, styling, and navigation within the application. It also handles user interactions, such as searching for variables, submitting queries, and visualizing results.

#### Features include:

- Search and filter functionality for dataset variables
- Query builder for creating complex queries using logical operators
- Visualization of query results as tables, charts, and other graphical representations
- Export of query results in various formats, such as CSV, JSON, or XML

### 2. pic-sure-hpds-ui-extension-archetype
The pic-sure-hpds-ui-extension-archetype module provides a template for creating custom extensions to the PIC-SURE HPDS UI. These extensions can be used to add new features, modify existing ones, or integrate with external services and applications.

By using this module, developers can create a custom extension with the necessary structure and dependencies, allowing them to focus on implementing their desired functionality.

#### How to use the archetype
To create a new custom extension, run the following command:

```
mvn archetype:generate -DarchetypeGroupId=edu.harvard.hms.dbmi.avillach \
-DarchetypeArtifactId=pic-sure-hpds-ui-extension-archetype \
-DarchetypeVersion=1.0.0-SNAPSHOT \
-DgroupId=<your-group-id> \
-DartifactId=<your-artifact-id> \
-Dversion=<your-version>
```

This will create a new project with the specified group ID, artifact ID, and version number. The project will be pre-configured with the necessary dependencies and project structure for creating a custom extension.

#### Features include:

- Pre-configured project structure with required dependencies
- Sample code for creating custom UI components and services
- Documentation and guidelines for developing and integrating custom extensions

### 3. pic-sure-hpds-ui-libs
The pic-sure-hpds-ui-libs module contains a collection of utility libraries and services that are used throughout the PIC-SURE HPDS UI. These libraries handle common tasks, such as communication with the PIC-SURE API, parsing and formatting data, and managing user authentication and authorization.

## Getting Started
WIP

## Contributing
We welcome contributions to the PIC-SURE HPDS UI project. Please refer to the [CONTRIBUTING](https://github.com/hms-dbmi/pic-sure-all-in-one/blob/master/CONTRIBUTING.md) file for guidelines on how to contribute, submit issues, and propose improvements.

## License
This project is licensed under the Apache License 2.0 - see the [LICENSE](https://github.com/hms-dbmi/pic-sure-hpds-ui/blob/master/LICENSE) file for details.