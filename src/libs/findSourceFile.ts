import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { platform } from "os";

/**
 * 문제 번호를 기반으로 워크스페이스에서 소스 코드 파일을 찾는 함수
 * @param problemNumber 찾을 문제 번호
 * @returns 찾은 파일의 경로 또는 undefined
 */
export async function findSourceFileByProblemNumber(
	problemNumber: string
): Promise<string | undefined> {
	// 워크스페이스가 열려있는지 확인
	if (
		!vscode.workspace.workspaceFolders ||
		vscode.workspace.workspaceFolders.length === 0
	) {
		return undefined;
	}

	const config = vscode.workspace.getConfiguration("BOJ");
	const extension = config.get<string>("extension", "");

	if (!extension) {
		vscode.window.showWarningMessage(
			"BOJ 확장자 설정이 되어있지 않습니다. 설정에서 확인해주세요."
		);
		return undefined;
	}

	try {
		// 1. 일반 콜론(:)만 사용하는 검색 패턴
		const folderPattern = `**/${problemNumber}번:*`;
		const folders = await vscode.workspace.findFiles(folderPattern, null, 5);

		let foundFiles: vscode.Uri[] = [];

		if (folders.length > 0) {
			// 문제 폴더를 찾았으면, 그 폴더들의 고유한 상위 디렉토리 목록 생성
			const problemFolderPaths = folders.map((f) => path.dirname(f.fsPath));
			const uniqueFolderPaths = [...new Set(problemFolderPaths)];

			// 각 폴더 경로에서 파일 찾기
			for (const folderPath of uniqueFolderPaths) {
				// 해당 폴더의 모든 .{extension} 파일 찾기
				const filesInFolder = await vscode.workspace.findFiles(
					`${folderPath}/${problemNumber}번:*/*.${extension}`
				);

				if (filesInFolder.length > 0) {
					foundFiles = foundFiles.concat(filesInFolder);
					continue; // 파일을 찾았으면 다음 폴더로 이동
				}

				// 폴더 이름 패턴에서 문제 이름 추출 시도
				try {
					// 폴더 내의 모든 디렉토리를 찾아서 정확한 문제 폴더를 찾음
					// 일반 콜론(:)만 사용
					const problemDirs = fs
						.readdirSync(folderPath, { withFileTypes: true })
						.filter((dirent) => dirent.isDirectory())
						.filter((dirent) => dirent.name.startsWith(`${problemNumber}번:`))
						.map((dirent) => path.join(folderPath, dirent.name));

					for (const problemDir of problemDirs) {
						// 이 디렉토리 내의 모든 .{extension} 파일 찾기
						const files = fs
							.readdirSync(problemDir)
							.filter((file) => file.endsWith(`.${extension}`))
							.map((file) => path.join(problemDir, file));

						if (files.length > 0) {
							foundFiles = foundFiles.concat(
								files.map((f) => vscode.Uri.file(f))
							);
							break;
						}
					}
				} catch (e) {
					console.error(`폴더 읽기 오류: ${e}`);
				}
			}
		}

		// 2. 파일을 찾지 못했다면, 워크스페이스에서 다양한 패턴으로 폴더 검색
		if (foundFiles.length === 0) {
			// 일반 콜론만 사용하는 패턴
			const pattern = `**/${problemNumber}번:*/*.${extension}`;
			const files = await vscode.workspace.findFiles(pattern);
			if (files.length > 0) {
				foundFiles = foundFiles.concat(files);
			}
			if (platform.name === "win32") {
				// Windows에서만 사용하는 패턴
				const windowsPattern = `**/${problemNumber}번 - */*.${extension}`;
				const windowsFiles = await vscode.workspace.findFiles(windowsPattern);
				if (windowsFiles.length > 0) {
					foundFiles = foundFiles.concat(windowsFiles);
				}
			}
		}

		// 3. 여전히 파일을 찾지 못했다면, 문제 번호를 포함한 폴더 내의 모든 파일을 검색
		if (foundFiles.length === 0) {
			const loosePattern = `**/*${problemNumber}*/*.${extension}`;
			foundFiles = await vscode.workspace.findFiles(loosePattern);
		}

		// 4. 최후의 수단으로 문제 번호를 포함한 파일명 검색
		if (foundFiles.length === 0) {
			const fileNamePattern = `**/*${problemNumber}*.${extension}`;
			foundFiles = await vscode.workspace.findFiles(fileNamePattern);
		}

		// 한 개의 파일만 찾은 경우
		if (foundFiles.length === 1) {
			return foundFiles[0].fsPath;
		} else if (foundFiles.length !== 0 && foundFiles.length > 1) {
			// 여러 파일이 있을 경우 사용자에게 선택하도록 함
			const fileOptions = foundFiles.map((file) => {
				const fileName = path.basename(file.fsPath);
				const dirName = path.basename(path.dirname(file.fsPath));
				return {
					label: fileName,
					description: dirName,
					detail: file.fsPath,
					file: file.fsPath,
				};
			});

			const selectedFile = await vscode.window.showQuickPick(fileOptions, {
				placeHolder: `${problemNumber}번 문제의 여러 파일이 발견되었습니다. 사용할 파일을 선택하세요.`,
			});

			return selectedFile ? selectedFile.file : undefined;
		}
	} catch (error) {
		console.error("파일 검색 중 오류 발생:", error);
		vscode.window.showErrorMessage(
			`파일 검색 중 오류가 발생했습니다: ${error}`
		);
		return undefined;
	}
}

/**
 * 문제 번호에 해당하는 소스 파일을 찾아 내용을 반환
 * @param problemNumber 문제 번호
 * @returns 찾은 코드 또는 빈 문자열
 */
export async function getSourceCodeByProblemNumber(
	problemNumber: string
): Promise<string> {
	// 열린 에디터들 확인
	if (vscode.window.activeTextEditor) {
		const activeDocument = vscode.window.activeTextEditor.document;
		const activePath = activeDocument.fileName;

		if (activePath.includes(problemNumber)) {
			return activeDocument.getText();
		}
	}

	// 모든 열린 텍스트 에디터에서 찾기
	for (const editor of vscode.window.visibleTextEditors) {
		const document = editor.document;
		const path = document.fileName;

		if (path.includes(problemNumber)) {
			return document.getText();
		}
	}

	// 파일 시스템에서 찾기
	const filePath = await findSourceFileByProblemNumber(problemNumber);
	if (filePath && fs.existsSync(filePath)) {
		return fs.readFileSync(filePath, "utf8");
	}

	// 열린 에디터가 있다면 현재 활성화된 에디터의 코드 반환
	if (vscode.window.activeTextEditor) {
		return vscode.window.activeTextEditor.document.getText();
	}

	return "";
}
