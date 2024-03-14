import * as vscode from "vscode";
import * as path from "path";

export function getProbNum(): string | null {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showErrorMessage("No editor found.");
		return null;
	}

	const filePath = editor.document.uri.fsPath;
	const dirName = path.basename(path.dirname(filePath));

	const match = dirName.match(/^(\d+)/);
	if (match) {
		return match[1];
	} else {
		vscode.window.showErrorMessage("Problem number not found.");
		return null;
	}
}
