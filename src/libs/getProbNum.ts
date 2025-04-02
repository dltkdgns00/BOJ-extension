import * as vscode from "vscode";
import * as path from "path";

export function getProbNum(): string | undefined {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		// vscode.window.showErrorMessage(
		// 	"열린 에디터가 없습니다. 파일을 먼저 열어주세요."
		// );
		return undefined;
	}

	const filePath = editor.document.uri.fsPath;
	const dirName = path.basename(path.dirname(filePath));

	const match = dirName.match(/^(\d+)/);
	if (match) {
		return match[1];
	} else {
		// vscode.window.showErrorMessage(
		// 	"문제 번호를 찾을 수 없습니다. 폴더명이 숫자로 시작하는지 확인해주세요."
		// );
		return undefined;
	}
}
