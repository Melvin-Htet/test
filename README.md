# ZEN ACUMEN - Offline Application Suite

A suite of offline, browser-based tools designed to assist with file processing and verification tasks commonly associated with system configuration and data management. All tools run entirely in your browser, ensuring that your data remains private and secure.

## Features

This application suite includes three main tools:

### 1. INI Generator

*   **Purpose**: To generate or update a recipe `.ini` file based on a `.vtl` template file and a `.csv` recipe data file.
*   **Usage**:
    1.  Load a VTL file (`.vtl`).
    2.  Load a recipe data file (`.csv`).
    3.  Load an existing INI file (`.ini`) to be updated.
    4.  Select the appropriate hardware family.
    5.  Click "Generate INI" to produce the new or updated INI file content.
    6.  You can then download the generated file or export a summary of the changes.

### 2. Offline Checker

*   **Purpose**: To compare different versions of configuration and data files to identify changes before releasing them to a production environment.
*   **Usage**:
    1.  Select the types of files you want to compare (DDF, VTL, INI, Excel).
    2.  For each selected file type, upload the "Current Revision" and the "New Revision to Release".
    3.  Click "Compare Revisions".
    4.  The tool will display a detailed comparison, highlighting any differences found.
    5.  You can copy all results to your clipboard for reporting.

### 3. VTL Viewer

*   **Purpose**: To parse and inspect the contents of a VTL (`.vtl` or `.xml`) file. This tool allows you to view data for specific SKUs defined within the file.
*   **Usage**:
    1.  Upload a VTL file.
    2.  Once the file is parsed, a dropdown list of all SKUs found in the file will appear.
    3.  Select an SKU from the list to view its associated data, including I2C addresses, part aliases, and partition data.

## How to Use

No installation is required. Simply open the `index.html` file in a modern web browser (like Chrome, Firefox, or Edge).

## Styling

The user interface is styled using [Tailwind CSS](https://tailwindcss.com/). The styles are applied via a combination of utility classes in the HTML and a `<style>` block in the `<head>` for more complex or shared styles. The application uses the Inter and Roboto Mono fonts, loaded from Google Fonts.
