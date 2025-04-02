import * as vscode from "vscode";
import { searchProblem } from "../libs/searchProblem";
import { spawn, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export async function runTestCase(
	context: vscode.ExtensionContext,
	problemNumber?: string
) {
	let editor = vscode.window.activeTextEditor;
	let filePath: string | undefined;

	// 단계 1: 문제 번호 확인
	let probNum = problemNumber;
	if (!probNum) {
		probNum = context.globalState.get("currentProblemNumber");
	}

	if (!probNum) {
		if (editor) {
			const fileName = editor.document.fileName;
			const match = fileName.match(/(\d+)/);
			if (match) {
				probNum = match[1];
			}
		}
	}

	if (!probNum) {
		vscode.window.showErrorMessage("문제 번호를 찾을 수 없습니다.");
		return;
	}

	// 단계 2: 소스 코드 파일 찾기
	if (editor) {
		// 이미 열린 에디터가 있는 경우 해당 파일 사용
		filePath = editor.document.uri.fsPath;
	} else {
		// 에디터가 열려있지 않다면 워크스페이스에서 해당 문제 번호의 파일 찾기
		filePath = await findSourceFileByProblemNumber(probNum);

		if (!filePath) {
			vscode.window.showErrorMessage(
				`문제 ${probNum}번의 소스 코드 파일을 찾을 수 없습니다.`
			);
			return;
		}
	}

	// 파일을 찾았다면 컴파일하고 실행하기 (파일을 열지 않고도 가능)
	const outputChannel = vscode.window.createOutputChannel("Test Cases");
	try {
		const sp = await searchProblem(probNum, context);

		if (!sp.sampleInputs || !sp.sampleOutputs) {
			vscode.window.showErrorMessage(
				"예제 입력 또는 출력을 찾을 수 없습니다. 문제 페이지를 확인해주세요."
			);
			return;
		}

		const config = vscode.workspace.getConfiguration("BOJ");
		const extension = config.get<string>("extension", "");

		const maxWidth = 40;

		const preMessage1 = centerText(` ${probNum}. ${sp.title} `, maxWidth);
		const preMessage2 = `문제링크: https://boj.kr/${probNum}`;

		outputChannel.appendLine(preMessage1);
		outputChannel.appendLine(preMessage2);
		outputChannel.appendLine(``);

		filePath = filePath.replace(/\\/g, "/");

		outputChannel.appendLine(`소스 파일: "${filePath}"`);
		outputChannel.appendLine(``);

		const createOutputMessage = (testCaseIndex, result, expected, actual) => {
			const passedMessage = `✅ Test Case #${
				testCaseIndex + 1
			}: Passed\n${centerText(` Output `, maxWidth)}\n${actual}`;
			const failedMessage = `❌ Test Case #${
				testCaseIndex + 1
			}: Failed\n${centerText(` Expected `, maxWidth)}\n${expected}${centerText(
				` Actual `,
				maxWidth
			)}\n${actual}`;

			return result ? passedMessage : failedMessage;
		};

		const runTest = (input, expectedOutput, testCaseIndex) => {
			return new Promise<void>((resolve, reject) => {
				const processIO = getProcessIO(extension, filePath!);
				let outputData = "";

				processIO!.stdout.on("data", (data) => {
					outputData += data.toString();
				});

				processIO!.stderr.on("data", (data) => {
					console.error(`에러: ${data}`);
					outputData += data.toString();
				});

				processIO!.on("close", (code) => {
					const actualOutput = outputData.trim();
					const isPassed = actualOutput === expectedOutput.trim();
					const message = createOutputMessage(
						testCaseIndex,
						isPassed,
						expectedOutput,
						actualOutput
					);
					outputChannel.appendLine(message);

					resolve();
				});

				processIO!.on("error", (err) => {
					console.error(`에러: ${err}`);
					outputData += err.toString();
				});

				processIO!.stdin.write(input);
				processIO!.stdin.end();
			});
		};

		for (let i = 0; i < sp.sampleInputs.length; i++) {
			await runTest(sp.sampleInputs[i], sp.sampleOutputs[i], i);
		}

		const postMessage1 = centerText(` 채점 종료 `, maxWidth - 2);
		outputChannel.appendLine(``);
		outputChannel.appendLine(postMessage1);
		outputChannel.show(true);
	} catch (error) {
		vscode.window.showErrorMessage(
			"테스트 케이스 실행 중 오류가 발생했습니다. 직접 실행해서 오류를 확인해주세요."
		);
	}
}

/**
 * 문제 번호를 기반으로 워크스페이스에서 소스 코드 파일을 찾는 함수
 * @param problemNumber 찾을 문제 번호
 * @returns 찾은 파일의 경로 또는 undefined
 */
async function findSourceFileByProblemNumber(
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

		// 파일을 찾지 못한 경우
		if (foundFiles.length === 0) {
			// 파일이 없는 경우, 새 파일 생성 제안
			const createFile = await vscode.window.showInformationMessage(
				`문제 ${problemNumber}번 파일을 찾을 수 없습니다. 새 파일을 생성하시겠습니까?`,
				"예",
				"아니오"
			);

			if (createFile === "예") {
				// createProblem 명령어 호출
				await vscode.commands.executeCommand(
					"BOJ-EX.createProblem",
					problemNumber
				);
				// 새 파일 생성 후 다시 검색
				return findSourceFileByProblemNumber(problemNumber);
			}
			return undefined;
		}

		// 한 개의 파일만 찾은 경우
		if (foundFiles.length === 1) {
			return foundFiles[0].fsPath;
		}

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
	} catch (error) {
		console.error("파일 검색 중 오류 발생:", error);
		vscode.window.showErrorMessage(
			`파일 검색 중 오류가 발생했습니다: ${error}`
		);
		return undefined;
	}
}

function centerText(text, maxWidth) {
	const padding = Math.max(0, maxWidth - text.length);
	const paddingLeft = Math.floor(padding / 2);
	const paddingRight = padding - paddingLeft;
	return "-".repeat(paddingLeft) + text + "-".repeat(paddingRight);
}

function getProcessIO(extension: string, filePath: string) {
	if (extension === "c") {
		const objectFileURL = filePath.replace(/\.[^/.]+$/, "");
		execSync(`gcc "${filePath}" -o "${objectFileURL}"`);
		return spawn(`${objectFileURL}`);
	} else if (extension === "cpp") {
		const objectFileURL = filePath.slice(0, filePath.length - 4);
		execSync(`g++ -std=c++17 "${filePath}" -o "${objectFileURL}"`);
		return spawn(`${objectFileURL}`);
	} else if (extension === "java") {
		const dirName = path.dirname(filePath);
		return spawn(`java`, ["-cp", dirName, filePath]);
	} else if (extension === "js") {
		return spawn("node", [filePath]);
	} else if (extension === "rs") {
		const fileName = path.basename(filePath, ".rs");
		const crateName = fileName.replace(/[^a-zA-Z0-9]+/g, "_").toLowerCase();
		const objectFileURL = path.join(".", `${crateName}.out`);
		const dirName = path.dirname(filePath);
		const options = {
			cwd: path.dirname(filePath),
			env: {
				...process.env,
				RUSTC_FLAGS: "-D tempdir=/tmp",
			},
		};
		execSync(
			`rustc --crate-name "${crateName}" "${filePath}" -o "${objectFileURL}"`,
			options
		);
		return spawn(`${dirName}/${objectFileURL}`);
	} else if (extension === "py") {
		return spawn("python3", [filePath]);
	}
}
