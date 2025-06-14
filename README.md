# Thothglyph support for Visual Studio Code

This extension provides language support for Thothglyph to Visual Studio Code.

## Features

* File Export
* Live Preview
* Editor Enhancement

## Requirements

* Python >= 3.7
* Tex Live (Windows)

## Usage

### File Export

* Open .tglyph or .md file, and activate the editor
* ``Ctrl + E`` to export file (default file format: HTML)
* ``Ctrl + Shift + E`` to export file after selecting file format

### Live Preview

* Open .tglyph or .md file, and activate the editor
* ``Ctrl + R`` to set file as preview
* ``Ctrl + Shift + V`` to open preview
* Save the file, the preview automatically update

### Editor Enhancement

* Input .tglyph symbols

See [document](https://thothglyph-doc.readthedocs.io/en/latest/tool/vscode.html)

## Known Issues

### Character encoding error on Windows

Please add a setting to open the terminal with UTF-8 to settings.json.
